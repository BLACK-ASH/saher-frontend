# Saher Frontend Completion

## What This Is

Completion of the Saher org-management frontend — a Next.js 16 + Tailwind v4 + shadcn/ui app that talks to the NestJS backend at `../saher-backend`. This milestone builds every remaining module (reimbursement, payroll, leave, mail, noticeboard, admin bank/accounts, full events depth) and systematically audits-and-fixes all existing modules (attendance, calendar, users, program, auth flows) so the whole system becomes the org's daily driver.

## Core Value

Every backend domain has a working, reliable screen — staff and admins run their daily work (attendance, bills, payroll, leave) through this app without falling back to manual processes.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Auth flows: login, register, verify-email, forgot/change password, change email — existing
- ✓ Dashboard, profile, users admin — existing
- ✓ Attendance check-in/out + admin corrections — existing
- ✓ Calendar month aggregation — existing
- ✓ Notification feed + web-push — existing
- ✓ Program admin page — existing (depth incomplete)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Reimbursement: bill create → handle → settle lifecycle, recycle bin, balance enquiry, search
- [ ] Payroll: generation review, approval, installment payment tracking
- [ ] Leave: types, apply flow, balances
- [ ] Mail: inbox/outbox
- [ ] Noticeboard: CRUD + soft delete/restore
- [ ] Admin bank + accounts management
- [ ] Events depth: workshops/sessions/participants CRUD, session attendance, reminders, exports
- [ ] Systematic audit-and-fix of existing modules against backend contract
- [ ] Test setup (vitest + testing-library) with coverage of critical flows
- [ ] Responsive layout across staff-used screens

### Out of Scope

- Backend changes — saher-backend is canonical; frontend adapts to its contract
- Native mobile apps — responsive web covers phone use
- Google Calendar write-back — read/sync as backend provides only

## Context

- **Integration contract:** `.planning/codebase/` map + the backend FRONTEND-HANDBOOK. Canonical API docs live at backend `/docs` (Redoc from `openapi/openapi.yaml`). Key conventions: `/api` same-origin proxy, cookie-session auth (`credentials: 'include'`, one refresh retry on `Invalid Session.`), `{ success, message, data, meta }` envelope, RBAC-driven UI hiding, soft delete via `?isDeleted=true` + `PATCH <resource>/restore/{id}` trash UX, IST (`Asia/Kolkata`) date handling with offset ISO strings, export jobs that deliver download links as notification actions.
- **Existing architecture:** thin routes in `app/`, screen logic in `features/<domain>/`, data access in `services/<domain>.api.ts` (zod-validated) consumed via TanStack Query hooks in `hooks/use-*.ts`, single HTTP gateway `lib/api-wrapper.ts`. Admin-only pages under `app/(main)/(admin)/` inheriting RoleGuard.
- **Known debt:** dead SCSS in `styles/`, no test infra (msw allow-listed but uninstalled), inconsistent adherence to apiFetch/zod patterns in older modules.
- **Users:** org staff (employees), managers, admins — RBAC actions read/write/update/delete gate UI affordances.

## Constraints

- **Tech stack**: Next.js + Tailwind + shadcn/ui — extend existing patterns, no new UI framework
- **Timeline**: ~1 month of focused work
- **Dates**: All date logic must be IST-aware; send `+05:30` offsets
- **Design**: Free design within shadcn conventions, visually consistent with existing pages
- **Quality**: Tests for critical flows (money, auth, forms); audit-fix approach for existing modules, not wholesale rewrites

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Audit-and-fix existing modules rather than rebuild | Modules mostly work; systematic alignment with contract + patterns is cheaper and lower-risk than rewrites | — Pending |
| Introduce vitest + testing-library | Zero tests today conflicts with daily-driver reliability goal | — Pending |
| Follow backend handbook as binding contract | Backend is canonical and deployed; OpenAPI at /docs is source of truth | — Pending |
| Verify every module against actual route structure + RBAC guards before building UI | Owner directive: handbook/MODULE_ROUTES can drift from code; routes and `authorize()` calls are ground truth | — Pending |
| Modules delivered complete, one module per effort — no intra-module versioning | Owner directive: partial modules leave broken UX; whole-module delivery keeps flows testable end-to-end | — Pending |
| Build only what the backend demonstrably supports; keep UI as simple as possible for normal users | Owner directive: every screen maps to a real endpoint + guard; simplicity beats feature parity with commercial suites | — Pending |
| No strict priority ordering across modules | Org needs everything working; sequencing left to roadmap dependency logic | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-24 after initialization*
