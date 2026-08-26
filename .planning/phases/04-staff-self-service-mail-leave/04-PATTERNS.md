# Phase 4: Staff Self-Service — Mail & Leave — Patterns

## 1. File Inventory

### New Files

| File | Role | Analog |
|------|------|--------|
| `components/user-search-picker.tsx` | shared-component | `components/image-upload.tsx` (controlled component with props-driven state) |

### Modified Files

| File | Role | Primary Analog |
|------|------|---------------|
| `services/mail.api.ts` | service | `services/attendance.api.ts` (zod schema → `z.infer`, `apiFetch`, `normalizeList`) |
| `services/leave.api.ts` | service | same file (add response zod schemas following `attendance.api.ts` pattern) |
| `hooks/use-mail.ts` | hook | `hooks/use-attendance.ts` (query key conventions, mutation invalidation) |
| `app/(main)/mail/page.tsx` | page | same file (replace inline picker ×3 with `UserSearchPicker`) |
| `features/mail/outbox-colunm.tsx` → `features/mail/outbox-column.tsx` | feature-column | `features/mail/column.tsx` (fix typo, fix accessorKey, add "and N others") |
| `features/leave/apply-leave-dailog.tsx` → `features/leave/apply-leave-dialog.tsx` | feature-component | same file + `features/leave/review-leave-dialog.tsx` (edit mode pattern) |
| `features/leave/leave-table.tsx` | feature-component | same file (add edit button + PaginationFooter) |
| `features/leave/admin-page.tsx` | feature-component | same file (add status filter buttons + PaginationFooter) |
| `features/leave/leave-details-dialog.tsx` | feature-component | same file (add edit button for pending status) |
| `features/leave/page.tsx` | page | same file (wire edit dialog state, pass meta to LeaveTable) |

### Unchanged (reuse as-is)

| File | Role |
|------|------|
| `features/leave/leave-balance-card.tsx` | shared-component (compact variant inside apply dialog) |
| `features/leave/leave-status-badge.tsx` | shared-component |
| `features/leave/leave-type.tsx` | feature-component |
| `features/leave/leave-type-dialog.tsx` | feature-component |
| `features/leave/review-leave-dialog.tsx` | feature-component |
| `features/mail/data-table.tsx` | feature-component (already has PaginationFooter) |
| `features/mail/column.tsx` | feature-column |
| `components/image-upload.tsx` | shared-component |
| `components/pagination-footer.tsx` | shared-component |

---

## 2. File-by-File Patterns

### `services/mail.api.ts` — Add Zod Schemas + Fix Return Types

**Role:** service
**Analog:** `services/attendance.api.ts:7-17,25` — zod schema → `z.infer` → endpoint functions

**Current code (line 4-33):** hand-written types `MailUser`, `MailT`, `MailInput`.

**Pattern to apply (from `attendance.api.ts`):**

```ts
// attendance.api.ts:7-17
export const attendanceSchema = z.object({
  id: z.string(),
  user: userField,
  inTime: z.string().nullable(),
  outTime: z.string().nullable(),
  workHours: z.number(),
  date: z.string(),
  status: z.enum(["present", "half-day", "absent", "week-off", "on-leave"]),
  overtime: z.boolean().optional(),
  isLate: z.boolean(),
});
export type AttendanceResponse = z.infer<typeof attendanceSchema>;
```

**New schemas to add:**

```ts
import { z } from "zod";

const mailUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  image: z.object({ id: z.string(), src: z.string(), alt: z.string() }),
});

export type MailUser = z.infer<typeof mailUserSchema>;

export const inboxMailSchema = z.object({
  id: z.string(),
  from: mailUserSchema,
  to: z.array(mailUserSchema),
  cc: z.array(mailUserSchema),
  subject: z.string(),
  body: z.string(),
  createdAt: z.string(),  // backend sends ISO string
});

export type InboxMailT = z.infer<typeof inboxMailSchema>;

export const outboxMailSchema = inboxMailSchema.extend({
  bcc: z.array(mailUserSchema),
});

export type OutboxMailT = z.infer<typeof outboxMailSchema>;

export const sendMailSchema = z.object({
  to: z.array(z.string()).min(1, "At least one recipient required"),
  cc: z.array(z.string()),
  bcc: z.array(z.string()),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});

export type SendMailInput = z.infer<typeof sendMailSchema>;
```

**Key fixes:**
- `sendMail` return type: change `apiFetch<MailT>` → `apiFetch<{ success: boolean; message: string }>` (backend returns `data: null`)
- Remove duplicate `toast.error` calls (lines 39, 47, 55) — `apiFetch` already toasts errors
- Add `page`/`limit` params to `getMails` and `getSentMails`
- Rename `MailT` to `InboxMailT` / `OutboxMailT` (inbox has no `bcc`)

**`getMails`/`getSentMails` pattern (from `attendance.api.ts:44-56`):**

```ts
// attendance.api.ts pattern for paginated endpoint
export const getAttendance = async ({ sort, page, limit }: DefaultProps) => {
  const res = await apiFetch<AttendanceResponse[]>(
    `/api/attendance/user/me?sort=${sort}&page=${page}&limit=${limit}`,
    { method: "GET" },
  );
  return normalizeList<AttendanceResponse>(res);
};

// mail equivalent
export const getMails = async ({ page = 1, limit = 10 }: { page?: number; limit?: number }) => {
  const res = await apiFetch<InboxMailT[]>(
    `/api/mail?page=${page}&limit=${limit}`,
    { method: "GET" },
  );
  return normalizeList<InboxMailT>(res);
};

export const getSentMails = async ({ page = 1, limit = 10 }: { page?: number; limit?: number }) => {
  const res = await apiFetch<OutboxMailT[]>(
    `/api/mail/outbox?page=${page}&limit=${limit}`,
    { method: "GET" },
  );
  return normalizeList<OutboxMailT>(res);
};
```

---

### `services/leave.api.ts` — Add Response Zod Schemas, Remove Dead Import

**Role:** service
**Analog:** same file already has request schemas; follow `attendance.api.ts` for response schemas

**D-22:** Remove `import { isActive } from "@tiptap/core"` (line 4) — dead import.

**Add response zod schemas (before the type section):**

```ts
import { userField } from "@/lib/common-zod-schema";

export const leaveTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  allocatedDays: z.number(),
  maxCarryForwardDays: z.number(),
  requiresProof: z.boolean(),
  minDaysNotice: z.number(),
  isActive: z.boolean(),
  description: z.string().optional(),
});

export const leaveApplicationSchema = z.object({
  id: z.string(),
  user: userField,
  startDate: z.string(),
  endDate: z.string(),
  totalDays: z.number(),
  reason: z.string(),
  type: z.object({ name: z.string(), code: z.string() }),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]),
  proof: z.string().optional(),
  approvedBy: z.string().optional(),
  managerComment: z.string().optional(),
});

export const leaveBalanceSchema = z.object({
  id: z.string(),
  user: z.string(),
  year: z.string(),
  balance: z.record(z.object({ used: z.number(), remaining: z.number() })),
});
```

**Key point:** The existing hand-written types (`LeaveT`, `LeaveTypeT`, `LeaveBalanceT`) stay exported for backward compat — new zod schemas are the source of truth, derive types from them.

---

### `hooks/use-mail.ts` — Add Pagination, Debounce, Fix Invalidation

**Role:** hook
**Analog:** `hooks/use-attendance.ts:25-39` (query key with params, invalidation on mutation)

**Current state (line 9-41):** `useMail(keyword?)` — single hook with `["inbox"]`, `["sent"]`, `["users", keyword]` keys.

**Pattern from `use-attendance.ts`:**

```ts
// attendance hook pattern: queryKey includes params
const attendancesList = useQuery({
  queryKey: ["attendance", "list", page, limit, sort],
  queryFn: () => getAttendance({ sort, page, limit }),
});

// mutation invalidates broad key
const checkIn = useMutation({
  mutationFn: checkInApi,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["attendance"] });
  },
});
```

**Changes to apply:**

1. **Pagination params:** `useMail` accepts `{ page, limit }` alongside `keyword`:

```ts
type UseMailProps = {
  keyword?: string;
  page?: number;
  limit?: number;
};

export const useMail = ({ keyword, page = 1, limit = 10 }: UseMailProps = {}) => {
  const inbox = useQuery({
    queryKey: ["inbox", page, limit],
    queryFn: () => getMails({ page, limit }),
    staleTime: 60_000,
  });

  const sent = useQuery({
    queryKey: ["sent", page, limit],
    queryFn: () => getSentMails({ page, limit }),
    staleTime: 60_000,
  });
```

2. **Invalidation fix:** `send.onSuccess` must also invalidate `["inbox"]`:

```ts
const send = useMutation({
  mutationFn: sendMail,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["sent"] });
    queryClient.invalidateQueries({ queryKey: ["inbox"] });
  },
});
```

3. **User search stays separate** — the component handles debounce; hook just queries:

```ts
const user = useQuery({
  queryKey: ["users", keyword],
  queryFn: () => getSearchUser(keyword as string),
  enabled: !!keyword && keyword.length >= 2,
});
```

---

### `components/user-search-picker.tsx` — New Shared Component

**Role:** shared-component
**Analog:** `components/image-upload.tsx` (controlled component pattern with callback props)

**Current inline pattern being extracted (from `app/(main)/mail/page.tsx:146-207`):**

```tsx
// Existing chip rendering (line 156-175)
<div className="flex flex-wrap gap-2 mb-2">
  {field.value.map((user: MailUser) => (
    <div key={user.id}
      className="flex items-center gap-2 rounded-full bg-muted px-2 py-1 text-sm">
      {user.name} ({user.email})
      <button type="button"
        onClick={() => field.onChange(field.value.filter((u) => u.id !== user.id))}>
        <X className="h-3 w-3" />
      </button>
    </div>
  ))}
</div>

// Existing search + dropdown (line 185-204)
<div className="border mt-2 rounded-md max-h-40 overflow-auto">
  {toData.map((user) => (
    <div key={user.id} className="px-3 py-2 hover:bg-muted cursor-pointer"
      onClick={() => { field.onChange([...field.value, user]); setKeyword(""); }}>
      {user.name} — {user.email}
    </div>
  ))}
</div>
```

**Props (from UI-SPEC §6):**

```ts
type UserSearchPickerProps = {
  value: MailUser[];
  onChange: (users: MailUser[]) => void;
  label?: string;
  placeholder?: string;
  multiple?: boolean;
  disabled?: boolean;
};
```

**Component structure:** Uses `useMail({ keyword })` for search, `useState` for local keyword + debounce timer. Chip styling matches existing `page.tsx:159`:
```
className="flex items-center gap-2 rounded-full bg-muted px-2 py-1 text-sm"
```

**Debounce:** Simple `useRef<NodeJS.Timeout>` + `setTimeout`/`clearTimeout` at 300ms. No new dependency needed.

---

### `app/(main)/mail/page.tsx` — Replace Inline Pickers, Add Reply, Validation, Sanitization

**Role:** page
**Analog:** same file (modify in-place)

**Changes:**

1. **Replace 3× inline To/CC/BCC picker** (lines 146-329) with `<UserSearchPicker>`:

```tsx
<Controller name="to" control={form.control}
  render={({ field }) => (
    <Field>
      <FieldLabel>To</FieldLabel>
      <UserSearchPicker value={field.value} onChange={field.onChange}
        label="To" placeholder="Search users..." />
      {form.formState.errors.to && <FieldError errors={[form.formState.errors.to]} />}
    </Field>
  )} />
```

2. **Schema update** (line 48-54): apply zod validation per D-06:

```ts
const mailInputSchema = z.object({
  to: z.array(z.any()).min(1, "At least one recipient required"),
  cc: z.array(z.any()),
  bcc: z.array(z.any()),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});
```

3. **Reply button** in dialog (after body div, line 478):

```tsx
<Button variant="outline" size="sm" className="mt-2 gap-2"
  onClick={() => {
    const replyBody = `\n\nOn ${formatIstDateTime(selectedMail?.createdAt)}, ${selectedMail?.from.name} wrote:\n> ${selectedMail?.body.split("\n").join("\n> ")}`;
    form.setValue("to", selectedMail ? [selectedMail.from] : []);
    form.setValue("subject",
      selectedMail?.subject.startsWith("Re: ") ? selectedMail.subject : `Re: ${selectedMail?.subject}`);
    form.setValue("body", replyBody);
    setOpen(false);
    // switch tab to compose (controlled via defaultValue prop)
  }}>
  <Reply /> Reply
</Button>
```

4. **Sanitize body rendering** (line 476-478): add `escapeHtml` helper + use it:

```tsx
<div className="w-full max-w-full overflow-x-hidden overflow-y-auto whitespace-pre-wrap break-all">
  {escapeHtml(selectedMail?.body ?? "")}
</div>
```

5. **Tab switching for reply:** Change `<Tabs defaultValue="inbox">` to `<Tabs value={activeTab} onValueChange={setActiveTab}>` with `useState("inbox")`.

6. **Remove local `MailUser` type re-declaration** (lines 34-44) — import from `services/mail.api.ts`.

---

### `features/mail/outbox-colunm.tsx` → `features/mail/outbox-column.tsx`

**Role:** feature-column
**Analog:** `features/mail/column.tsx` (same structure, fix bugs)

**D-20:** Rename file `outbox-colunm.tsx` → `outbox-column.tsx`.

**Fix accessorKey** (line 12): change `accessorKey: "from"` → `accessorKey: "to"`.

**D-07 — Multi-recipient display** (replace cell renderer, lines 14-28):

```tsx
cell: ({ row }) => {
  const users = row.original.to;
  const user = users[0];

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarImage src={imageUrl(user.image?.src)} alt={user.name} />
        <AvatarFallback className="rounded-lg">{user.name}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-bold">{user.name}</p>
        <p>{user.email}</p>
        {users.length > 1 && (
          <p className="text-xs text-muted-foreground">
            and {users.length - 1} other{users.length > 2 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
},
```

**Update import** in `page.tsx` line 29: `from "@/features/mail/outbox-column"`.

---

### `features/leave/apply-leave-dailog.tsx` → `features/leave/apply-leave-dialog.tsx`

**Role:** feature-component
**Analog:** `features/leave/review-leave-dialog.tsx` (dialog + react-hook-form + zod pattern)

**D-21:** Fix filename typo `dailog` → `dialog`.

**Current props (line 33-36):**
```ts
type Props = { open: boolean; onOpenChange: (open: boolean) => void; };
```

**D-10 — Add edit mode:** Accept optional `leave` prop:

```ts
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leave?: LeaveT;  // present = edit mode
};
```

**Edit-mode pre-fill via `useEffect` (from `leave-type-dialog.tsx` analog):**
```tsx
useEffect(() => {
  if (leave) {
    form.reset({
      type: leave.type.code,
      startDate: formatIstDate(leave.startDate),
      endDate: formatIstDate(leave.endDate),
      reason: leave.reason,
      proof: leave.proof,
    });
  } else {
    form.reset({ type: "", startDate: "", endDate: "", reason: "", proof: undefined });
  }
}, [leave, form]);
```

**D-11 — Balance cards at top:** Insert before form fields:
```tsx
<div className="grid gap-3 sm:grid-cols-3">
  {balance.data && Object.entries(balance.data.balance).map(([key, value]) => (
    <div key={key} className="rounded-lg border p-3">
      <p className="text-sm font-medium capitalize">{key}</p>
      <Badge variant="secondary">{value.remaining} Left</Badge>
    </div>
  ))}
</div>
```

**D-12 — Proof upload:** Replace `<Input type="text">` (lines 154-158) with `ImageUpload`:
```tsx
<Controller name="proof" control={form.control}
  render={({ field }) => (
    <Field>
      <FieldLabel>Proof Document (optional)</FieldLabel>
      <ImageUpload altName="leave-proof" url={field.value}
        onUploadSuccess={(file) => field.onChange(file.src)} />
    </Field>
  )} />
```

**D-14 — Overlap error:** Add state + inline display below date grid:
```tsx
const [overlapError, setOverlapError] = useState<string | null>(null);

// In onSubmit error path:
onError: (err) => {
  if (err.message.includes("overlap")) {
    setOverlapError(err.message);
  } else {
    toast.error(err.message);
  }
}
// Below date grid:
{overlapError && <p className="text-sm text-destructive">{overlapError}</p>}
```

**Submit handler branching (apply vs edit):**
```tsx
const onSubmit = (values: ApplyLeaveType) => {
  if (leave) {
    updateApplication.mutate({ id: leave.id, data: values }, {
      onSuccess: () => { toast.success("Leave updated successfully"); form.reset(); onOpenChange(false); },
    });
  } else {
    apply.mutate(values, {
      onSuccess: () => { toast.success("Leave applied successfully"); form.reset(); onOpenChange(false); },
    });
  }
};
```

---

### `features/leave/leave-table.tsx` — Add Edit Button + PaginationFooter

**Role:** feature-component
**Analog:** same file (modify in-place)

**Current props (line 27-31):**
```ts
type Props = { data: LeaveT[]; loading?: boolean; meta?: MetaResponse; };
```

**Add edit callback prop:**
```ts
type Props = {
  data: LeaveT[];
  loading?: boolean;
  meta?: MetaResponse;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onEdit?: (leave: LeaveT) => void;
};
```

**Edit button** (after Eye button, line 121-127):
```tsx
{leave.status === "pending" && onEdit && (
  <Button size="icon" variant="ghost" onClick={() => onEdit(leave)}>
    <Pencil className="h-4 w-4" />
  </Button>
)}
```

**PaginationFooter** (after closing `</Card>`):
```tsx
{totalPages && totalPages > 1 && (
  <div className="flex justify-end py-4">
    <PaginationFooter page={page ?? 1} totalPages={totalPages}
      onPageChange={onPageChange ?? (() => {})} />
  </div>
)}
```

---

### `features/leave/admin-page.tsx` — Add Status Filter + PaginationFooter

**Role:** feature-component
**Analog:** same file (modify in-place)

**D-13 — Status filter buttons:** Add local state + button group above table:

```tsx
const [statusFilter, setStatusFilter] = useState<string | null>(null);

// Filter the data
const filteredItems = applications.data?.items?.filter(
  (leave) => !statusFilter || leave.status === statusFilter
) ?? [];

// Render above Table:
<div className="flex flex-wrap gap-2 px-4 py-2">
  {[
    { label: "All", value: null },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ].map(({ label, value }) => (
    <Button key={label} size="sm"
      variant={statusFilter === value ? "default" : "outline"}
      onClick={() => setStatusFilter(value)}>
      {label}
    </Button>
  ))}
</div>
```

**D-15 — PaginationFooter:** Add below table using `applications.data` meta:
```tsx
// In the Card, after Table closing:
{applications.data && applications.data.totalPages > 1 && (
  <div className="flex justify-end px-4 py-4">
    <PaginationFooter page={applications.data.page}
      totalPages={applications.data.totalPages}
      onPageChange={(p) => { /* update searchParams */ }} />
  </div>
)}
```

**Fix card title (line 59):** Change `"Pending Leave Requests"` → `"Leave Requests"`.

---

### `features/leave/page.tsx` — Wire Edit Dialog State

**Role:** page
**Analog:** same file (modify in-place)

**Add edit state:**
```tsx
const [editLeave, setEditLeave] = useState<LeaveT>();

// Pass to LeaveTable:
<LeaveTable data={items} loading={applications.isLoading}
  meta={applications.data} page={applications.data?.page}
  totalPages={applications.data?.totalPages}
  onPageChange={(p) => { router.push(`/leave?page=${p}`); }}
  onEdit={(leave) => setEditLeave(leave)} />

// Pass to ApplyLeaveDialog in edit mode:
<ApplyLeaveDialog open={dialogOpen || !!editLeave}
  onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditLeave(undefined); }}
  leave={editLeave} />
```

---

## 3. Data Flow Summary

```
services/mail.api.ts  ──→  hooks/use-mail.ts  ──→  app/(main)/mail/page.tsx
   (zod schemas)              (queries/mutations)       (UI + compose form)
                                     ↑                        ↑
                              useMail({ keyword })   UserSearchPicker
                                                           ↓
                                                   services/mail.api.ts::getSearchUser

services/leave.api.ts  ──→  hooks/use-leave.ts  ──→  features/leave/page.tsx
   (zod schemas)              (queries/mutations)       (staff leave UI)
                                   ↓                      ↓
                            features/leave/          ApplyLeaveDialog
                            admin-page.tsx           (edit mode via leave prop)
                            (status filter)
                                   ↓
                            LeaveTable
                            (PaginationFooter + edit button)
                                   ↓
                            LeaveDetailsDialog
                            (edit button for pending)
```

**Query key conventions:**
- `["inbox", page, limit]` — paginated inbox
- `["sent", page, limit]` — paginated outbox
- `["users", keyword]` — user search results
- `["leave", "types"]` — leave types (staleTime 30min)
- `["leave", "applications", page, limit, all]` — applications
- `["leave", "balance"]` — balance (staleTime 5min)

**Mutation invalidation:**
- `sendMail` success → invalidate `["sent"]` + `["inbox"]`
- `applyLeave` / `updateLeaveApplication` success → invalidate `["leave"]`

---

## 4. Bug Fixes Reference

| Bug | File:Line | Fix |
|-----|-----------|-----|
| Filename typo `outbox-colunm` | `features/mail/outbox-colunm.tsx` | Rename to `outbox-column.tsx`, update import in `page.tsx:29` |
| Filename typo `apply-leave-dailog` | `features/leave/apply-leave-dailog.tsx` | Rename to `apply-leave-dialog.tsx`, update imports in `page.tsx:13` |
| Dead import `@tiptap/core` | `services/leave.api.ts:4` | Remove `import { isActive } from "@tiptap/core"` |
| `accessorKey: "from"` on outbox | `outbox-colunm.tsx:12` | Change to `accessorKey: "to"` |
| `sendMail` return type mismatch | `services/mail.api.ts:60` | Change generic to not include `MailT` (backend returns `data: null`) |
| Duplicate toast in mail service | `services/mail.api.ts:39,47,55` | Remove `if (!res.success) toast.error(res.message)` — `apiFetch` handles this |
| BCC labeled as "CC" in dialog | `app/(main)/mail/page.tsx:446` | Change `<p className="font-bold">CC</p>` → `<p className="font-bold">BCC</p>` |
| Admin card title misleading | `features/leave/admin-page.tsx:59` | Change `"Pending Leave Requests"` → `"Leave Requests"` |
| `send.onSuccess` only invalidates `["sent"]` | `hooks/use-mail.ts:32` | Add `queryClient.invalidateQueries({ queryKey: ["inbox"] })` |
| No `MetaResponse` passed to LeaveTable | `features/leave/page.tsx:80` | Pass `meta={applications.data}` (currently only `data` and `loading` passed) |

---

*Phase: 4-Staff Self-Service — Mail & Leave*
*Patterns extracted: 2026-08-26*
