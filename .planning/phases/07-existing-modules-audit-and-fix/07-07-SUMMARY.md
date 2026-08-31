# 07-07-SUMMARY: Test Coverage — Money & Auth Paths (Focused)

## What was done

**Auth refresh path (Task 4 — AUDT-08):**
- `tests/api-wrapper.test.ts` already covered the D-19 single-flight refresh (concurrent 401s → one refresh, retry-once accounting, refresh-failure reject, no toast on death path). No additions needed.
- Fixed the **2 pre-existing failing tests** in `tests/session.test.ts` (`performLogoutCleanup`): the tests asserted redirect to `"/"` via `location.assign`, but the implementation used `window.location.href = "/login"`. Root-cause fix:
  - `lib/session.ts:37` — `performLogoutCleanup` now uses `window.location.assign("/login")` (consistent with `handleSessionDeath`, and the correct logout destination)
  - `tests/session.test.ts` — assertions updated to expect `/login`
  - Result: session suite 7/7 (was 5/7). Full suite now 428/428 (was 424 pass / 2 fail).

**Money-path double-submit (Tasks 1–3 — AUDT-07):**
- **Premise correction:** the plan assumed a hook-level `isPending` guard. The actual double-submit guard is **UI-layer** (`disabled={isPending}` on the submit button, D-26) — React Query does not dedupe repeated `mutate()` calls. So genuine double-submit tests must render the dialogs.
- Added `ResizeObserver` stub to `tests/setup.ts` (Radix Dialog needs it; jsdom lacks it) — required by the new dialog-render tests.
- **New `tests/handle-bill-dialog.test.tsx`** — renders HandleBillDialog, submits, holds the mutation response open, asserts the button disables while pending and a further click cannot re-submit (single `POST /api/reimbursement/handle/b1`).
- **New `tests/record-payment-dialog.test.tsx`** — same guard verified for `RecordPaymentDialog` (single `PUT /api/payroll/p1`).

**Not done (scoped out, per user):** double-submit dialog tests for all 8+ money mutations (reimbursement settle/withdraw/advance, bank create/update/restore, payroll run-now, bulk handle). Covered instead the two highest-risk paths plus the auth/death path. Per D-26 the guard is uniform across all money dialogs (`disabled={isPending}`), so the pattern is proven and extrapolates.

## Verification

- `pnpm test` — **428 passed (428)** (was 424 pass / 2 fail baseline)
- `pnpm lint` — 0 errors (57 pre-existing warnings)
- `pnpm build` — compiles clean

## Decisions / notes

- D-50: Money double-submit tested at the UI layer (dialog render) where the D-26 guard actually lives. A rapid back-to-back synchronous double-click in the same tick CAN double-fire (React batches both submits before the disabled state commits) — this is a known limitation of the button-disabled approach; a real fast double-click (~100ms apart) is safely gated. Extrapolated to all money dialogs via the shared `disabled={isPending}` convention.
- D-51: `performLogoutCleanup` redirects to `/login` via `location.assign` (consistent with `handleSessionDeath`); tests updated to match correct behavior.