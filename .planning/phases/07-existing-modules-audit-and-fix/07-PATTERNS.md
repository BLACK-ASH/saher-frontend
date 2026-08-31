# Phase 07: Existing Modules Audit-and-Fix - Pattern Map

**Mapped:** 2026-08-30
**Files analyzed:** Audit of existing modules against Phase 1–6 contracts
**Analogs found:** All fix targets map to existing patterns in Phases 1–6

## File Classification (Fix Targets)

| Target File/Module | Role | Data Flow | Closest Analog | Match Quality | Fix Type |
|--------------------|------|-----------|----------------|---------------|----------|
| `features/calendar/calendar.tsx` | component | request-response | `features/attendance/attendance-table.tsx` (IST dates via lib/date) | high | raw Date → lib/date |
| `features/profile/profile.tsx` | component | request-response | `features/attendance-correction/attendance-correction-view.tsx` (dialog + actions) | medium | add active sessions UI |
| `features/change-email/components/change-email-form.tsx` | component/form | request-response | `features/change-password/components/change-password-form.tsx` (token flow) | exact | add pending/success/expired states |
| `features/change-password/components/change-password-form.tsx` | component/form | request-response | itself | exact | add pending/success/expired states |
| `features/verify-email/components/verify-email-form.tsx` | component | request-response | `features/change-email/components/change-email-form.tsx` | exact | add pending/success/expired states |
| `hooks/use-profile.ts` | hook | request-response | `hooks/use-sessions.ts` (extend return shape) | high | add activeSessions query + revoke mutation |
| `features/notification/notification-box.tsx` | component | request-response | itself (already aligned) | exact | verify unseen badge |
| `components/shared/trash-tab-pattern.tsx` | shared pattern | display | `features/noticeboard/notice-trash.tsx` usage | exact | enforce on all soft-delete resources |
| Multiple staff screens | component | display | `features/attendance/attendance-table.tsx` (responsive table) | high | responsive pass |
| `tests/` (new) | test | verify | `tests/reimbursement-hook.test.tsx`, `tests/api-wrapper.test.ts` | exact | add money-path + auth refresh tests |

---

## Pattern Assignments

### 1. IST Date Alignment (Calendar, Dashboard, Register)

**Analog:** `features/attendance/attendance-table.tsx:14` — uses `formatIstDate(attendance.date)` from `lib/date.ts`

**Fix pattern:** Replace raw `new Date()` initializations with `dateToIstDateOnly(new Date())` or `istDateOnlyToDate(istDateOnlyString)` from `lib/date.ts`

**Files:**
- `features/calendar/calendar.tsx:13` — `useState(new Date())` → `useState(dateToIstDateOnly(new Date()))`
- `features/dashboard/attendance-grid/attendance-dashboard.tsx:45` — `const today = new Date()` → `dateToIstDateOnly(new Date())`
- `features/register/basic-details.tsx:29`, `employee-details.tsx:29` — `selected={new Date()}` / `defaultMonth={new Date()}` → `dateToIstDateOnly(new Date())`
- `features/noticeboard/notice-expiry-badge.tsx:18` — `const now = new Date()` → `dateToIstDateOnly(new Date())` (display uses `formatIstDate` already)

**Note:** Raw `new Date()` for UI-only date picker defaults is acceptable if the picker component expects a native Date; the fix is to use `istDateOnlyToDate(dateToIstDateOnly(new Date()))` for IST-correct defaults.

---

### 2. Token-Confirm Flow UX States (AUTH-02)

**Analog:** `features/attendance-correction/attendance-correction-view.tsx` — dialog with loading/success/error states via `isPending`, `toast`

**Fix pattern:** Wrap `apiFetch` call in mutation with `isPending` state, show inline pending indicator, toast success, handle error with expired/invalid token messaging.

**Target files:**
- `features/change-email/components/change-email-form.tsx` — add `isPending` from `useMutation`, disable submit, show "Verifying..." spinner, toast success with message, handle `res.success === false` with specific error (token expired/invalid)
- `features/change-password/components/change-password-form.tsx` — same pattern
- `features/verify-email/components/verify-email-form.tsx` — currently auto-submits on mount with spinner; add explicit success/error/expired UI states instead of just spinner

**Mutation pattern** (from `hooks/use-attendance.ts:40-52`):
```typescript
const mutation = useMutation({
  mutationFn: (data) => apiFetch(...),
  onSuccess: (res) => { toast.success(res.message); router.push("/"); },
  onError: (err) => { toast.error(err.message); },
});
```

---

### 3. Active Sessions View/Revoke (AUTH-03)

**Analog:** `hooks/use-sessions.ts` — session CRUD with mutations

**New backend endpoint needed:** `GET /api/auth/sessions` (list active sessions), `DELETE /api/auth/sessions/:id` (revoke)

**Hook extension** (`hooks/use-profile.ts`):
```typescript
export const useProfile = () => {
  // existing profile query
  const profile = useQuery({ queryKey: ["user", "profile", "me"], queryFn: ... });

  // NEW: active sessions
  const sessions = useQuery({
    queryKey: ["user", "sessions"],
    queryFn: async () => {
      const res = await apiFetch<SessionT[]>("/api/auth/sessions");
      return res.data;
    },
  });

  const revokeSession = useMutation({
    mutationFn: (sessionId: string) => apiFetch(`/api/auth/sessions/${sessionId}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["user", "sessions"] }); toast.success("Session revoked"); },
  });

  return { profile, sessions, revokeSession };
};
```

**UI in `features/profile/profile.tsx`:** Add Accordion section "Active Sessions" with list of sessions (device, IP, last active) and revoke button per session (confirm dialog).

---

### 4. Notifications Unseen Badge Verification (AUDT-04)

**Analog:** `hooks/use-notification.ts` — current implementation

**Check:** Backend contract for unseen count. If `GET /api/notification` returns `{ items, meta: { unseenCount } }`, update hook to return `unseenCount` and UI to render badge.

**Files:**
- `hooks/use-notification.ts` — extend query return
- `features/notification/notification-box.tsx` — already renders actions correctly

---

### 5. Shared Trash Pattern Enforcement (AUDT-05)

**Analog:** `components/shared/trash-tab-pattern.tsx` — used in noticeboard, reimbursement, program

**Audit list (soft-deletable resources):**
- ✅ Programs/Workshops/Sessions — use it
- ✅ Reimbursement bills — use it (recycle-bin)
- ✅ Noticeboard — uses it (placeholder)
- ❓ Users — `features/users/user-action.tsx` has dropdown delete/restore but no TrashTabPattern wrapper
- ❓ Attendance corrections — `features/attendance-correction/` has status badges but check for soft-delete
- ❓ Leave applications — `features/leave/` check
- ❓ Mail — `features/mail/` check
- ❓ Payroll — check

**Fix:** Wrap all soft-delete list views in `<TrashTabPattern>` with `isDeleted` query param.

---

### 6. Responsive Layout Pass (AUDT-06)

**Analog:** `features/attendance/attendance-table.tsx` — uses `Table` with horizontal scroll on mobile, `PaginationFooter` responsive

**Target screens:**
- Attendance tables (already responsive)
- Dashboard range attendance
- Leave apply form
- Mail compose (user-search-picker)
- Reimbursement create bill dialog
- Payroll table
- Program/Workshop/Session cards (grid already responsive)
- User directory data table (already uses `data-table.tsx` with responsive)
- Profile page (already two-column responsive)

**Fix:** Add `overflow-x-auto` on table containers, stack form fields on mobile, ensure dialogs are `max-h-[90vh]` with scroll.

---

### 7. Money-Path Double-Submit Test Coverage (AUDT-07)

**Analog:** `tests/reimbursement-hook.test.tsx` — tests hook mutations with msw

**Test pattern:**
```typescript
// From tests/reimbursement-hook.test.tsx: test double-submit prevention
it("prevents double submit on handle bill", async () => {
  const { result } = renderHook(() => useReimbursement());
  // fire first mutation
  result.current.handleBill.mutate({ id: "1", action: "approve", note: "ok" });
  // fire second immediately — should be ignored while isPending
  result.current.handleBill.mutate({ id: "1", action: "approve", note: "ok" });
  // only one apiFetch call
  expect(server.post("/api/finance/bills/1/handle")).toHaveBeenCalledTimes(1);
});
```

**Target mutations to test:**
- `useReimbursement().handleBill` (approve/reject/hold)
- `useReimbursement().settleBill`
- `usePayroll().recordInstallment`
- `useAdmin().updateAccount` / `createBank` / `restoreBank`
- `useAttendanceCorrection().approve` / `reject`

---

### 8. Auth Refresh Path Test Coverage (AUDT-08)

**Analog:** `tests/api-wrapper.test.ts` — tests 401 refresh retry

**Test pattern:**
```typescript
// tests/api-wrapper.test.ts: tests single-flight refresh + one retry
it("retries once after 401 then gives up", async () => {
  // mock first call 401, refresh succeeds, retry succeeds
  // mock second 401, refresh fails → session death
});
```

**Extend tests to cover:**
- `handleSessionDeath` called after refresh failure
- `resetSessionGuard` resets `died` flag on login
- Integration: mutation + query chain with 401 → refresh → retry → success

---

### 9. Services/Zod/Query Pattern Verification (AUDT-01, AUDT-03)

**Analog:** `services/attendance.api.ts`, `hooks/use-attendance.ts`, `services/program.api.ts`, `hooks/use-programs.ts`

**Checklist per module:**
- Service uses `apiFetch` + zod schema + `z.infer` types
- Hook uses `useQuery` with hierarchical queryKey
- Mutations invalidate parent queryKey
- No bare `fetch`, no inline query logic in components

---

## Shared Patterns Reference

### Data-layer slice-contract
- `services/*.api.ts` → `apiFetch` + zod schema + `normalizeList` for arrays
- `hooks/use-*.ts` → hierarchical queryKeys, invalidate on mutation
- All HTTP through `lib/api-wrapper.ts`

### IST date handling
- `lib/date.ts` → `formatIstDate`, `formatIstDateTime`, `isoToIstInput`, `combineDateAndTimeToIso`, `dateToIstDateOnly`, `istDateOnlyToDate`
- Never raw browser-timezone Date/Intl in display/parsing

### RBAC affordance gating
- `lib/permissions.ts` → `can(role, action, resource)`
- `components/role-access.tsx` — conditional render
- `components/role-guard.tsx` — route-level redirect

### Trash/restore
- `components/shared/trash-tab-pattern.tsx` — wrapper for Active/Deleted tabs
- Restore = `PATCH .../restore/:id` via service + mutation

### Export → notification
- `features/notification/notification-box.tsx` — download action with `target="_blank"`

---

## No New Analogs Needed

All fixes map to existing patterns established in Phases 1–6. No new patterns to invent — only mechanical alignment.