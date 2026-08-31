# 07-08-SUMMARY: Final Raw-Date Sweep + Gate

## Status: COMPLETE

## What was done

### Task 1 — Remaining raw Date initializations fixed to IST-safe routes
- `features/dashboard/attendance-grid/attendance-dashboard.tsx:40` — `const today = new Date()` → `istDateOnlyToDate(dateToIstDateOnly(new Date()))`
- `features/dashboard/attendance-grid/attendance-dashboard.tsx:145` — `goToday` `const now = ...` → same IST-safe today
- `features/register/basic-details.tsx:224-225` — day-picker `selected`/`defaultMonth` → `istDateOnlyToDate(dateToIstDateOnly(new Date()))`
- `features/register/employee-details.tsx:228-229` — same pattern
- `features/reimbursement/create-bill-dialog.tsx:28` — `new Date().toISOString().split("T")[0]` → `dateToIstDateOnly(new Date())` (adds missing `@/lib/date` import). Simpler than the plan's `formatIstDate(...)` round-trip — that would yield a display string "31 Aug 2026"; the schema needs a date-only `z.string()`, which `dateToIstDateOnly` produces directly.
- `features/calendar/calendar.tsx:54` — verified already correct (`dateToIstDateOnly(new Date())`), no change.

### Task 2 — Grep audit of `features/`
- `toISOString` — **zero** occurrences in `features/`
- `new Date()` (bare) — zero remaining display/parsing uses (all bare uses now wrapped in `dateToIstDateOnly`/`istDateOnlyToDate`)
- `toLocaleString` — **all currency** (`₹`), explicitly acceptable per plan (not date-related)

### Task 3 — Pattern gate
- All date display/parsing routes through `lib/date` helpers (`dateToIstDateOnly`, `istDateOnlyToDate`, `combineDateAndTimeToIso`).
- Remaining `new Date(...)` constructs are legitimate instant-math / arithmetic / parse-through-helper, not violations:
  - `notice-form.tsx:38-39` — `dateToIstDateOnly(new Date(...))` wrapper
  - `notice-expiry-badge.tsx:9-10` — **deliberate exception**: duration math comparing instants (`new Date(expiresAt) <= new Date()`). Converting to date-only (per plan) would change expiry semantics by dropping time-of-day; correct instant comparison is timezone-independent. Kept as-is.
  - `session-editor.tsx:97-98` — via IST-aware `combineDateAndTimeToIso`
  - `apply-leave-dialog.tsx`, `holiday-form-dialog.tsx` — parsed through `dateToIstDateOnly`

### Task 4 — Full gate
- `pnpm lint` — 0 errors (57 warnings, pre-existing)
- `pnpm build` — compiles clean (typecheck passes)
- `pnpm test` — 428/428 passing

### Task 5 — ROADMAP + STATE
- ROADMAP.md: all Phase 7 plans 07-01…07-08 checked, Phase 7 header checked
- STATE.md: Phase 7 COMPLETE, 5 phases / 39 plans complete (percent 100)

## Exceptions
- `notice-expiry-badge.tsx` instant comparison kept raw — documented above; any change there is a behavior change, not a display/parsing gate fix.

## Requirement coverage
- FNDT-02: all date rendering/parsing routes through `lib/date` — DONE
- AUDT-02/03, AUTH-02/03, AUDT-04/05/06/07/08 — satisfied across phase
