# Roadmap: Saher Frontend Completion

## Overview

Seven phases take the Saher frontend from "zero tests, unverified contract" to "every backend domain has a working, reliable screen." The order is dependency-driven: quality gates and shared infrastructure land first so seven new domain modules write onto tested foundations instead of retrofitting; one cheap pilot module (noticeboard) proves the slice contract before the fleet copies it; money modules arrive once patterns are proven and get the strictest acceptance criteria; events depth comes last of the builds (highest complexity, lowest risk by then); the audit-and-fix pass over existing modules runs last because alignment is mechanical only once the target utilities exist.

Per owner directives: every module is delivered **complete** within its phase (no intra-module slicing), and each module phase starts by verifying the backend's **actual route structure** (`../saher-backend/src/**/*.routes.ts`) and actual `authorize()` guards before building UI — docs can drift from code.

**Mode:** mvp

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Quality Gates & Test Infrastructure** - Lint/typecheck/test gates exist before any mass changes; vitest + testing-library + msw wired at the apiFetch boundary (completed 2026-08-24)
- [x] **Phase 2: Shared Infrastructure & Session Reliability** - IST date utils, envelope normalization factory, session-death handler, safe pagination footer, RBAC helper — each tested; auth refresh/logout flows verified against contract (completed 2026-08-25)
- [ ] **Phase 3: Noticeboard Pilot** - First complete module proves the Slice Contract end-to-end; promotes trash-tabs and pagination footer to shared components
- [ ] **Phase 4: Staff Self-Service — Mail & Leave** - Staff run daily personal workflows in-app: read/write internal mail, apply for leave with balances, managers review applications
- [ ] **Phase 5: Money & Approval — Reimbursement & Payroll** - The org's full money pipeline (bills → handle → settle, advances, payroll installments, generation trigger) runs in-app with double-submit-proof actions
- [ ] **Phase 6: Admin Bank/Accounts & Events Depth** - Atomic employee onboarding + bank detail CRUD; full events hierarchy (program→workshop→session→participant), attendance grid, reminders, exports
- [ ] **Phase 7: Existing Modules Audit-and-Fix** - Attendance, calendar, users, program, profile, notifications aligned to contract and shared patterns; responsive pass; money/auth test coverage complete

## Phase Details

### Phase 1: Quality Gates & Test Infrastructure

**Goal**: Every subsequent change runs against green lint/typecheck gates and a working component test harness — regressions surface immediately instead of hiding in noise.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: FNDT-01, FNDT-07
**Contract check**: None needed (no backend calls built here); msw intercepts at the apiFetch boundary per existing allow-list.
**Success Criteria** (what must be TRUE):

  1. `lint`, `typecheck`, and `test` package scripts all run green on a fresh checkout
  2. A sample testing-library component test renders a real component and asserts on output via jsdom
  3. An msw handler intercepts an apiFetch-backed call in a test and serves mock data through the real wrapper
  4. Package hygiene fixed: react-hook-form resolves as a production dependency, unused deps removed, dead SCSS deleted from styles/

**Plans**: 3 plans

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Branch sync to dev + package hygiene + gate scripts + vitest foundation (FNDT-01, FNDT-07)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Reference tests: provider-aware component render + msw→apiFetch envelope integration (FNDT-01)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — Deploy workflow retargeted to dev with quality-gate pre-steps; first gated deploy deferred after user cancelled CI run (FNDT-07)

### Phase 2: Shared Infrastructure & Session Reliability

**Goal**: All future modules write onto tested shared foundations — IST-correct dates, normalized list envelopes, graceful session death, safe pagination, consistent RBAC gating — and login/logout/refresh behave exactly per contract.
**Mode:** mvp
**Depends on**: Phase 1 (gates must exist to verify these utilities)
**Requirements**: FNDT-02, FNDT-03, FNDT-04, FNDT-05, FNDT-06, AUTH-01
**Contract check**: Verify refresh-retry behavior and `Invalid Session.` sentinel against `lib/api-wrapper.ts` + backend auth routes; confirm live `/auth/me` role string values for manager gating (research flagged MEDIUM confidence).
**Success Criteria** (what must be TRUE):

  1. Dates render identically regardless of browser timezone (IST display), form inputs round-trip to `+05:30` ISO strings, and unit tests prove the day-boundary cases
  2. List endpoints return validated `{ items, page }` whether meta says `total` or `totalPages`; nullable `data` yields an empty list, never a crash
  3. When a session dies, the user lands on /login exactly once with cleared cache — no toast storm, no refetch loop; logout clears state without refetch storms; refresh retries exactly once before giving up
  4. Pagination footer renders safely when meta is missing or malformed (disabled controls, never crashes)
  5. UI affordances gate consistently through `can(action, resource)` derived from the user's role

**Plans**: 7 plans

Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Central session-death module + api-wrapper sentinel rewiring + provider cache onError wiring (FNDT-04, AUTH-01)
- [x] 02-02-PLAN.md — IST date module (lib/date.ts) + attendance/correction/calendar consumer migration (FNDT-02)
- [x] 02-03-PLAN.md — Permissions matrix mirror + can() gating unification + manager-nav fix + D-15 probe checkpoint (FNDT-06)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-04-PLAN.md — Auth flows contract: repaired login/logout hooks, ?next= return nav, D-19 single-flight/retry tests (AUTH-01)
- [x] 02-05-PLAN.md — normalizeList factory + safe PaginationFooter + attendance-family screen retrofit (FNDT-03, FNDT-05, FNDT-02)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-06-PLAN.md — Corrections + dashboard-grid retrofit + six-hook factory collapse with service/consumer adoption (D-21) + delete lib/utils/time.ts (FNDT-03, FNDT-02, FNDT-05)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 02-07-PLAN.md — Raw-date sweep of the 15 remaining surfaces onto lib/date + phase-final raw-pattern gate completing D-01 (FNDT-02)

### Phase 3: Noticeboard Pilot

**Goal**: The first complete module proves the Slice Contract end-to-end (factory, hooks, forms, trash pattern) on the smallest surface, producing the documented reference implementation every later module copies.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: NOTC-01, NOTC-02, NOTC-03
**Contract check**: Verify notice routes + `authorize()` guards in `../saher-backend/src/**.routes.ts` before building — module is gated behind `underDevelopment` middleware in docs; confirm live payloads against OpenAPI at `/docs` before finalizing schemas.
**Success Criteria** (what must be TRUE):

  1. Staff browse active notices as a paginated feed and open details with expiry highlighted in IST time
  2. Admins create and edit notices with the 7-day default expiry surfaced in the form
  3. Admins soft-delete, restore, and permanently delete notices (permanent delete requires explicit confirmation dialog)
  4. Trash tabs and pagination footer live in `components/shared/` and the Slice Contract is written down with noticeboard as the living example

**Plans**: TBD
**UI hint**: yes

Plans:

- [ ] 03-01: TBD during plan-phase

### Phase 4: Staff Self-Service — Mail & Leave

**Goal**: Staff handle daily personal workflows in-app — internal mail and the full leave lifecycle (apply, track, review, type management) — reusing the pilot's promoted widgets and building the user-search picker later phases need.
**Mode:** mvp
**Depends on**: Phase 3 (slice contract, shared widgets, picker-ready query patterns)
**Requirements**: MAIL-01, MAIL-02, MAIL-03, MAIL-04, LEAV-01, LEAV-02, LEAV-03, LEAV-04, LEAV-05, LEAV-06
**Contract check**: Verify mail (3 endpoints) + leave routes and `authorize()` guards in backend source before building; confirm multi-recipient support shape and leave proof-doc upload route against live OpenAPI.
**Success Criteria** (what must be TRUE):

  1. Staff read their inbox as a paginated list with sanitized message view, and see sent items in the outbox
  2. Permitted users compose mail via user-search picker, and reply prefills recipient + quoted body
  3. Staff apply for leave with balances visible while applying; overlap errors surface inline; optional proof doc attaches
  4. Staff see their applications with status badges and edit their own pending ones
  5. Managers/admins review applications (approve/reject with note) from a filterable queue, and admins create/edit leave type definitions

**Plans**: TBD
**UI hint**: yes

Plans:

- [ ] 04-01: TBD during plan-phase

### Phase 5: Money & Approval — Reimbursement & Payroll

**Goal**: The org's entire money pipeline runs in-app — bill submit→handle→settle lifecycle with advances, recycle bin, search, audit trail, plus admin payroll browsing/installments/generation — with money mutations structurally protected against double-submits.
**Mode:** mvp
**Depends on**: Phase 4 (user-search picker for advance bills; upload integration proven)
**Requirements**: REIM-01, REIM-02, REIM-03, REIM-04, REIM-05, REIM-06, REIM-07, REIM-08, REIM-09, REIM-10, REIM-11, REIM-12, PAYR-01, PAYR-02, PAYR-03, PAYR-04
**Contract check**: Verify all bill/payroll routes + `authorize()` guards in backend source before building; resolve amount representation (number vs string), settlement sub-resource shape, advance-bill admin schema, and whether cron-generated payroll data exists in the environment against live OpenAPI before writing schemas.
**Success Criteria** (what must be TRUE):

  1. Staff submit expense bills with receipt images (≤10), track status via badges, edit/withdraw pending bills, and see their advance-vs-expenses net balance card
  2. Finance works the handle queue — approve/reject/hold with required notes, single and bulk — records settlement method, searches/filters all bills, and creates/edits/deletes advances on behalf of users
  3. Deleted bills recover via recycle bin + restore; bill detail shows the submitted→handled→settled timeline with who/when/note; finance can view the audit log
  4. Admin browses paginated payroll records across employees, views per-employee history, records installment payments with paid-vs-total progress, and triggers manual generation ("run now") with check-notifications feedback
  5. Money mutations (handle/settle/installment/bank-affecting) are gated by mutation-pending state with no optimistic updates — server state always reflects truth after any action, verified by hook/mutation tests

**Plans**: TBD
**UI hint**: yes

Plans:

- [ ] 05-01: TBD during plan-phase

### Phase 6: Admin Bank/Accounts & Events Depth

**Goal**: Admins onboard employees atomically and manage accounts/bank details safely, while events reach full operational depth — nested hierarchy CRUD, participant rosters, fast attendance, reminders, and export-to-notification delivery.
**Mode:** mvp
**Depends on**: Phase 5 (patterns proven; export/notification loop hardened; admin audience established)
**Requirements**: ADMN-01, ADMN-02, ADMN-03, ADMN-04, ADMN-05, EVNT-01, EVNT-02, EVNT-03, EVNT-04, EVNT-05, EVNT-06, EVNT-07, EVNT-08
**Contract check**: Verify bank/accounts (`/api/admin` prefix) + all event routes + `authorize()` guards in backend source before building; resolve participant-creation input mode (employee-search vs free entry), reminder endpoint shape (odd GET-on-session-path), exact export route against live OpenAPI.
**Success Criteria** (what must be TRUE):

  1. Admin onboards an employee via one guided form that creates account + bank details atomically; the directory is searchable and paginated
  2. Admin creates/views/edits account details and CRUDs bank details per employee (account numbers masked in lists); users soft-delete and restore without data loss
  3. Users drill down programs → workshops → sessions with clear navigation; managers/admins CRUD each level including trash/restore
  4. Managers/admins attach/detach participants to programs and mark session attendance via a fast checkbox grid with update/delete corrections
  5. One click sends a session reminder; an export request results in a download link arriving via notification action button

**Plans**: TBD
**UI hint**: yes

Plans:

- [ ] 06-01: TBD during plan-phase

### Phase 7: Existing Modules Audit-and-Fix

**Goal**: Everything pre-existing (attendance, calendar, users, program, dashboard, profile, notifications, auth surfaces) aligns to the contract and shared patterns — completing the auth flows module — so the whole app behaves like the new slices.
**Mode:** mvp
**Depends on**: Phases 1–6 (alignment is mechanical once factory, IST utils, shared footer, and session-death handler exist)
**Requirements**: AUDT-01, AUDT-02, AUDT-03, AUDT-04, AUDT-05, AUDT-06, AUDT-07, AUDT-08, AUTH-02, AUTH-03
**Contract check**: Diff each existing module's endpoints/calls against backend routes + guards; migrate violators onto factory/parsed schemas rather than rewriting wholesale.
**Success Criteria** (what must be TRUE):

  1. Attendance correction request→approval loop fully usable end-to-end in the UI; calendar month aggregation correct with custom events + Google sync verified
  2. Users and program pages follow services/zod/query patterns; naive browser-timezone date calls replaced with IST utilities everywhere
  3. Notification feed reliably renders action buttons (including export download links) and the unseen badge stays accurate
  4. One shared trash UX pattern covers all resources; password/email token-confirm flows show clear pending/success/expired states; active sessions viewable and revocable from profile
  5. Staff-used screens work at phone widths; money-path flows (reimbursement handle/settle, payroll installments, bank mutations) and the auth refresh path are covered by passing tests with double-submit gating

**Plans**: TBD
**UI hint**: yes

Plans:

- [ ] 07-01: TBD during plan-phase

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Quality Gates & Test Infrastructure | 3/3 | Complete   | 2026-08-24 |
| 2. Shared Infrastructure & Session Reliability | 7/7 | Complete | 2026-08-25 |
| 3. Noticeboard Pilot | 0/? | Not started | - |
| 4. Staff Self-Service — Mail & Leave | 0/? | Not started | - |
| 5. Money & Approval — Reimbursement & Payroll | 0/? | Not started | - |
| 6. Admin Bank/Accounts & Events Depth | 0/? | Not started | - |
| 7. Existing Modules Audit-and-Fix | 0/? | Not started | - |

---
*Roadmap created: 2026-08-24*
