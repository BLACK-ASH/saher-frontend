---
phase: 06-admin-bank-accounts-events-depth
plan: 02
subsystem: admin-bank-accounts
tags: [banking, accounts, masking, strict-partial, manager-gating]
requires: [06-01]
provides: [ADMN-03, ADMN-04, ADMN-05]
affects: [07-*-events-depth none]
tech-stack:
  added: []
  patterns:
    - "strict-partial update schemas (accountUpdateSchema = base.partial().strict())"
    - "invalidation-only money/KYC mutations (D-29): no optimistic writes"
    - "RoleAccess can(role, action, resource) gating for manager-only bank writes"
key-files:
  created:
    - features/admin/account-edit.tsx
    - features/admin/bank-details.tsx
    - hooks/use-admin.ts
    - tests/admin-bank-api.test.ts
  modified:
    - services/admin.api.ts
    - app/(main)/(manager)/users/[id]/page.tsx
    - features/profile/profile.tsx
    - features/users/user-action.tsx
    - hooks/use-profile.ts
decisions:
  - "accountUpdateSchema excludes bank (backend strict() rejects it) despite plan listing it"
  - "dates as strings in accountUpdateSchema; backend z.coerce.date accepts ISO strings (register-wizard semantics)"
  - "bank restore affordance skipped: bankSchemaFinal has no isDeleted field to surface deletable state"
  - "Account column in users/column.tsx skipped: admin user list has no bank/account fields (verified backend)"
  - "AlertDialog confirm added to user delete (plan premise of existing confirm was false)"
metrics:
  duration: "3h47m"
  completed: "2026-08-30T10:12:00Z"
---

# Phase 06 Plan 02: Account & Bank Management (ADMN-03/04/05) Summary

Account edit dialog (strict-partial PUT, IST-aware dates) plus manager-only bank create/edit with masked account numbers (•••• last4) everywhere except the edit input, wired onto the employee detail page with an invalidation-only mutation layer.

## What Was Built

- **Account edit (ADMN-03):** `features/admin/account-edit.tsx` dialog — react-hook-form + zodResolver over `accountUpdateSchema`; fields: gender, dateOfBirth, dateOfJoining, phoneNumber, secondaryPhoneNumber, employeeId, department, designation, employeeType (5 values), employeeShift (part-time only), salaryStructure, address, aadhar, pan, resume. Employee detail page shows an "Edit Account" button gated on `can(r, "update", "account")` (managers + admins); dates rendered via `formatIstDate`.
- **Bank create/edit (ADMN-04):** `features/admin/bank-details.tsx` — full `bankDetailSchema` form (accountHolderName, bankName, accountNumber, ifcs, branch, mobileNumber); create-mode sends `createBank`, edit-mode prefills (full accountNumber in the input, the one place the raw value appears) and sends `updateBank({id, data})`; submit disabled while pending with "Saving…" (D-26), dialog stays open on error (D-28); wrapped in `RoleAccess` `can(r, "write" | "update", "bank")` (manager-only) with UI-SPEC copy "Bank details can only be changed by managers."
- **Masking everywhere (T-06-02-01):** `maskAccount` (`num.length > 4 ? "•••• " + last4 : "••••"`) applied on the employee detail page AND on the self-serve profile page (see deviations); raw `accountNumber}` literal appears nowhere outside bank-details.tsx (grep gate verified: zero matches).
- **Mutation layer (D-29):** `hooks/use-admin.ts` — `useAdminAccount` query + `createBank`/`updateBank`/`restoreBank` mutations, invalidation-only across `["admin"]` and `["user"]` prefixes; no optimistic writes for money/KYC data.
- **Delete confirm (ADMN-05, T-06-02-04):** `features/users/user-action.tsx` now confirms soft-delete and permanent-delete through an AlertDialog before mutating (permanent-delete copy matches UI-SPEC exactly); delete/restore mutations kept intact; directory badges (`isActive ? active : deleted`) unchanged.

## Verification

- `pnpm lint`: 0 errors (60 warnings, all pre-existing categories)
- `pnpm typecheck`: clean
- `pnpm test tests/admin-bank-api.test.ts`: 9/9 pass
- Full suite: 412/414 pass — the 2 failures are pre-existing `tests/session.test.ts > performLogoutCleanup` (documented in `deferred-items.md`, out of scope)
- Grep gate `accountNumber}` in features/ + app/: **zero matches** (raw renders eliminated everywhere)
- Grep gate `bank.*delete|deleteBank` in features/ + app/: no matches (no bank delete control)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `accountUpdateSchema` allowlist wrongly included `bank`**
- **Found during:** Task 1
- **Issue:** Plan listed `bank` among mutable account fields; backend `accountUpdateSchema = accountBaseSchema.partial().strict()` rejects any unknown key with a 400.
- **Fix:** Excluded `bank` from the schema; bank editing flows through its own `updateBank` endpoint. This is why POST `/api/admin/bank` create-mode exists in the form but is unreachable on the employee page — every account is created atomically with a bank, and no endpoint links an existing bank to an account.
- **Commit:** `01fa74d`

**2. [Rule 1 - Bug] Raw account number rendered on self-serve profile page**
- **Found during:** Task 3 masking gate.
- **Issue:** `features/profile/profile.tsx:83` rendered `{bank.accountNumber}` unmasked — violated the plan's grep gate (`accountNumber}` must appear nowhere outside bank-details.tsx) and T-06-02-01.
- **Fix:** Applied `maskAccount`; removed the dead local duplicate `maskAccount` in that file (it was defined but never used).
- **Files modified:** `features/profile/profile.tsx`
- **Commit:** `59ba9c8`

**3. [Rule 2 - Missing critical functionality] User delete had no confirmation dialog**
- **Found during:** Task 3 (ADMN-05 verification).
- **Issue:** Plan premise "AlertDialog confirm flow exist[s] on the directory (they do today)" was **false** — `user-action.tsx` fired `deleteUser.mutate()` directly from the dropdown with no confirmation. Threat register T-06-02-04 mitigation ("AlertDialog confirms incl. permanent-delete copy") was absent.
- **Fix:** Added a controlled AlertDialog confirm before soft-delete and permanent-delete; exact UI-SPEC copy "This permanently removes the employee. This cannot be undone." for the permanent path; delete/restore mutations left intact.
- **Files modified:** `features/users/user-action.tsx`
- **Commit:** `59ba9c8`

### Plan Premises Adjusted (documented, no code change)

- **Bank restore affordance skipped (plan Task 3 step 2):** verified `bankSchemaFinal` (backend `_services/bank.ts`) has no `isDeleted`/deletable-state field — there is no way to know a bank is deletable, so no restore control was added and no delete control exists (ADMN-04 restore-only ruling).
- **Account column in `features/users/column.tsx` skipped (plan Task 3 step 3):** `adminUserResponseSchema` (admin user list) carries no bank/account fields — no data source exists for the column. The plan's key_links reference `column.tsx → maskAccount` could not materialize; masking fully enforced via the page-level renders instead.

## Known Stubs

None — bank create/edit form fully wired; no placeholder values flow to UI.

## Threat Flags

None — no new network endpoints, auth paths, or file-access patterns were added beyond the plan's `<threat_model>` scope.

## Self-Check: PASSED

Created files verified present (account-edit.tsx, bank-details.tsx, use-admin.ts, admin-bank-api.test.ts, user-action.tsx, SUMMARY.md); commits 01fa74d, b785d95, 59ba9c8 verified in git log.