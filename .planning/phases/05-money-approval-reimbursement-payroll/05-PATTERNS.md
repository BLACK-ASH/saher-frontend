# Phase 5: Money & Approval — Reimbursement & Payroll - Pattern Map

## 1. File Inventory

### New Files

Feature component filenames are at agent's discretion (CONTEXT §Discretion) — names below follow the noticeboard/leave kebab-case convention.

| File | Role | Data Flow | Analog |
|------|------|-----------|--------|
| `services/reimbursement.api.ts` | service | CRUD | `services/notice.api.ts` (zod mirror, restore endpoint) + `services/leave.api.ts` (paginated search) |
| `services/payroll.api.ts` | service | CRUD | `services/leave.api.ts` |
| `hooks/use-reimbursement.ts` | hook | CRUD + batch (bulk handling) | `hooks/use-notice.ts` |
| `hooks/use-payroll.ts` | hook | CRUD | `hooks/use-notice.ts` |
| `hooks/use-user-map.ts` | hook | request-response (D-32) | query inside `components/user-search-picker.tsx:36-40` |
| `app/(main)/reimbursement/my-bills/page.tsx` | page | request-response | `app/(main)/noticeboard/page.tsx` (tabs) + `features/leave/page.tsx` (table+dialog wiring) |
| `app/(main)/reimbursement/management/page.tsx` | page | CRUD | `features/leave/admin-page.tsx` + `app/(main)/noticeboard/page.tsx` (Handle Queue \| Recycle Bin tabs) |
| `app/(main)/(admin)/payroll/page.tsx` | page | CRUD | `features/leave/admin-page.tsx` |
| `features/reimbursement/bill-status-badge.tsx` | feature-component | transform | `features/leave/leave-status-badge.tsx` |
| `features/reimbursement/balance-card.tsx` | feature-component | request-response | `features/leave/leave-balance-card.tsx` |
| `features/reimbursement/bill-table.tsx` | feature-component | CRUD | `features/leave/leave-table.tsx` (row actions, PaginationFooter) |
| `features/reimbursement/bill-detail-dialog.tsx` | feature-component | request-response | `features/leave/leave-details-dialog.tsx` (detail + conditional actions) |
| `features/reimbursement/create-bill-dialog.tsx` | feature-component | file-I/O (images) + CRUD | `features/leave/apply-leave-dialog.tsx` (RHF+zod+ImageUpload) |
| `features/reimbursement/handle-bill-dialog.tsx` | feature-component | CRUD | `features/leave/review-leave-dialog.tsx` (status RadioGroup + required comment) |
| `features/reimbursement/settle-dialog.tsx` | feature-component | CRUD | `features/leave/review-leave-dialog.tsx` (mode RadioGroup) |
| `features/reimbursement/advance-bill-dialog.tsx` | feature-component | CRUD | review-leave-dialog form + `components/user-search-picker.tsx` |
| `features/reimbursement/lifecycle-timeline.tsx` | feature-component | transform | no direct analog — compose from Badge (`bill-status-badge`) + IST dates (`lib/date.ts`) |
| `features/reimbursement/bulk-action-bar.tsx` | feature-component | batch | no direct analog — sequential mutation loop pattern below |
| `features/payroll/payroll-table.tsx` | feature-component | CRUD | `features/leave/leave-table.tsx` |
| `features/payroll/record-payment-dialog.tsx` | feature-component | CRUD | `features/leave/review-leave-dialog.tsx` |

### Modified Files

| File | Role | Primary Analog |
|------|------|---------------|
| `components/sidebar/nav-list.tsx` | navigation | same file — add entries to existing route arrays + `can()` gating |

### Unchanged (reuse as-is)

| File | Role |
|------|------|
| `components/image-upload.tsx` | receipt upload (D-06/D-18); props at lines 31-35: `{ altName, url?, onUploadSuccess?(data: UploadedImage) }`, returns `{ id, url, ... }` |
| `components/user-search-picker.tsx` | advance-bill user selection (D-15), single-select mode |
| `components/shared/pagination-footer.tsx` | props `{ page, totalPages, onPageChange }` |
| `components/shared/trash-tab-pattern.tsx` | recycle-bin wrapper — pass children (bills DO have a list endpoint, unlike notices) |
| `lib/api-wrapper.ts` / `lib/normalize-list.ts` | all HTTP + pagination normalization |
| `lib/date.ts` | `dateInputToIso` (line 123) for bill date submit; `formatIstDateTime` for timeline/audit timestamps |
| `lib/permissions.ts` | `can(role, action, resource)` — resources `preReimbursement`, `postReimbursement`, `payroll` already present |
| `hooks/use-me.ts` | role source for `can()` gating |

---

## 2. File-by-File Patterns

### `services/reimbursement.api.ts`

**Analog:** `services/notice.api.ts` (schema-mirror style, soft-delete + restore) + `services/leave.api.ts` (request schemas with validation messages, paginated list).

**Schema-mirror pattern** (notice.api.ts:4-15):

```ts
// Mirrors backend notice.schema.ts / notice.model.ts exactly (D-20).
export const noticeSchema = z.object({
  _id: z.string(),
  ...
});
export type NoticeResponse = z.infer<typeof noticeSchema>;
```

Apply verbatim to the RESEARCH §Response Shape Reference shapes: `billSchema` (id/user/image?/amount/advance/date/description/status enum `["pending","accept","reject","on-hold"]`/reason?/isDeleted), `settlementSchema` (mode enum `["cash","upi","cheque","-"]`, status enum `["pending","settle","expired","on-hold"]`, expiredAt), `balanceEnquirySchema` (**`Total: z.string()`** — Quirk 5), `auditLogSchema`.

**Request schemas with inline validation** (leave.api.ts:37-58 pattern):

```ts
export const applyLeaveSchema = z
  .object({
    reason: z.string().trim().min(5, "Reason must contain at least 5 characters")...,
  })
  .refine(...);
```

Apply to `handleBillSchema = z.object({ status: z.enum(["accept","reject","on-hold"]), reason: z.string().min(...) })` — **field name is `reason`, UI label may say "Notes"** (D-10, Quirk 4). Also `userBillCreateSchema`, `userBillUpdateSchema` (amount/description/images only — date locked, D-07), `handleSettleSchema` (D-19).

**Paginated search function** (leave.api.ts:272-287):

```ts
export const getLeaveApplications = async ({ page = 1, limit = 10 }) => {
  const res = await apiFetch<LeaveT[]>(`/api/leave/application?page=${page}&limit=${limit}`, { method: "GET" });
  return normalizeList<LeaveT>(res);
};
```

Bill-search equivalent must always send ≥1 search param or backend 400s (Quirk 10). With D-31 backend fix: `GET /api/reimbursement/?status=pending&isDeleted=false&page=&limit=`.

**Restore endpoint analog** (notice.api.ts:61-64) — this exact shape exists for bills after D-30:

```ts
// PATCH /notice/:id/restore — clears the soft-delete flag.
export const restoreNotice = async (id: string) => {
  await apiFetch(`/api/notice/${id}/restore`, { method: "PATCH" });
};
```

→ `restoreBill = async (billId: string) => apiFetch(`/api/reimbursement/${billId}/restore`, { method: "PATCH" })`. **Depends on D-30 backend endpoint — flag as ordering dependency.**

Non-paginated arrays (`mybills`, `recyclebills`) return `res.data` directly like notice.api.ts:27-32 — do NOT use normalizeList when there is no meta.

---

### `services/payroll.api.ts`

**Analog:** `services/leave.api.ts` — same structure.

Two gotchas to encode in schemas/types:
1. **Single-record GET returns an array** (Quirk 6): type the by-id response as `PayrollResponse[]` and access `[0]` at the call site.
2. **Installment PUT sends the INCREMENTAL amount** (Quirk 8): `updatePayroll({ id, data: { mode, paidSalary } })` where `paidSalary` is the new payment, not cumulative.

`runPayrollCron` mirrors `deleteNotice` (notice.api.ts:57-59): empty-body POST, return nothing.

---

### `hooks/use-reimbursement.ts`

**Analog:** `hooks/use-notice.ts:12-49` — one hook per module, shared invalidation helper, flat object bag:

```ts
const invalidateNotices = () => {
  queryClient.invalidateQueries({ queryKey: ["notices"] });
};
const removeNotice = useMutation({
  mutationFn: deleteNotice,
  onSuccess: invalidateNotices,
});
```

→ keys `["bills", "my", ...params]`, `["bills", "search", filters, page]`, `["bills", "recycle"]`, `["balance"]`, `["audit-log", page]`; every mutation invalidates the broad `["bills"]` key (money rule D-29: no optimistic updates, server refetch is truth).

**Bulk sequential mutation (D-11/D-27)** — no analog exists. Build inside the hook as plain state + loop over the single-bill mutation:

```ts
const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
const handleOne = useMutation({ mutationFn: handleBillApi, onSuccess: invalidate });

const handleMany = async (items: { billId: string; status: "accept"|"reject"|"on-hold"; reason: string }[]) => {
  setBulkProgress({ done: 0, total: items.length });
  const failures: string[] = [];
  for (const item of items) {
    try { await handleBillApi(item); }
    catch { failures.push(item.billId); } // apiFetch already toasted the error
    setBulkProgress((p) => p && { ...p, done: p.done + 1 });
  }
  setBulkProgress(null);
  invalidate();
  // toast success/failure summary per D-27
};
```

**Settlement-after-accept flow (Pitfall 2):** accept response is `{ data: null }`; the settlement id comes from re-fetching `GET /:billId` (queries Settlement collection). Encode as a comment + rely on invalidation-driven refetch of detail.

**`useUserMap()` (D-32)** — reuse the picker's query shape (user-search-picker.tsx:36-40):

```ts
useQuery({ queryKey: ["users", debouncedKeyword], queryFn: () => getSearchUser(debouncedKeyword),
  enabled: debouncedKeyword.trim().length >= 2 })
```

but keyed `["users", "map"]` with staleTime, returning `Record<userId, MailUser>` so bill/settlement tables resolve `user` ID → name (Pitfall 5: `user` fields are raw IDs).

---

### `features/reimbursement/handle-bill-dialog.tsx` (and settle/installment dialogs)

**Analog:** `features/leave/review-leave-dialog.tsx` — it IS the approve/reject-with-comment dialog, including the double-submit guard (D-26):

Form setup (lines 44-56):

```ts
const form = useForm<ReviewLeaveType>({
  resolver: zodResolver(reviewLeaveSchema),
  defaultValues: { status: initialStatus, managerComment: "" },
});
// 🔥 re-sync decision each time the dialog opens (✓ approves, ✗ rejects)
useEffect(() => {
  if (open) form.reset({ status: initialStatus, managerComment: "" });
}, [open, initialStatus, form]);
```

Submit + error path (lines 58-76): mutate, `toast.success` + close + reset on success. For money mutations add the D-28 rule explicitly: **onError toast only, dialog stays open** (`onError: (err) => toast.error(err.message)` — do not close/reset).

RadioGroup field (lines 92-120) maps directly to settle modes (`cash/upi/cheque/-` rendered as "Other").

Double-submit guard (lines 134-136):

```tsx
<Button type="submit" disabled={review.isPending} className="w-full">
  {review.isPending ? "Updating..." : "Submit Decision"}
</Button>
```

This `disabled={mutation.isPending}` + label-swap is the D-26 pattern for every money button (Handle, Settle, Record Payment, Run Now).

---

### `app/(main)/reimbursement/my-bills/page.tsx` + `management/page.tsx`

**Analog:** `app/(main)/noticeboard/page.tsx` (entire file is the tab-shell pattern):

```tsx
<Tabs defaultValue="active" className="p-4">
  <TabsList>
    <TabsTrigger value="active">Active</TabsTrigger>
    <TabsTrigger value="trash">Trash</TabsTrigger>
  </TabsList>
  <TabsContent value="active"><NoticeFeed /></TabsContent>
  <TabsContent value="trash"><NoticeTrash /></TabsContent>
</Tabs>
```

My Bills → triggers `Active | Deleted` (D-05). Management → triggers `Handle Queue | Recycle Bin` (D-03).

Recycle bin content: `TrashTabPattern` WITH children (unlike notice-trash.tsx which is a placeholder) — bills have `GET /recyclebills` + restore. Table + restore row-button follows leave-table row-action shape (grep-verified, leave-table.tsx:137-149):

```tsx
<Button size="icon" variant="ghost" onClick={() => onEdit(leave)}>
  <Pencil className="h-4 w-4" />
</Button>
```

Pagination wiring: `features/leave/page.tsx:85` passes `onEdit={(leave) => setEditLeave(leave)}` from page into table into dialog — same lifted-state composition for bill detail/edit/handle dialogs (D-04: dialog overlays keep table context).

Search bar (D-12): debounce pattern from user-search-picker.tsx:47-57 (`setTimeout` 300ms into `debouncedKeyword` state) driving either client-side filter or the `["bills","search",...]` queryKey.

---

### `features/reimbursement/bill-status-badge.tsx`

**Analog:** `features/leave/leave-status-badge.tsx` — switch on backend enum value, Badge + icon per case (lines 13-49). Map backend values exactly (never translate enums): `pending`→yellow/secondary, `accept`→green/default, `reject`→destructive, `on-hold`→blue/outline, settle variants per RESEARCH §Status Enum Mapping. One badge component parameterized per domain (bill/settlement/payroll) or three tiny ones.

---

### `components/sidebar/nav-list.tsx` (modified)

**Analog:** same file. Add to existing arrays (lines 30-71 `userRoutes`, 73-94 `managerRoutes`, 96-102 `adminRoutes`):

- `"My Bills"` → `/reimbursement/my-bills` in `userRoutes`
- `"Bill Management"` → `/reimbursement/management` in `managerRoutes` + a `canSeeManagerGroup` clause (lines 104-113 pattern): `if (r.url === "/reimbursement/management") return can(role, "read", "preReimbursement");` (D-01)
- `"Payroll"` → `adminRoutes` (D-22; `payroll:read` is admin-only in lib/permissions.ts matrix)

Route-group note for planner: CONTEXT says `app/(main)/(admin)/payroll/`, but current codebase puts finance surfaces under `(manager)` (dashboard/users/leave-management live there) while `(admin)` holds only register. Either satisfies RoleGuard; pick one and gate with `can()` regardless — nav gating is the real control.

---

## 3. Data Flow Summary

```
services/reimbursement.api.ts ──→ hooks/use-reimbursement.ts ──→ features/reimbursement/* ──→ app pages
   (zod mirrors of bill/            (queries + mutations +          (tables, dialogs,           (tab shells)
    settlement/balance schemas)      bulk sequential loop)           timeline, badges)
        ↑                                ↑
   lib/api-wrapper.ts              use-user-map.ts (ID→name)
   lib/normalize-list.ts           lib/date.ts (IST)
   lib/date.ts                     lib/permissions.ts can()

services/payroll.api.ts ──→ hooks/use-payroll.ts ──→ features/payroll/* ──→ app/(main)/(admin)/payroll
```

**Query keys:** `["bills","my",isDeleted]`, `["bills","search",filters,page,limit]`, `["bills","recycle"]`, `["balance"]`, `["audit-log",page,limit]`, `["payroll","list",page,limit,year,month]`, `["users","map"]`.
**Mutation invalidation:** every write invalidates its broad resource key; NO optimistic updates anywhere (D-29).
**Money safety:** `disabled={mutation.isPending}` on every submit button (review-leave-dialog.tsx:134); errors toast and keep dialogs open (D-28); bulk ops run sequentially against the single-bill endpoint with progress count (D-11/D-27).

## 4. Backend Contract Traps (encode in plan tasks)

| Trap | Consequence | Source |
|------|-------------|--------|
| Handle schema field is `reason` | Form field name must be `reason`; UI label "Notes" ok | Quirk 4 |
| Accept auto-creates Settlement, response has no id | Re-fetch `GET /:billId` for settlement id before enabling Settle | Quirk 3 / Pitfall 2 |
| Search endpoint 400s with zero params | Always send `status=` (post-D-31) or another param | Quirk 10 |
| Balance `Total` is pre-formatted string | Display as-is; math only on PocketUse/AdvanceUse/SettledUse | Quirk 5 |
| Payroll PUT expects incremental paidSalary | Send new payment amount, not running total | Quirk 8 |
| Payroll by-id returns array | `data[0]` at call site | Quirk 6 |
| Restore endpoint missing until D-30 | Sequence backend change before recycle-bin work | D-30 |
| Export is async BullMQ job | Toast "check notifications", no download handling here | Pitfall 7 / D-13 |

---

*Phase: 5-Money & Approval — Reimbursement & Payroll*
*Patterns extracted: 2026-08-26*
