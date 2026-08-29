# Phase 6: Admin Bank/Accounts & Events Depth - Pattern Map

**Mapped:** 2026-08-29
**Files analyzed:** 14 new/modified files
**Analogs found:** 13 / 14

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `services/admin.api.ts` (NEW) | service | CRUD | `services/payroll.api.ts` (zod+strict partial) + `services/program.api.ts` (apiFetch+normalizeList) | exact |
| `services/program.api.ts` (FIX) | service | CRUD + event-driven | itself (`services/program.api.ts`) | exact |
| `services/workshop.api.ts` (ADD) | service | CRUD | itself (`services/workshop.api.ts`) | exact |
| `services/session.api.ts` (ADD) | service | CRUD + event-driven | itself (`services/session.api.ts`) | exact |
| `services/participant.api.ts` (ADD) | service | CRUD | itself (`services/participant.api.ts`) | exact |
| `hooks/use-admin.ts` (NEW) | hook | CRUD (invalidation-only) | `hooks/use-payroll.ts` (money gating) + `hooks/use-programs.ts` (roster) | exact |
| `hooks/use-sessions.ts` (ADD) | hook | CRUD + diff engine | itself (`hooks/use-sessions.ts`) | exact |
| `features/admin/bank-details.tsx` (NEW) | component (form) | request-response | `features/register/bank-details.tsx` | exact |
| `features/admin/account-edit.tsx` (NEW) | component (form) | request-response | `features/register/employee-details.tsx` + `app/(main)/(manager)/users/[id]/page.tsx` | role-match |
| `features/register/register-schema.ts` (FIX) | config/model (zod) | transform | itself (`features/register/register-schema.ts`) | exact |
| `features/register/employee-details.tsx` (FIX) | component | transform | itself (`features/register/employee-details.tsx`) | exact |
| `features/users/` directory extension (FIX) | component (table+drawer) | CRUD | itself (`features/users/data-table.tsx`, `column.tsx`) | exact |
| `app/(main)/program/sessions/attendance/[id]/page.tsx` (FIX) | component | CRUD (diff engine) | itself (`[id]/page.tsx`) | exact |
| `hooks/use-profile.ts` (FIX) | model | transform | itself (`hooks/use-profile.ts` AccountT) | exact |

---

## Pattern Assignments

### `services/admin.api.ts` (service, CRUD — new)

**Analog:** `services/payroll.api.ts` (zod response schemas + `z.infer` types + strict partial update) + `services/program.api.ts` (`apiFetch` + `normalizeList` envelope).

**Imports pattern** (`services/payroll.api.ts:1-3`, `services/program.api.ts:1-4`):
```typescript
import { apiFetch } from "@/lib/api-wrapper";
import { normalizeList } from "@/lib/normalize-list";
import { z } from "zod";
```

**Response schema + inference** (`services/payroll.api.ts:13-29` — mirror the backend schema exactly; account/bank read embeds full unmasked `bank`, reuse `BankT`/`AccountT` from `hooks/use-profile.ts`):
```typescript
export const adminUserResponseSchema = z.object({
  id: z.string(),
  // ... mirror backend admin/_services/{user,account,bank}.ts
});
export type AdminUserResponse = z.infer<typeof adminUserResponseSchema>;
```

**Unpaginated list via normalizeList** (`services/payroll.api.ts:51-64` — `GET /api/admin/users` returns a full array; RESEARCH ADMN-02 says to wrap with `normalizeList` so `{items,page:1,limit:all,totalPages:1}`):
```typescript
export const getAdminUsers = async (): Promise<ReturnType<typeof normalizeList<AdminUserResponse>>> => {
  const res = await apiFetch<AdminUserResponse[]>(`/api/admin/users?fields=isActive`, { method: "GET" });
  return normalizeList<AdminUserResponse>(res);
};
```

**Strict-partial update (only account fields)** (`services/payroll.api.ts:81-86`; contract: `accountBaseSchema.partial().strict()` — sending `user`/`bank` keys 400s, RESEARCH ADMN-03):
```typescript
export const updateAccount = async ({ id, data }: { id: string; data: Partial<AccountFields> }) => {
  await apiFetch(`/api/admin/account/${id}`, { method: "PUT", body: JSON.stringify(data) });
};
```

**Bank CRUD + restore** (pattern from `program.api.ts:69-75` delete + RESEARCH restore snippet):
```typescript
export const createBank = async (data: BankInput) =>
  apiFetch(`/api/admin/bank`, { method: "POST", body: JSON.stringify(data) });
export const restoreBank = (id: string) => apiFetch(`/api/admin/bank/restore/${id}`, { method: "PATCH" });
```

> **Note:** These NEW service fns should use the **throw-on-failure** style of `services/payroll.api.ts` (no `if (!res.success) toast.error(...)` — apiFetch already toasts). The older `program/session/workshop/participant` services keep their explicit `toast.error` blocks; do NOT copy that legacy style into new code (RESEARCH §State of the Art).

---

### `services/program.api.ts` (FIX — participant body + restore + roster source)

**Analog:** itself.

**Bugged line to fix** (`program.api.ts:84-87` — sends raw array; backend expects `{participantIds[]}`):
```typescript
// CURRENT (BROKEN): body: JSON.stringify(participants)
// FIX (RESEARCH §Code Examples):
export const addParticipantsInProgram = async ({ id, participants }: { id: string; participants: string[] }) =>
  apiFetch(`/api/events/programs/participants/${id}`, {
    method: "POST",
    body: JSON.stringify({ participantIds: participants }), // verified addParticipantsToProgramSchema
  });
```

**Add `restoreProgram`** (pattern from `deleteProgram` `program.api.ts:69-75`):
```typescript
export const restoreProgram = (id: string) => apiFetch(`/api/events/programs/restore/${id}`, { method: "PATCH" });
```

**Roster source fix (Pitfall 3):** `getSingleProgram` already returns populated `.participants[]` (`program.api.ts:40-46`) — use `SingleParticipantT.participants` for roster UI, NOT `getParticipantFromProgram` (raw ObjectIds; `program.api.ts:92-101`).

---

### `services/workshop.api.ts` (ADD `restoreWorkshop`)

**Analog:** itself. Add beside `deleteWorkshops` (`workshop.api.ts:71-77`):
```typescript
export const restoreWorkshop = (id: string) => apiFetch(`/api/events/workshops/restore/${id}`, { method: "PATCH" });
```

---

### `services/session.api.ts` (ADD restore/reminder/export; attendance types)

**Analog:** itself. Attendance mutation functions already exist at `session.api.ts:105-157` (`markSessionAttendance` POST, `updateSessionAttendance` PUT, `deleteSessionAttendance` DELETE — all take `{participantIds}`).

**Add restore** (pattern `deleteSession` `session.api.ts:97-103`):
```typescript
export const restoreSession = (id: string) => apiFetch(`/api/events/sessions/restore/${id}`, { method: "PATCH" });
```

**Add reminder + export** (RESEARCH §Code Examples — odd GET, no body; GET export returns `{jobId, format}` via `.data`):
```typescript
export const sendSessionReminder = async (sessionId: string) =>
  apiFetch(`/api/events/programs/workshops/sessions/${sessionId}`, { method: "GET" });

export const requestSessionExport = async (sessionId: string, format: "pdf" | "xlsx" = "pdf") =>
  (await apiFetch<{ jobId: string; format: string }>(
    `/api/events/export/report?sessionId=${sessionId}&format=${format}`, { method: "GET" })).data;
```

**Attendance type:** `SessionT.participants` is already `ParticipantT[]` (`session.api.ts:30`) — prefill the grid from `session.data.participants.map(p => p.id)`.

---

### `services/participant.api.ts` (ADD `restoreParticipant`, isDeleted)

**Analog:** itself. Add restore beside `deleteParticipant` (`participant.api.ts:117-123`):
```typescript
export const restoreParticipant = (id: string) => apiFetch(`/api/events/participants/restore/${id}`, { method: "PATCH" });
```

**isDeleted fix (Pitfall 5):** participants have NO default filter — always pass `isDeleted=false` explicitly on `getParticipants` (`participant.api.ts:70-83`); append `&isDeleted=${isDeleted}` like the other list fns pass `keyword`/`page`/`limit`.

---

### `hooks/use-admin.ts` (hook, CRUD — new)

**Analog:** `hooks/use-payroll.ts` (invalidation-only money rule D-29) + `hooks/use-programs.ts` (query+mutations shape). Bank/account writes are money/KYC — NO optimistic writes, invalidate-only (RESEARCH Constraints D-29, D-26 double-submit).

**Core pattern** (`use-payroll.ts:13-40`):
```typescript
export const useAdminUsers = () => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin"] });

  const list = useQuery({ queryKey: ["admin", "list"], queryFn: getAdminUsers });

  const createBank = useMutation({ mutationFn: createBank, onSuccess: invalidate });
  const updateAccount = useMutation({ mutationFn: updateAccount, onSuccess: invalidate });
  const restoreBank = useMutation({ mutationFn: restoreBank, onSuccess: invalidate });

  return { list, createBank, updateAccount, restoreBank };
};
```

**Roster/participant sub-query** (from `use-programs.ts:42-46`, `queryKey: ["programs","participants",id]` enabled on `!!id`).

---

### `hooks/use-sessions.ts` (ADD reminder/export + diff helpers; reuse existing attendance mutations)

**Analog:** itself. `markAttendance`/`updateAttendance`/`deleteAttendance` already invalidate `["sessions"]` (`use-sessions.ts:37-56`). Add:
```typescript
const sendReminder = useMutation({
  mutationFn: sendSessionReminder,
  onSuccess: () => toast.success("Reminder sent to the session speaker."),
});
const requestExport = useMutation({
  mutationFn: requestSessionExport,
  onSuccess: () => toast.success("Report generation started — check notifications for the download link."),
});
```

**Attendance diff engine (EVNT-06)** — compute `added`/`removed`, then run `markAttendance` (POST) for additions and `deleteAttendance` (DELETE) for removals, sequential, invalidate once (RESEARCH §Code Examples):
```typescript
// fired from the grid page; both mutations already invalidate ["sessions"]
const existing = useMemo(() => new Set(session.data?.participants?.map(p => p.id) ?? []), [session.data]);
const added = selection.filter(id => !existing.has(id));
const removed = [...existing].filter(id => !selection.includes(id));
```

---

### `features/admin/bank-details.tsx` (component/form, request-response — new)

**Analog:** `features/register/bank-details.tsx` — the exact bank form (fields, `<Controller>` + `Field`/`FieldLabel`/`FieldError`/`aria-invalid` pattern, `bankDetailSchema`).

**Core form field pattern** (`register/bank-details.tsx:22-46`):
```jsx
<Controller
  name="bank.accountHolderName"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor="account-holder-name">Account Holder Name</FieldLabel>
      <Input {...field} id="account-holder-name" aria-invalid={fieldState.invalid} />
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

**Masking (ADMN-04) — apply to LISTS only, never the edit/detail form.** Small util (RESEARCH asks for a 3-liner; ponytail: inline in the component or one tiny exported fn):
```typescript
export const maskAccount = (num: string): string =>
  num.length > 4 ? `•••• ${num.slice(-4)}` : "••••";
```

**Form submission** — resolve via `zodResolver(accountBaseSchema.partial().strict())`, submit `updateAccount` from `use-admin.ts`. Manager-only gate (`can(role,'write','bank')`) via `<RoleAccess>` (`components/role-access.tsx`).

---

### `features/admin/account-edit.tsx` (component/form, request-response — new)

**Analog:** `features/register/employee-details.tsx` (the `account.*` `Select`/fields `Controller` pattern) + the `user/[id]/page.tsx` account/bank detail layout to extend with an edit drawer.

**Employee-type select** (`register/employee-details.tsx:31,79-110` — `Select` + `SelectItem` map over `employeeType` array; update the array to the full five-value list):
```jsx
<Select aria-invalid={fieldState.invalid} onValueChange={field.onChange}>
  <SelectTrigger><SelectValue placeholder="Employee Type" /></SelectTrigger>
  <SelectContent><SelectGroup>
    {employeeType.map((type) => <SelectItem key={type} value={type}>{type.toLocaleUpperCase()}</SelectItem>)}
  </SelectGroup></SelectContent>
</Select>
```

**Strict-partial submit:** only account fields — do NOT send the `{user, account, bank}` envelope to `PUT /api/admin/account/:id` (400; RESEARCH anti-pattern).

**IST date pickers (EVNT-04, Pitfall 9):** use `dateToIstDateOnly`/`formatIstDate` + `<Calendar>` (from `employee-details.tsx:29` and `lib/date.ts`), prefill from `isoToIstInput`, send `combineDateAndTimeToIso(...)` ISO strings (all directly from `services/session.api.ts` + `lib/date.ts` — future-dated only).

---

### `features/register/register-schema.ts` (FIX employeeType enum)

**Analog:** itself. Two coordinated edits:
- `register-schema.ts:70-73`: `employeeType: z.enum(["full-time","part-time","volunteer"])` → add `"free"` and `"intern"` (backend `employeeTypeList = ['free','intern','full-time','part-time','volunteer']`; RESEARCH Pitfall 4). Keep the `part-time ⇒ employeeShift required` refine at `register-schema.ts:82-93`.
- `features/register/employee-details.tsx:31`: `const employeeType = ["volunteer", "part-time", "full-time"]` → same five values (this is the rendered `Select` list).
- `hooks/use-profile.ts:23`: `AccountT.employeeType` union → add `"free" | "intern"`.

---

### `features/users/*` directory extension (account/bank drawers)

**Analog:** itself. The existing users table already does client-side name-filter + pagination + sorting + `PaginationFooter` (`data-table.tsx`), soft-delete/restore dropdown (`user-action.tsx`), and `isActive` badge (`column.tsx:67-77`). Extend rather than rebuild:
- Directory search/pagination is **already client-side** — no backend change needed (ADMN-02).
- Add account/bank detail + edit drawer wired to `use-admin.ts` and masked `BankT` in list rows.
- Delete/restore (`user-action.tsx`) and account/bank detail view (`app/(main)/(manager)/users/[id]/page.tsx`) already exist — reconcile the `AccountT` from `apiFetch<AccountT>`.

---

### `app/(main)/program/sessions/attendance/[id]/page.tsx` (FIX — prefill + diff)

**Analog:** itself. Current page prefills `present: []` (`page.tsx:25-31`) and POSTs whole selection (`page.tsx:51-64`) — both broken against merge-only semantics. Fix:
- Prefill from `session.data.participants.map(p => p.id)` instead of `[]`.
- "Mark All"/"Clear" restate `selection` (buttons already exist `page.tsx:147-168`).
- Submit diffs: `added → markAttendance` (POST), `removed → deleteAttendance` (DELETE), sequential; keep "Saving…" disabled-while-pending (D-26) and invalidate-only (D-29).
- Roster source: use `session.data.program` + `getSingleProgram().participants` (populated), NOT the raw-ObjectId ID-list endpoint (Pitfall 3).

---

## Shared Patterns

### 1. Data-layer slice-contract (all service files)
**Source:** `services/payroll.api.ts` (new code) / `services/program.api.ts` (existing event services)
**Apply to:** `services/admin.api.ts`, and all event service fixes.
Each service: one fn per endpoint, `apiFetch` handles envelope/401/toasts, `normalizeList` for arrays, zod schemas + `z.infer` types mirroring the backend contract exactly (RESEARCH §Pattern 1). New code throws on failure (no `if (!res.success)` legacy checks); event services keep theirs (fix-in-place, don't churn).

### 2. Query/mutation hook + queryKey + invalidate
**Source:** `hooks/use-payroll.ts`, `hooks/use-programs.ts`, `hooks/use-sessions.ts`
**Apply to:** `hooks/use-admin.ts`, `hooks/use-sessions.ts`
- queryKey: hierarchical `["<resource>", list|detail|sub, ...params]`.
- Mutations call `queryClient.invalidateQueries({ queryKey: ["<resource>"] })` on success.
- Money/bank/KYC: **no optimistic writes** (D-29); double-submit prevention (D-26) — disable submit while `isPending`.

### 3. apiFetch single HTTP funnel
**Source:** `lib/api-wrapper.ts`
**Apply to:** all services. Never bare `fetch`. Envelope `{success,message,data,meta?}`; 401 single-flight refresh + one retry; toasts errors; throws on failure.

### 4. IST date handling
**Source:** `lib/date.ts`
**Apply to:** all session forms (EVNT-04), attendance prefill (EVNT-06), account `dateOfBirth`/`dateOfJoining` display.
Use `formatIstDate`/`formatIstDateTime`/`isoToIstInput`/`combineDateAndTimeToIso`/`dateToIstDateOnly`/`istDateOnlyToDate`. Never raw browser-timezone `Date`/`Intl` in event/admin UI. Backend rejects past `date`/`startTime`, requires `endTime > startTime` — prefill from IST-converted values.

### 5. RBAC affordance gating
**Source:** `lib/permissions.ts` (`can(role, action, resource)`), `components/role-access.tsx`, `components/role-guard.tsx`
**Apply to:** all admin/bank UI.
- Bank forms: `can(role,'write'|'update','bank')` — **manager only**; admin has only `bank:read` (hide write affordances, RESEARCH Pitfall 2).
- Account edit: `can(role,'update','account')` — admin+manager.
- Directory page: gate by group role (`(manager)`/`(admin)` route groups), not `can('read','account')` (A7 — manager can read via controller).

### 6. CRUD + trash/restore tabs
**Source:** `components/shared/trash-tab-pattern.tsx`, `services/*.api.ts` restore fns
**Apply to:** programs/workshops/sessions/participants/bank/user lists. Restore = `PATCH .../restore/:id`; trash tabs use the `TrashTabPattern` wrapper; destructive color only on delete/trash actions (UI-SPEC).

### 7. Export → notification download delivery
**Source:** `features/notification/notification-box.tsx:107-113` (download action)
**Apply to:** EVNT-08 trigger. Fire `requestSessionExport`, toast "check notifications"; NotificationBox renders `action.type === "download"` as `<a href={action.url}>` (`/api/attendance/download/<jobId>.<ext>`). Treat "processing"/"already generated" responses as success — never poll, never re-enqueue (Pattern 3 / Pitfall 6).

### 8. Speaker picker
**Source:** `components/user-search-picker.tsx` (debounced user search via `getSearchUser`)
**Apply to:** EVNT-04 session create/edit — `speaker: string[]` of user ObjectIds (users, not participants).

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `lib` `maskAccount` util | utility | transform | No masking util exists (only a 3-line requirement). Ponytail: inline as a tiny exported fn in the bank list/drawer component, not a separate lib file. |
| Attendance diff-engine unit test | test | transform | No test files/runner exist (`msw` allowlisted, `tests/` dir present with vitest config — RESEARCH Environment). Pattern: pure function `added`/`removed` is unit-testable with a plain `assert`/vitest; no msw needed (RESEARCH Open Q2). |

---

## Metadata

**Analog search scope:** `services/`, `hooks/`, `features/register`, `features/users`, `features/program/*`, `features/notification`, `app/(main)/(manager)/users/[id]/page.tsx`, `app/(main)/program/sessions/attendance/[id]/page.tsx`, `lib/{date,permissions,normalize-list,common-zod-schema}.ts`, `components/{role-access,user-search-picker,shared/trash-tab-pattern}.tsx`
**Files scanned:** 22 source files (services ×6, hooks ×5, features ×6, lib ×4, components/shared ×3, pages ×2)
**Pattern extraction date:** 2026-08-29
