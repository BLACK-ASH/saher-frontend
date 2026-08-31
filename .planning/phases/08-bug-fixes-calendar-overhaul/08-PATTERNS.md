# Phase 8: Bug Fixes & Calendar Overhaul - Pattern Map

**Mapped:** 2026-08-31
**Files analyzed:** 18 (14 frontend + 4 backend)
**Analogs found:** 18 / 18

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `features/register/register-schema.ts` | utility (schema) | transform | self (lines 67-76) | exact (edit in place) |
| `features/register/employee-details.tsx` | component | request-response | self (line 38) | exact (edit in place) |
| `features/profile/profile-info.tsx` | component | request-response | self (lines 37-75) | exact (edit in place) |
| `features/noticeboard/notice-trash.tsx` | component | CRUD | `features/reimbursement/recycle-bin.tsx` | role-match |
| `services/notice.api.ts` | service | CRUD | self (existing getNotices) | exact (add isDeleted param) |
| `hooks/use-notice.ts` | hook | CRUD | self (restore/permanentRemove exist) | exact (add trash query) |
| `components/sidebar/nav-list.tsx` | component | request-response | self (managerRoutes) | exact (add nav entry) |
| `features/reimbursement/finance-bill-table.tsx` | component | CRUD | self (line 207) | exact (wire onPageChange prop) |
| `app/(main)/reimbursement/management/page.tsx` | page | CRUD | self (owns page state) | exact (thread setPage) |
| `features/reimbursement/balance-card.tsx` | component | CRUD | self (line 7) | exact (keep key) |
| `hooks/use-reimbursement.ts` | hook | CRUD | self (line 60) | exact (fix invalidation) |
| `features/reimbursement/EditBillDialog` (NEW) | component | CRUD | `features/reimbursement/create-bill-dialog.tsx` | role-match (template) |
| `features/leave/apply-leave-dialog.tsx` | component | request-response | self (handleError lines 94-100) | exact (extend surfacing) |
| `features/calendar/calendar.tsx` | component | CRUD | self (handleEventDelete) | exact (delete confirm + onError) |
| `features/calendar/event-details.tsx` | component | CRUD | self (lines 134-151) | exact (un-comment onEdit) |
| `features/calendar/add-event-dialog.tsx` | component | CRUD | self (existing form) | exact (add eventId edit mode) |
| `../saher-backend/src/calendar/calendar.routes.ts` | route | request-response | `../saher-backend/src/reimbursement/reimbursement.routes.ts` | role-match (authorize pattern) |
| `../saher-backend/src/calendar/calender.controller.ts` | controller | CRUD | self (month-boundary Date logic) | exact (tz fix) |
| `../saher-backend/src/leave/leave.controller.ts` | controller | CRUD | self (lines 187, 214-216) | exact (leaveCode → type) |

---

## Pattern Assignments

### `features/register/register-schema.ts` (utility, edit in place)

**Analog:** self — the 5 copy-paste bug lines at 67-76.

**Current buggy code** (lines 67-76):
```typescript
employeeId: z.string().min(2, "Date Of Birth Is Required."),
department: z.string().min(2, "Date Of Birth Is Required."),
designation: z.string().min(2, "Date Of Birth Is Required."),
salaryStructure: z.string().min(2, "Date Of Birth Is Required."),
address: z.string().min(2, "Date Of Birth Is Required."),
```

**Corrected messages** (per D-02) — sibling fields show the style (line 11-13):
```typescript
employeeId: z.string().min(2, "Employee ID is required"),
department: z.string().min(2, "Department is required"),
designation: z.string().min(2, "Designation is required"),
salaryStructure: z.string().min(2, "Salary structure is required"),
address: z.string().min(2, "Address is required"),
```

**Note:** All other fields in this file use `.min(2, "<Field> Is Required.")` with title-case + trailing period. Match the corrected messages to the RESEARCH.md recommendations (sentence case, no period) per D-02 — verify which consistency wins.

---

### `features/register/employee-details.tsx` (component, edit in place)

**Analog:** self — line 38, `employeeShift` array.

**Buggy label** (line 38):
```typescript
{
  label: "2:00 AM - 6:00 PM",
  value: "shift-2",
},
```

**Fix:** change `"2:00 AM - 6:00 PM"` → `"2:00 PM - 6:00 PM"`. Pure label edit.

---

### `features/profile/profile-info.tsx` (component, edit in place)

**Analog:** self — the 3 double-toast handlers at lines 37-75.

**Buggy pattern** (lines 37-46, same for all 3 handlers):
```typescript
const handleChangeEmail = async () => {
  const res = await apiFetch(`/api/auth/change-email/request`, {
    method: "POST",
  });
  if (!res.success) {
    toast.error(res.message);
  }                      // ← missing return
  toast.success(res.message);   // always runs
  queryClient.invalidateQueries({ queryKey: ["user"] });
};
```

**Fix (add early return)** — RESEARCH.md Pattern D:
```typescript
const handleChangeEmail = async () => {
  const res = await apiFetch(`/api/auth/change-email/request`, {
    method: "POST",
  });
  if (!res.success) {
    toast.error(res.message);
    return;              // ← ADD
  }
  toast.success(res.message);
  queryClient.invalidateQueries({ queryKey: ["user"] });
};
```

**Apply the same early-return to:** `handleChangePassword` (lines 48-57) and `handleChangeProfile` (lines 59-75).

---

### `features/noticeboard/notice-trash.tsx` (component, CRUD)

**Analog:** `features/reimbursement/recycle-bin.tsx` — the completed Phase 3 TrashTabPattern implementation (68 lines).

**Current placeholder** (full file, lines 1-14):
```tsx
"use client";

import { TrashTabPattern } from "@/components/shared/trash-tab-pattern";

export function NoticeTrash() {
  return (
    <TrashTabPattern
      title="Trash"
      description="Deleted notices will appear here once the backend supports listing trashed items."
    />
  );
}
```

**Target implementation — copy the RecycleBin shape** (`recycle-bin.tsx:13-66`):
```tsx
export function RecycleBin() {
  const { restore } = useReimbursement();
  const { data: items = [], isLoading } = useRecycleBills();
  // ...

  return (
    <TrashTabPattern title="Recycle Bin" description="Deleted bills can be restored here.">
      {isLoading ? (
        <div className="py-10 text-center">Loading…</div>
      ) : items.length === 0 ? (
        <NoData title="Recycle Bin Empty" description="No deleted bills found." />
      ) : (
        <Table>
          <TableHeader>...</TableHeader>
          <TableBody>
            {items.map((bill) => (
              <TableRow key={bill.id}>
                {/* row cells */}
                <Button variant="ghost" size="sm" onClick={() => handleRestore(bill.id)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restore
                </Button>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </TrashTabPattern>
  );
}
```

**Dead-code already present** — `hooks/use-notice.ts:41-49` already exports `restore` and `permanentRemove`:
```typescript
const restore = useMutation({
  mutationFn: restoreNotice,
  onSuccess: invalidateNotices,
});

const permanentRemove = useMutation({
  mutationFn: permanentDeleteNotice,
  onSuccess: invalidateNotices,
});
```

**Service functions already present** — `services/notice.api.ts:62-68`:
```typescript
// PATCH /notice/:id/restore — clears the soft-delete flag.
export const restoreNotice = async (id: string) => {
  await apiFetch(`/api/notice/${id}/restore`, { method: "PATCH" });
};

// DELETE /notice/:id/permanent — irrecoverable (findByIdAndDelete).
export const permanentDeleteNotice = async (id: string) => {
  await apiFetch(`/api/notice/${id}/permanent`, { method: "DELETE" });
};
```

**Backend gap (D-04):** `notice.controller.ts:111-117` `getNotices` hard-filters `isDeleted:false`:
```typescript
export const getNotices = async (req: Request, res: Response) => {
  const notices = await Notice.find({
    isDeleted: false,        // ← hard-filter, no ?isDeleted=true support
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
```
Fix in `../saher-backend` — add a `?isDeleted=` query param (default false). Routes are at `notice.routes.ts:16` `noticeRouter.get('/', getNotices)`.

---

### `services/notice.api.ts` (service, CRUD)

**Analog:** self — extend existing `getNotices` (lines 27-32):
```typescript
export const getNotices = async (): Promise<NoticeResponse[]> => {
  const res = await apiFetch<NoticeResponse[]>("/api/notice", {
    method: "GET",
  });
  return res.data;
};
```

**Add an `isDeleted` query param** matching the getMyBills pattern (`reimbursement.api.ts:238-244`):
```typescript
export const getMyBills = async (isDeleted = false): Promise<BillResponse[]> => {
  const res = await apiFetch<BillResponse[]>(
    `/api/reimbursement/mybills?isDeleted=${isDeleted}`,
    { method: "GET" },
  );
  return res.data;
};
```

---

### `hooks/use-notice.ts` (hook, CRUD)

**Analog:** self — add a trash query alongside existing `notices` query (lines 20-23):
```typescript
const notices = useQuery({
  queryKey: ["notices", "active"],
  queryFn: getNotices,
});
```

**Add a deleted-items query** following the `useRecycleBills` pattern (`use-reimbursement.ts:44-48`):
```typescript
export const useRecycleBills = () =>
  useQuery({
    queryKey: ["bills", "recycle"],
    queryFn: getRecycleBills,
  });
```

**Add to return bag:** include `trashNotices` (or similar) alongside existing `notices`, `restore`, `permanentRemove`.

---

### `components/sidebar/nav-list.tsx` (component)

**Analog:** self — the `managerRoutes`/`userRoutes` arrays + `canSeeManagerGroup` gating helper (lines 116-125).

**Current userRoutes entry for My Bills** (lines 73-77):
```typescript
{
  label: "My Bills",
  url: "/reimbursement/my-bills",
  icon: ReceiptText,
},
```

**Add Bill Management nav entry** (D-05) — Research F6 says the page lives at `app/(main)/reimbursement/management/page.tsx`, already RoleGuard-gated with `can(r, "read", "preReimbursement")`. **The page already exists; only the nav entry is missing.** Options:
1. Add to `userRoutes` with the entry gated at render time, OR
2. Add a manager/admin group entry with `canSeeManagerGroup` gating.

Research F6 recommends: **add a "Bill Management" nav entry gated on `can(r,"read","preReimbursement")` (finance/admin), keep the existing page, don't rebuild.** The existing gating helper pattern to extend:

```typescript
const canSeeManagerGroup = (role: UserRole): boolean => {
  return managerRoutes.some((r) => {
    // ...
    if (r.url === "/leave-management") return can(role, "read", "leave");
    return false;
  });
};
```

Render condition pattern in `NavItem` (lines 191-211):
```tsx
{canSeeManagerGroup(user.role) && (
  <SidebarGroup>
    <SidebarGroupLabel>Manager</SidebarGroupLabel>
    <SidebarGroupContent>
      <SidebarMenu>
        {managerRoutes.map((item) => ( ... ))}
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
)}
```

---

### `features/reimbursement/finance-bill-table.tsx` (component, CRUD)

**Analog:** self — the broken pagination at line 207.

**Current no-op** (lines 205-209):
```tsx
{totalPages > 1 && (
  <div className="flex justify-end px-4 py-4">
    <PaginationFooter page={data?.page ?? 1} totalPages={totalPages} onPageChange={() => {}} />
  </div>
)}
```

**Fix — accept `onPageChange` prop, wire it** (RESEARCH.md Pattern A):
```tsx
interface FinanceBillTableProps {
  // ...existing
  onPageChange: (page: number) => void;   // NEW
}

// in component destructure
onPageChange,

// footer
<PaginationFooter
  page={data?.page ?? 1}
  totalPages={totalPages}
  onPageChange={onPageChange}   // was () => {}
/>
```

**`PaginationFooter` contract** (`components/shared/pagination-footer.tsx:10-14`):
```tsx
type PaginationFooterProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};
```

---

### `app/(main)/reimbursement/management/page.tsx` (page, CRUD)

**Analog:** self — parent owns `page` state (line 40).

```tsx
const [page, setPage] = useState(1);
// ...
const searchQuery = useSearchBills(filters, page);
```

**Thread `setPage` into FinanceBillTable** (lines 251-262):
```tsx
<FinanceBillTable
  data={data}
  isLoading={isLoading}
  selectedIds={selectedIds}
  onToggleSelect={handleToggleSelect}
  onToggleAll={handleToggleAll}
  onHandle={handleRowHandle}
  onOpen={handleOpenDetail}
  onEditAdvance={handleEditAdvance}
  onDeleteAdvance={handleDeleteAdvance}
  bulkProgress={bulkProgress}
  onPageChange={setPage}   // ← NEW
/>
```

**Existing AlertDialog delete-confirm pattern** (lines 310-325) — reusable for notice trash / calendar delete:
```tsx
<AlertDialog open={!!advanceDelete} onOpenChange={(open: boolean) => { if (!open) setAdvanceDelete(null); }}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete advance bill?</AlertDialogTitle>
      <AlertDialogDescription>...</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={confirmDeleteAdvance} disabled={deleteAdvance.isPending}>
        {deleteAdvance.isPending ? "Deleting…" : "Delete"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**RoleGuard page guard** (line 166):
```tsx
<RoleGuard allow={(r) => can(r, "read", "preReimbursement")}>
```

---

### `features/reimbursement/balance-card.tsx` (component, CRUD)

**Analog:** self — keep the canonical key at line 7.
```typescript
const { data: balance, isLoading } = useQuery({
  queryKey: ["reimbursement", "balance"],   // ← canonical (keep)
  queryFn: getBalanceEnquiry,
});
```

**Fix invalidation in `hooks/use-reimbursement.ts:58-61`** (RESEARCH.md Pattern B):
```typescript
const invalidate = () => {
  queryClient.invalidateQueries({ queryKey: ["bills"] });
  queryClient.invalidateQueries({ queryKey: ["reimbursement", "balance"] }); // was ["balance"]
};
```

**Why:** `invalidateQueries(["balance"])` prefix-matches `["balance", ...]` but NOT `["reimbursement","balance"]`. Aligning both to `["reimbursement","balance"]` fixes the staleness.

---

### `features/reimbursement/EditBillDialog` (NEW component, CRUD)

**Analog:** `features/reimbursement/create-bill-dialog.tsx` (125 lines) — mirror with pre-fill + date lock.

**CreateBillDialog core form pattern** (lines 21-46):
```tsx
export function CreateBillDialog({ open, onOpenChange }: CreateBillDialogProps) {
  const { createBill } = useReimbursement();

  const form = useForm<UserBillCreateInput>({
    resolver: zodResolver(userBillCreateSchema),
    defaultValues: {
      amount: 0,
      description: "",
      date: dateToIstDateOnly(new Date()),
      images: [],
    },
  });

  const attachedImages = form.watch("images") ?? [];

  const onSubmit = async (data: UserBillCreateInput) => {
    try {
      await createBill.mutateAsync(data);
      toast.success("Bill submitted");
      onOpenChange(false);
      form.reset();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit bill";
      toast.error(message);
    }
  };
```

**EditBillDialog differences (D-08):**
- Props: add `bill: BillResponse | null`
- `useForm<UserBillUpdateInput>` with `userBillUpdateSchema` (from `services/reimbursement.api.ts:90-96`) — **NO date field** (backend locks it):
```typescript
// D-07 date lock: backend userBillUpdateSchema has NO date key — pending-bill
// edits may touch amount/description/images only.
export const userBillUpdateSchema = z
  .object({
    amount: z.number().positive("Amount must be greater than zero"),
    description: descriptionField,
    images: z.array(z.string()).min(1).max(10, "Up to 10 receipts allowed"),
  })
  .partial();
```
- Pre-fill via `useEffect` on `bill` change with `form.reset({ amount, description, images })` (mirror `apply-leave-dialog.tsx:70-92` pre-fill pattern)
- Submit via `updateBill` mutation already in `use-reimbursement.ts:73-77`: `updateBill.mutateAsync({ id: bill.id, data })`
- Render date read-only (show `formatIstDate(bill.date)` as text, no input)
- **Edit button already wired** in `bill-table.tsx:38`: `<Button onClick={() => onEdit?.(bill)}>Edit</Button>` for `status === "pending"` — just no dialog consumes it.

**Field-render pattern to copy** (create-bill-dialog.tsx:55-116): each field is `Controller` wrapped with `Field > FieldLabel > Input/Textarea/ImageUpload > FieldError`.

---

### `features/leave/apply-leave-dialog.tsx` (component, request-response)

**Analog:** self — current `handleError` at lines 94-100 surfaces ONLY overlap inline:
```tsx
const handleError = (err: Error) => {
  // Overlap errors surface inline below the dates; every other failure is
  // already toasted by apiFetch before it throws.
  if (err.message.toLowerCase().includes("overlap")) {
    setOverlapError(err.message);
  }
};
```

**Fix (D-10):** broaden to surface ALL backend validation errors (notice-period, proof-required, overlap). The backend validators live in `leave.controller.ts` via `validateLeaveApplication`. Extend to check for other known messages:
```tsx
const handleError = (err: Error) => {
  const msg = err.message.toLowerCase();
  // Surface any known business-rule rejection inline (not just overlap)
  if (
    msg.includes("overlap") ||
    msg.includes("notice") ||
    msg.includes("proof") ||
    msg.includes("advanced notice") ||
    msg.includes("before")
  ) {
    setOverlapError(err.message);   // reuse the inline destructive line 238-240
  }
};
```

**Mutation call pattern** (lines 138-150):
```tsx
apply.mutate({ type, startDate, endDate, reason, proof }, {
  onSuccess: () => {
    toast.success("Leave applied successfully");
    form.reset();
    onOpenChange(false);
    setOverlapError(null);
  },
  onError: handleError,
});
```

**Date conversion (IST)** (lines 105-109):
```typescript
const startDate = dateInputToIso(values.startDate);
const endDate = dateInputToIso(values.endDate);
```

---

### `features/calendar/calendar.tsx` (component, CRUD)

**Analog:** self — the delete/update handlers at lines 159-234.

**Current bugs:**
1. **Delete has no confirmation** (lines 225-234) — directly calls `del.mutate`:
```tsx
onDelete={(event) => {
  del.mutate(event.id, {
    onSuccess: () => {
      toast.success("Calendar Event Deleted");
    },
  });
  setSelectedEvent(null);
  // Later:
  // open delete confirmation dialog
}}
```
2. **Drag-drop/resize lack `onError`** (lines 159-174):
```tsx
eventDrop={(info) => {
  const id = info.event.extendedProps.details.id;
  const data = { start: info.event.start as Date, end: info.event.end as Date };
  update.mutate(
    { id, data },
    { onSuccess: (res) => { toast.success(res.message); } },   // ← no onError
  );
}}
```
3. **Edit wiring commented out** (lines 218-234), no `editEvent` state.

**Fix — add delete-confirmation state + AlertDialog (D-13, D-15, D-20):**
```tsx
const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);

// onDelete opens confirmation instead of mutating directly
onDelete={(event) => {
  setSelectedEvent(null);
  setDeleteTarget(event);
}}

// Add AlertDialog for confirmation (copy delete-advance pattern from management/page.tsx:310-325)
<AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete event?</AlertDialogTitle>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        disabled={del.isPending}
        onClick={() => deleteTarget && del.mutate(deleteTarget.id, {
          onSuccess: () => toast.success("Calendar Event Deleted"),
          onError: (err: Error) => toast.error(err.message),
        })}
      >
        {del.isPending ? "Deleting…" : "Delete"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Add `onError` to eventDrop/eventResize (D-15):**
```tsx
update.mutate(
  { id, data },
  {
    onSuccess: (res) => { toast.success(res.message); },
    onError: (err: Error) => { toast.error(err.message); },   // ← ADD
  }
);
```

**Wire edit (D-14)** — pass `onEdit`, hold edit state, feed AddEventDialog:
```tsx
<EventDetailsSheet
  event={selectedEvent}
  open={selectedEvent !== null}
  onOpenChange={(open) => { if (!open) setSelectedEvent(null); }}
  onEdit={(e) => { setSelectedEvent(null); setEditEvent(e); }}     // ← un-comment
  onDelete={(e) => { setSelectedEvent(null); setDeleteTarget(e); }}
/>

<AddEventDialog
  data={selectedItem}
  visible={selectedVisible}
  setVisible={setSelectedVisible}
  eventId={editEvent?.id ?? undefined}          // NEW prop for edit mode
  initialData={editEvent ?? undefined}          // pre-filled
/>
```

---

### `features/calendar/event-details.tsx` (component, CRUD)

**Analog:** self — the commented-out `onEdit` at lines 39/47 and footer at 134-151.

**Current commented code to un-comment:**
```tsx
// Props interface (lines 39-41):
//   onEdit?: (event: CalendarEvent) => void;
// Destructure (line 47):
//   onEdit,

// Footer (lines 135-139):
{/* <div className="grid grid-cols-2 gap-3"> */}
{/*   <Button variant="outline" onClick={() => onEdit?.(event)}> */}
{/*     <Pencil className="mr-2 h-4 w-4" /> */}
{/*     Edit */}
{/*   </Button> */}
```
Un-comment and layout as a two-column grid alongside Delete.

---

### `features/calendar/add-event-dialog.tsx` (component, CRUD)

**Analog:** self — add `eventId`/`initialData` props for edit mode alongside create mode (D-14, D-17).

**Current create-only props** (lines 26-30):
```typescript
type Props = {
  data: CalendarSelection | null;
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
};
```

**Add edit-mode props (D-14):**
```typescript
type Props = {
  data: CalendarSelection | null;
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
  eventId?: string;                       // NEW
  initialData?: {                         // NEW
    title: string;
    type: string;
    start: Date;
    end: Date;
    description?: string | null;
  } | null;
};
```

**Use `update` mutation in edit mode** — from `use-calendar.ts:33-38`:
```typescript
const update = useMutation({
  mutationFn: updateCalendarEvent,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["calendar"] });
  },
});
```

**Submit branch (D-14):**
```typescript
const onEventSubmit = (data: EventPayload) => {
  if (eventId) {
    update.mutate(
      { id: eventId, data: { ...data, end: addDays(data.end, 1) } },
      { onSuccess: (res) => { toast.success(res.message); } },
    );
  } else {
    add.mutate(
      { ...data, end: addDays(data.end, 1) },
      { onSuccess: (res) => { toast.success(res.message); } },
    );
  }
  form.reset();
  setVisible(false);
};
```

**Pre-fill effect for edit mode (mirror apply-leave-dialog.tsx:70-92):**
```typescript
useEffect(() => {
  if (initialData) {
    form.reset({
      title: initialData.title,
      type: initialData.type,
      description: initialData.description ?? "",
      start: initialData.start,
      end: initialData.end,
    });
  }
}, [initialData, form]);
```

**Submit button label:** `{eventId ? "Update Event" : "Create Event"}`.

**Free-text type field (D-17):** current schema at lines 32-38 uses `type: z.string()`. Backend `createCalendarEventSchema.type` is `z.string()` (free-text) but response enum is `['holiday','session','task','meeting','calendar-event']`. Decision flagged — either enum the create type or map free-text into enum. Keep both schema + dialog in lockstep.

---

### `../saher-backend/src/calendar/calendar.routes.ts` (route, request-response)

**Analog:** `../saher-backend/src/reimbursement/reimbursement.routes.ts` — the `authorize()` middleware pattern.

**Current calendar routes (28 lines, NO `authorize()`):**
```typescript
calendarRouter.get('/:year/:month', getCalendarEventByMonth);
calendarRouter.post('/sync-holidays', syncGoogleHolidaysController);
calendarRouter.post('/event', validate(createCalendarEventSchema), createCalendarEventController);
calendarRouter.put('/event/:id', validate(updateCalendarEventSchema), updateCalendarEventController);
calendarRouter.delete('/event/:id', deleteCalendarEventController);
calendarRouter.patch('/event/restore/:id', restoreCalendarEventController);
```

**RBAC pattern to copy (D-16)** — from `reimbursement.routes.ts:33-44`:
```typescript
import { authorize } from '../permission/authorize.js';

billRouter.post(
  '/bill',
  authorize('write', 'postReimbursement'),
  validate(userBillCreateSchema),
  userCreateBill,
);
billRouter.patch(
  '/:billId',
  authorize('update', 'postReimbursement'),
  validate(userBillUpdateSchema),
  userUpdateBill,
);
billRouter.delete('/:billId', authorize('delete', 'postReimbursement'), userSoftDeleteBill);
```

**Research F2 warning:** the permission matrix `role-permission.ts` has **NO `calendar` resource** (RESEARCH.md Pitfall 2). Frontend `lib/permissions.ts:10-25` has `event` as the nearest resource with `event:read/write/update/delete`. **Decide in plan** whether to reuse `event` (existing matrix + frontend already have it) or add a `calendar` resource. If reusing `event`, both backend `role-permission.ts` and frontend already gate it — this is the lowest-friction path.

**Add `authorize('write'|'update'|'delete', 'event')`** to `/event`, `/event/:id` PUT, `/event/:id` DELETE, `/event/restore/:id` routes.

---

### `../saher-backend/src/calendar/calender.controller.ts` (controller, CRUD)

**Analog:** self — the timezone bug in the month-boundary query (D-12). The boundary query lives in `src/libs/utils/calendar.ts:162-166`:
```typescript
export const getCalendarEvents = async (year: number, month: number): Promise<EventT[]> => {
  const numberOfDays = calculateNumberOfDays(year, month);
  const startOfMonth = new Date(year, month, 1);              // server-local tz
  const endOfMonth = new Date(year, month, numberOfDays + 1); // server-local tz
```

**Root cause (F1):** Dev box is `Asia/Kolkata` so it appears to work; Docker container runs UTC. IST events at month edges (e.g., 2026-09-01 07:00 IST = 01:30Z) can be excluded by a UTC `$gte/$lt` boundary.

**Fix options (plan must pick after repro):**
1. Pin `ENV TZ=Asia/Kolkata` in backend Dockerfile (matches research A1)
2. Make boundary IST-explicit in code using a tz-aware computation (use the same `+05:30` offset the frontend sends in `dateInputToIso`)

The aggregation pipeline itself (lines 168-217) is verified working — it `$set`s `type:'calendar-event'`, builds `details`, and sorts docs correctly. **Do NOT rewrite the pipeline; fix the boundary.**

---

### `../saher-backend/src/calendar/calendar.schema.ts` (config/schema)

**Analog:** self — the type mismatch (D-17). Response schema restricts to enum (lines 3-17), create schema is free-text (lines 19-25):
```typescript
export const eventType = ['holiday', 'session', 'task', 'meeting', 'calendar-event'];

export const event = z.object({
  // ...
  type: z.enum(eventType),   // response enum
  // ...
});

export const createCalendarEventSchema = z.object({
  title: z.string(),
  type: z.string(),          // ← free-text, mismatch
  // ...
});
```

**Fix (D-17):** align free-text with enum. Coordinate: when editing create → enum, `add-event-dialog.tsx` free-text `<Input>` must become a `<Select>`; when editing response → any string, frontend can keep free-text.

---

### `../saher-backend/src/leave/leave.controller.ts` (controller, CRUD)

**Analog:** self — the D-11 field-name mismatch. NOTE: RESEARCH F4 corrects the CONTEXT claim — the bug is at lines 187-191 and 207-216.

**Buggy code (lines 187-191):**
```typescript
const updatedLeaveTypeCode = payload.leaveCode ?? leave.type;
const leaveType = await LeaveType.findOne({
  _id: updatedLeaveTypeCode,     // ← resolves by _id, but create path uses code
  isActive: true,
});
```

**Buggy write (lines 214-216):**
```typescript
...(payload.leaveCode && {
  leaveCode: payload.leaveCode,   // ← writes a field NOT on the schema/model (type on Leave is leave.type)
}),
```

**Fix:** read `payload.type` (schema field) and write `type: newLeaveType._id`:
```typescript
const updatedLeaveTypeCode = payload.type ?? leave.type;   // was payload.leaveCode
// ...findOne by code (same as create path) or by _id — pick ONE, stay consistent
```
Research Pitfall 3 warns: create path resolves `type` by `code`, update currently resolves by `_id`. Fix both to resolve by `code` (same as create) OR by `_id` consistently. The model field is `leave.type` (stores leave-type _id).

**Preserve the ownership check** (lines 177-179):
```typescript
if (leave.user.toString() !== userId) {
  throw new ApiError(403, 'You are not allowed to update this leave application');
}
```

**Frontend workaround exists** — `apply-leave-dialog.tsx:114-122` currently sends `leaveCode`:
```typescript
const leaveCode = leaveTypes.data?.find((lt) => lt.code === type)?.id;
updateApplication.mutate(
  { id: leave.id, data: { startDate, endDate, reason, proof, leaveCode } },
```
After the backend fix, the frontend should send `type: code` consistently with create path.

---

## Shared Patterns

### Delete Confirmation — AlertDialog
**Source:** `app/(main)/reimbursement/management/page.tsx:310-325`
**Apply to:** Calendar delete (D-13), notice trash permanent-delete (D-04)
```tsx
<AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete …?</AlertDialogTitle>
      <AlertDialogDescription>…</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={confirmDelete} disabled={mutation.isPending}>
        {mutation.isPending ? "Deleting…" : "Delete"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Mutation flow — no optimistic writes (D-19/D-29)
**Source:** `hooks/use-reimbursement.ts:56-61`, `hooks/use-calendar.ts:26-45`
**Apply to:** All mutations
```typescript
// Money rule D-29: NO optimistic writes anywhere — every mutation funnels
// here; the server refetch after invalidation is the only way cache changes.
const invalidate = () => {
  queryClient.invalidateQueries({ queryKey: ["bills"] });
  // ...
};
```
Every mutation: `onSuccess: invalidate` (or `onSettled`), no optimistic cache update.

### IST date handling
**Source:** `lib/date.ts` (`dateToIstDateOnly`, `istDateOnlyToDate`, `dateInputToIso`, `formatIstDate`, `isoToIstInput`, `addDays`)
**Apply to:** Calendar dates, leave dates, bill dates
Use `timeZone="Asia/Kolkata"` on `<Calendar>` (employee-details.tsx:231) and FullCalendar `timeZone="Asia/Kolkata"` (calendar.tsx:125).

### Backend route authorization
**Source:** `../saher-backend/src/reimbursement/reimbursement.routes.ts:33-44`, `../saher-backend/src/leave/leave.route.ts:41-60`
**Apply to:** Calendar routes (D-16)
```typescript
router.post('/', authorize('write', '<resource>'), validate(schema), controller);
router.put('/:id', authorize('update', '<resource>'), validate(schema), controller);
router.delete('/:id', authorize('delete', '<resource>'), controller);
```

### FieldError/Controller form pattern
**Source:** `features/reimbursement/create-bill-dialog.tsx:55-116`, `features/calendar/add-event-dialog.tsx:86-186`
**Apply to:** EditBillDialog, AddEventDialog edit mode
```tsx
<Controller
  name="field"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor="field">Label</FieldLabel>
      <Input {...field} id="field" aria-invalid={fieldState.invalid} />
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

---

## No Analog Found

None — every fix has an exact self-analog or role-match analog in the codebase. This is a bug-fix phase; all work is modifying existing files or mirroring existing patterns.

## Backend Coordinate Notes (D-21)

These two repos must be planned together. Each backend edit has a matching frontend consumer:
- **Calendar boundary fix (D-12)** → backend `calendar.ts` or Dockerfile TZ → verify against `add-event-dialog.tsx` date drift (`addDays`/`subDays` juggling)
- **Calendar RBAC (D-16)** → backend `calendar.routes.ts` → frontend `lib/permissions.ts` matrix already has `event` resource — reuse `event:write/update/delete` or add `calendar`
- **Calendar type enum (D-17)** → backend `calendar.schema.ts` + `add-event-dialog.tsx` type field lockstep
- **Leave update field fix (D-11)** → backend `leave.controller.ts` → frontend `apply-leave-dialog.tsx:114-122` change `leaveCode` → `type`
- **Notice trash listing (D-04)** → backend `notice.controller.ts` `getNotices` add `?isDeleted=` param → frontend `services/notice.api.ts` + `hooks/use-notice.ts` + `notice-trash.tsx`

## Metadata

**Analog search scope:**
- Frontend: `features/`, `hooks/`, `services/`, `components/`, `app/(main)/`
- Backend: `../saher-backend/src/calendar/`, `../saher-backend/src/leave/`, `../saher-backend/src/notice/`, `../saher-backend/src/reimbursement/`
- `lib/` (permissions, api-wrapper, date)

**Files scanned:** 18 frontend + 8 backend files
**Pattern extraction date:** 2026-08-31
