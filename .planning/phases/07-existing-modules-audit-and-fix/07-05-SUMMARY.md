# 07-05-SUMMARY: Shared Trash Pattern Enforcement (Realized to Audit)

## What was done

**Task 1 — Audit all soft-deletable resources (complete):**

Genuinely soft-deletable resources (have `isDeleted` list filter + `restore` endpoint):
- Programs, workshops, sessions, participants (`services/program|workshop|session|participant.api.ts`)
- Reimbursement bills (`getMyBills(isDeleted)`, `restoreBill`)
- Notices (`notice.api.ts`, restore endpoint)
- Bank accounts (`admin.api.ts`, `restoreBank`)

All of these already implement the shared trash pattern:
- `features/program/*/all-*.tsx` use `<Tabs>` Active/Deleted + `isDeleted` query param
- `features/noticeboard/notice-trash.tsx` uses `TrashTabPattern`
- `features/reimbursement/recycle-bin.tsx` handles bills trash

**Tasks 2–6 (REALIZED — premise was incorrect):** The plan originally assumed users, attendance corrections, leave, mail, and payroll are soft-deletable. The audit found:
- **Users:** `getAdminUsers` has no `isDeleted` param — `/api/admin/users?fields=isActive` returns all users; trash distinction is the `isActive` field, already surfaced in `features/users/user-action.tsx` (Delete vs Restore / Delete Permanently dropdown). No Active/Deleted tabs added.
- **Attendance corrections:** status workflow (pending/approve/reject), not soft-delete (plan itself allowed documenting this).
- **Leave:** `getLeaveApplications`/`getAllLeaveApplications` have no `isDeleted` filter, no restore.
- **Mail:** `getMails`/`getSentMails` have no `isDeleted` filter, no restore.
- **Payroll:** `getPayrollList` no `isDeleted`, immutable records.

No speculative delete/trash UI was forced onto modules where the backend provides no delete — consistent with the "build only what the backend demonstrably supports" constraint.

**Bonus — fixed 07-04 regression:** While building 07-05, the production build failed on `features/notification/notification-box.tsx:32`. The 07-04 commit introduced a broken `useNotification` shape: a `select` that returned `{ data, unseenCount }` while `getNotification` typed `NotificationListResponse` — the observer result had no `unseenCount` property, and the component still treated `data` as the raw array. Root cause fixed:
- `getNotification` reverted to return the raw `NotificationResponseT[]` (original working shape)
- Removed unverified `meta.unseenCount` (not in `MetaResponse` type) — badge count now computed client-side from `isSeen`
- Component computes `unseenCount = notifications.filter(n => !n.isSeen).length`

## Verification

- `pnpm lint` — 0 errors (57 pre-existing warnings)
- `pnpm build` — compiles clean

## Decisions / notes

- D-48: The trash-tab pattern is only applied to resources with a verified `isDeleted`/`restore` contract. Users use `isActive`, not `isDeleted`; attendance/leave/mail/payroll have no soft-delete. AUDT-05 is satisfied by confirming the pattern already covers all soft-deletable modules — no new surfaces were force-added.
- The 07-04 `meta.unseenCount` assumption was unverified against `MetaResponse`; unseen count is computed client-side from `isSeen` (guaranteed correct).
