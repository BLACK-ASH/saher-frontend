---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: waiting
stopped_at: Phase 9 UI-SPEC approved
last_updated: "2026-09-01T15:22:43.446Z"
progress:
  total_phases: 9
  completed_phases: 6
  total_plans: 48
  completed_plans: 43
  percent: 67
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2024-08-24)

**Core value:** Every backend domain has a working, reliable screen — staff and admins run their daily work through this app without falling back to manual processes.
**Current focus:** None — phase 8 complete

## Current Position

Phase: 08 (bug-fixes-calendar-overhaul) — COMPLETE ✓
Plan: 6 of 6 ✓
Plans: 6/6 complete (08-01 ✓, 08-02 ✓, 08-03 ✓, 08-04 ✓, 08-05 ✓, 08-06 ✓)
Remaining phases: 04, 06

Phase 7 Status

- W1: 07-01 calendar ✓, 07-02 users/program ✓, 07-03 profile auth ✓, 07-04 notifications ✓
- W2: 07-05 trash pattern enforcement ✓ (realized to audit — see SUMMARY)
- W3: 07-06 responsive ✓, 07-07 test coverage ✓ (428 tests green)
- W4: 07-08 final date sweep + gate ✓ (lib/date sweep, lint/build/test green)

All 43 plans, 6 phases complete (1,2,3,5,7,8). Remaining: Phase 4, Phase 6.

Phase 6 Wave Structure

- W1: 06-01 (admin onboarding/directory), 06-03 (programs depth), 06-04 (workshop/session depth) — parallel
- W2: 06-02 (account/bank management, dep 06-01)
- W3: 06-05 (participant rosters, dep 06-03)
- W4: 06-06 (attendance diff engine, tdd, dep 06-05, human-verify)
- W5: 06-07 (reminder/export, dep 06-04 + 06-06, human-verify) — sequential after 06-06 for use-sessions.ts ownership

Phase 6 Research Highlights (06-RESEARCH.md)

- Employee registration is role-based (type enum free/intern/full-time/part-time/volunteer)
- Banks write ops manager-only; no role holds delete,bank → delete delivered as restore-only (ADMN-04 delete surfaced as backend gap)
- postgres soft-delete via isDeleted param; ghost rows when param omitted (Pitfall 5), sessions/workshops compare === 'true', programs sloppy cast (Pitfall 10)
- Attendance mutations are $addToSet merge-only; DELETE removes all → diff engine in 06-06
- Session workshop auto-create when omitted (Pitfall 7); date/startTime future-only; speaker = users min 1
- Export request = odd GET route; result lands in notifications as download action

## Performance Metrics

**Velocity:**

- Total plans completed: 19 (Phase 01: 3, Phase 02: 7, Phase 05: 6, plus 3 from early phases)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 3 | 3 | ~11 min |
| 02 | 7 | 7 | ~15 min |
| 3 | 3 | - | - |

**Recent Trend:**

- Last 3 plans: ~15 min each
- Trend: stable

| Phase 06-admin-bank-accounts-events-depth P02 | 3h47m | 3 tasks | 9 files |

## Phase 2 Completion Summary

All 7 plans executed and committed:

- 02-01: Session death module (lib/session.ts), provider.tsx wired, api-wrapper toast removed
- 02-02: IST date library (lib/date.ts), 22 tests, 7 consumer migrations
- 02-03: Role permissions matrix (lib/permissions.ts), 257 tests, RoleGuard/RoleAccess rewrite
- 02-04: Auth hook repair (use-login, use-logout, login-form, D-19 refresh tests)
- 02-05: normalizeList + PaginationFooter, attendance screen retrofit
- 02-06: Table screens retrofit, resource-list factory, 5 hooks collapsed, delete time.ts
- 02-07: Date sweep of 17 surfaces, boundary helpers, final gate green

**Verification:** lint 0 errors, typecheck clean, 329 tests pass, build (pre-existing register failure unrelated)

## Phase 5 Progress Summary

- 05-01: Reimbursement Data Layer ✓ (restored + 28 tests)
- 05-02: Payroll Data Layer + useUserMap ✓ (re-executed, 9 tests)
- 05-03: Staff My Bills slice ✓
- 05-04: Admin payroll slice ✓ (UI reconciliated to verified contract)
- 05-05: Finance Bill Management ✓ (verified; no consumer mismatches)
- 05-06: Bill detail depth + advance mgmt + export ✓ (re-executed; COMPLETED)

## Phase 6 Plan Summary

- 06-01: Admin onboarding + directory (ADMN-01/02) — W1
- 06-02: Account/bank management, masked + restore-only delete (ADMN-03/04/05) — W2, dep 06-01
- 06-03: Programs depth — attach fix, trash/restore, drill-down (EVNT-01/02) — W1
- 06-04: Workshop + session CRUD/trash + IST datetime contract (EVNT-03/04) — W1
- 06-05: Participant rosters — restore + isDeleted default, populated roster (EVNT-05) — W3, dep 06-03
- 06-06: Attendance diff engine (TDD, EVNT-06) — W4, dep 06-05, human-verify ✓
- 06-07: Reminder + export to notifications (EVNT-07/08) — W5, dep 06-04 + 06-06, human-verify ✓

## Phase 7 Plan Summary

- 07-01: Calendar alignment — IST dates + Google sync (AUDT-02) — W1
- 07-02: Users & Program final alignment — pattern cleanup (AUDT-03) — W1
- 07-03: Profile auth flows — token-confirm UX + active sessions (AUTH-02, AUTH-03) — W1
- 07-04: Notifications — unseen badge + action reliability (AUDT-04) — W1
- 07-05: Shared trash pattern enforcement — all soft-delete resources (AUDT-05) — W2
- 07-06: Responsive layout pass — staff screens (AUDT-06) — W3
- 07-07: Test coverage — money-path double-submit + auth refresh (AUDT-07, AUDT-08) — W3
- 07-08: Final raw-date sweep + lint/typecheck gate (FNDT-02) — W4

## Phase 8 Plan Summary

- 08-01: Registration error messages + profile double-toast (BUGF-01, BUGF-02) — W1 ✓
- 08-02: Notice trash tab — backend isDeleted query + frontend trash/restore/permanent-delete (BUGF-03, BUGF-06) — W2 ✓
- 08-03: Bill management — nav entry + pagination + balance key + EditBillDialog (D-08) + advance-bill verify (D-09) (BUGF-04) — W2 ✓
- 08-04: Leave — backend field-name fix + frontend validation error surfacing (BUGF-05) — W2 ✓
- 08-05: Calendar backend — month-boundary TZ fix + RBAC + type enum (BUGF-07, CAL-01) — W2 ✓
- 08-06: Calendar frontend — delete confirm + edit wiring + drag/resize errors + type dropdown (BUGF-07, CAL-02) — W3 ✓

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- D-18: one home for dates (lib/date.ts), lib/utils/time.ts deleted
- D-19: single-flight token refresh tested (retry-once, death-sentinel, toast-silence)
- D-20: PaginationFooter handles boundary disabling internally
- D-21: resource-list-factory.ts collapses common list/detail/mutation hooks
- D-22: Payroll page at app/(main)/(admin)/payroll with RoleGuard can(read,'payroll')
- D-23: Year/month filters reset page to 1 — now via render-phase state adjustment (not useEffect, which tripped set-state-in-effect lint)
- D-24: Run Now uses AlertDialog confirmation, disabled with spinner during sync cron
- D-25: Record Payment dialog sends INCREMENTAL paidSalary (Quirk 8, pinned by test); no description field (backend schema strips it — D-27 dropped)
- D-26: Submit disabled + "Recording…" while pending (money-safety, applies across settle/payroll/advance/handle/bulk)
- D-28: On error, dialog stays open with values intact (no auto-close)
- D-29: NO optimistic writes for money mutations — invalidation-only cache changes
- D-30: Backend restore endpoint is guarded — Staff Restore can 403 (acknowledged, backend-side)
- D-31: Backend searchBillQuerySchema needs status field for isDeleted filtering (acknowledged, backend-side)
- D-32: useUserMap merges cached ["users",*] searches into id→name map; backend has no list-all endpoint — unknown ids render "…{last6}"
- D-33: Payroll hook split into usePayroll(filters,page) + usePayrollByUser(userId,page) — calling useQuery from returned functions (plan 05-02 draft) violates hooks rules
- [Phase 06]: accountUpdateSchema excludes bank (backend strict() rejects it) despite plan listing it
- [Phase 06]: bank restore affordance skipped: bankSchemaFinal has no isDeleted field
- [Phase 06]: AlertDialog confirm added to user delete (plan premise of existing confirm was false)

### Pending Todos

- Execute Phase 04 and Phase 06 plans
- Remove orphaned `underDevelopment` middleware from backend (now dead code after phase 8)

### Blockers/Concerns

- [Phase 3]: Noticeboard backend routes gated behind `underDevelopment` middleware — verify live payloads at phase start
- [Phases 5–6]: Payload shapes for unbuilt domains must be resolved against live OpenAPI at `/docs`
- [Phase 6, ADMN-04]: Bank delete has NO authorized role (guard `delete,bank` matches none) — delete delivered as restore-only; backend gap surfaced in 06-02
- [Phase 6, EVNT-08]: Export/reminder routes are GET-style oddities on the session path — 06-07 re-verifies exact verbs against the live controller
- [Phase 6, EVNT-06]: Attendance page migrates off the raw-id roster query this phase — 06-06 removes it repo-wide

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| v2 | PAYR-V2-01/02, XV2-01/02 | Deferred (v2 section of REQUIREMENTS.md) | 2026-08-24 |

## Session Continuity

Last session: 2026-09-01T14:30:01.819Z
Stopped at: Phase 9 UI-SPEC approved
Resume file: .planning/phases/09-attendance-overhaul-admin-oversight-ux-polish/09-UI-SPEC.md
