# Requirements: Saher Frontend Completion

**Defined:** 2026-08-24
**Core Value:** Every backend domain has a working, reliable screen — staff and admins run their daily work through this app without falling back to manual processes.

**Scope principle (owner directive):** Modules are delivered **complete, one module at a time** — no feature slicing across releases, no version-wise splitting within a module. Everything below is v1.

**Integration rule (owner directive):** For every module, verify against the backend's **actual route structure** (`saher-backend/src/**.routes.ts`, live OpenAPI at `/docs`) and the **actual permission guards** (`authorize()` calls) before building UI — docs can drift from code; routes and RBAC are ground truth.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

Shared infrastructure that all modules depend on. Built first, tested.

- [x] **FNDT-01**: Test infrastructure (vitest + testing-library + msw) installed and running via package script, msw wired at the apiFetch boundary
- [ ] **FNDT-02**: IST-safe datetime utilities (fixed-offset formatting/parsing, ISO strings with +05:30) with unit tests; all date rendering/parsing routes through them
- [ ] **FNDT-03**: Envelope normalization factory handling both page-count field names (`total` and `totalPages`) and nullable `data`
- [ ] **FNDT-04**: Central session-death handler (401 after refresh attempt → clear query cache + redirect to login) and logout cache-clearing fixed without refetch storms
- [ ] **FNDT-05**: Safe pagination footer component that never crashes on missing/malformed meta
- [ ] **FNDT-06**: Permission helper (`can(action, resource)`) driving consistent RBAC affordance gating
- [x] **FNDT-07**: Lint/typecheck baseline green; package hygiene fixed (react-hook-form moved to dependencies, unused deps removed, dead SCSS deleted)

### Auth & Profile

Audit-and-complete of existing auth surfaces.

- [ ] **AUTH-01**: Login/logout/refresh flows verified against contract (single refresh retry on `Invalid Session.`, cookies untouched by JS)
- [ ] **AUTH-02**: Password/email token-confirm flows show clear pending/success/expired states
- [ ] **AUTH-03**: User can view active sessions and revoke them from profile

### Users, Bank & Accounts Admin

- [ ] **ADMN-01**: Admin can onboard an employee with a single guided form creating account + bank details atomically
- [ ] **ADMN-02**: Admin can search and paginate the employee directory
- [ ] **ADMN-03**: Admin can view and edit account details per employee
- [ ] **ADMN-04**: Admin can create/view/update/delete bank details per employee (account numbers masked in lists)
- [ ] **ADMN-05**: Admin can soft-delete and restore users (offboarding without data loss)

### Reimbursement

Owner clarifications: normal users can only create bills (advances are admin-issued); the app tracks settlements but does not process payments (no payment gateway).

- [ ] **REIM-01**: Staff can submit an expense bill (amount, description, receipt images ≤10 via uploader)
- [ ] **REIM-02**: Staff can see their advance-vs-expenses net balance enquiry card
- [ ] **REIM-03**: Staff can see their own bills with status badges (pending/approved/rejected/held/settled)
- [ ] **REIM-04**: Staff can edit or withdraw their own pending bills
- [ ] **REIM-05**: Finance can work a handle queue: approve/reject/hold each bill with required notes
- [ ] **REIM-06**: Finance can bulk-handle bills (multi-select, sequential calls against the single-bill endpoint)
- [ ] **REIM-07**: Finance can record how a bill was settled (UPI/bank transfer) — tracking record, not payment processing
- [ ] **REIM-08**: Bill detail shows a lifecycle timeline (submitted → handled → settled, with who/when/note) composed from bill + audit-log data
- [ ] **REIM-09**: Finance can search/filter all bills by description, amount, date, user
- [ ] **REIM-10**: Finance can create/edit/delete advance bills on behalf of a user (user-search picker)
- [ ] **REIM-11**: Deleted bills are recoverable via recycle bin + restore
- [ ] **REIM-12**: Finance can view the bill audit log

### Payroll (admin-only — no employee endpoint exists)

- [ ] **PAYR-01**: Admin can browse paginated payroll records across employees
- [ ] **PAYR-02**: Admin can view per-employee payroll history
- [ ] **PAYR-03**: Admin can record installment payments and see paid-vs-total progress
- [ ] **PAYR-04**: Admin can trigger payroll generation manually ("run now") with check-notifications feedback

### Leave

- [ ] **LEAV-01**: Staff can view leave types
- [ ] **LEAV-02**: Staff can apply for leave (type, date range, reason, optional proof doc) with balances visible while applying; overlap errors surface inline
- [ ] **LEAV-03**: Staff can see their applications with status
- [ ] **LEAV-04**: Staff can update their own pending application
- [ ] **LEAV-05**: Managers/admins can review applications (approve/reject with note) from a filterable queue
- [ ] **LEAV-06**: Admins can create/edit leave type definitions

### Mail

Internal messaging over 3 endpoints — deliberately not an email client.

- [ ] **MAIL-01**: Staff can read their inbox (paginated list + sanitized message view)
- [ ] **MAIL-02**: Permitted users can compose mail to colleagues via user-search picker
- [ ] **MAIL-03**: Users can see sent items in outbox
- [ ] **MAIL-04**: Users can reply (compose prefilled with recipient + quoted body)

### Noticeboard

Backend module confirmed present (CRUD + restore + permanent delete) but currently gated behind `underDevelopment` middleware — frontend ships against the documented contract; live verification depends on backend lifting the flag.

- [ ] **NOTC-01**: Staff can browse active notices (feed + detail, expiry highlighted, IST-aware)
- [ ] **NOTC-02**: Admins can create/edit notices (7-day default expiry surfaced in form)
- [ ] **NOTC-03**: Admins can soft-delete/restore notices and permanently delete with mandatory confirm dialog

### Events

Program ⊃ Workshop ⊃ Session; participants attach to programs; attendance attaches to sessions.

- [ ] **EVNT-01**: Users can browse programs → workshops → sessions with drill-down navigation
- [ ] **EVNT-02**: Managers/admins can CRUD programs including trash/restore
- [ ] **EVNT-03**: Managers/admins can CRUD workshops within a program
- [ ] **EVNT-04**: Managers/admins can CRUD sessions (IST-correct datetime pickers)
- [ ] **EVNT-05**: Managers/admins can manage participant rosters attached to programs (attach/detach)
- [ ] **EVNT-06**: Managers/admins can mark session attendance via fast checkbox grid, with update/delete corrections
- [ ] **EVNT-07**: Managers/admins can send a session reminder with one click
- [ ] **EVNT-08**: Managers/admins can export reports; download link arrives via notification action button

### Existing Modules Audit

Systematic contract-alignment pass over what already exists (attendance, calendar, users, program, dashboard, profile, notifications).

- [ ] **AUDT-01**: Attendance module aligned to contract; correction request→approval loop fully usable in UI
- [ ] **AUDT-02**: Calendar month aggregation aligned; custom events + Google sync verified
- [ ] **AUDT-03**: Users and program pages aligned to services/zod/query patterns
- [ ] **AUDT-04**: Notification feed renders action buttons (incl. export download links) reliably; unseen badge accurate
- [ ] **AUDT-05**: Trash UX uses one shared pattern across all resources
- [ ] **AUDT-06**: Responsive layout pass on staff-used screens
- [ ] **AUDT-07**: Money-path flows (reimbursement handle/settle, payroll installments, bank mutations) covered by tests; double-submit gated
- [ ] **AUDT-08**: Auth refresh path covered by tests (single retry, then session-death handler)

## v2 Requirements

Deferred — tracked so they aren't forgotten, not in current roadmap.

### Payroll

- **PAYR-V2-01**: Employee self-service payslips (blocked: no employee endpoint)
- **PAYR-V2-02**: Run-to-run anomaly highlighting

### Cross-cutting

- **XV2-01**: Dashboard widgets aggregating money/approval domains
- **XV2-02**: Leave data in calendar aggregation (pending backend confirmation)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend changes of any kind | saher-backend is canonical and deployed |
| Payment gateway integration | Org settles payments outside the app; app records outcomes |
| OCR/AI receipt scanning | No backend extraction; wrong scale for org size |
| Configurable multi-level approval workflows | Approval chain fixed by role; rules engine is months of work |
| Policy/spend-limit engine | No policy model in backend; frontend-only checks create false trust |
| Statutory payroll surfaces (PF/TDS/Form 16) | Backend computes none of these |
| Mail folders/read-state/attachments/threading/chat | 3-endpoint internal messaging; client-side fiction otherwise |
| Notice audience segmentation/comments/analytics | No targeting or comment model; broadcast model is honest scope |
| Public event pages/RSVP/ticketing/QR check-in | Participants managed internally; no commerce or scanning backend |
| Bank statement import/reconciliation/NEFT batch files | Module manages bank details, not transactions |
| Bulk employee import | No bulk endpoint; atomic-create loops half-fail messily |
| Native mobile apps | Responsive web covers phone use |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FNDT-01 | Phase 1 | Complete |
| FNDT-07 | Phase 1 | Complete |
| FNDT-02 | Phase 2 | Pending |
| FNDT-03 | Phase 2 | Pending |
| FNDT-04 | Phase 2 | Pending |
| FNDT-05 | Phase 2 | Pending |
| FNDT-06 | Phase 2 | Pending |
| AUTH-01 | Phase 2 | Pending |
| NOTC-01 | Phase 3 | Pending |
| NOTC-02 | Phase 3 | Pending |
| NOTC-03 | Phase 3 | Pending |
| MAIL-01 | Phase 4 | Pending |
| MAIL-02 | Phase 4 | Pending |
| MAIL-03 | Phase 4 | Pending |
| MAIL-04 | Phase 4 | Pending |
| LEAV-01 | Phase 4 | Pending |
| LEAV-02 | Phase 4 | Pending |
| LEAV-03 | Phase 4 | Pending |
| LEAV-04 | Phase 4 | Pending |
| LEAV-05 | Phase 4 | Pending |
| LEAV-06 | Phase 4 | Pending |
| REIM-01 | Phase 5 | Pending |
| REIM-02 | Phase 5 | Pending |
| REIM-03 | Phase 5 | Pending |
| REIM-04 | Phase 5 | Pending |
| REIM-05 | Phase 5 | Pending |
| REIM-06 | Phase 5 | Pending |
| REIM-07 | Phase 5 | Pending |
| REIM-08 | Phase 5 | Pending |
| REIM-09 | Phase 5 | Pending |
| REIM-10 | Phase 5 | Pending |
| REIM-11 | Phase 5 | Pending |
| REIM-12 | Phase 5 | Pending |
| PAYR-01 | Phase 5 | Pending |
| PAYR-02 | Phase 5 | Pending |
| PAYR-03 | Phase 5 | Pending |
| PAYR-04 | Phase 5 | Pending |
| ADMN-01 | Phase 6 | Pending |
| ADMN-02 | Phase 6 | Pending |
| ADMN-03 | Phase 6 | Pending |
| ADMN-04 | Phase 6 | Pending |
| ADMN-05 | Phase 6 | Pending |
| EVNT-01 | Phase 6 | Pending |
| EVNT-02 | Phase 6 | Pending |
| EVNT-03 | Phase 6 | Pending |
| EVNT-04 | Phase 6 | Pending |
| EVNT-05 | Phase 6 | Pending |
| EVNT-06 | Phase 6 | Pending |
| EVNT-07 | Phase 6 | Pending |
| EVNT-08 | Phase 6 | Pending |
| AUDT-01 | Phase 7 | Pending |
| AUDT-02 | Phase 7 | Pending |
| AUDT-03 | Phase 7 | Pending |
| AUDT-04 | Phase 7 | Pending |
| AUDT-05 | Phase 7 | Pending |
| AUDT-06 | Phase 7 | Pending |
| AUDT-07 | Phase 7 | Pending |
| AUDT-08 | Phase 7 | Pending |
| AUTH-02 | Phase 7 | Pending |
| AUTH-03 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 60 total (corrected from 55 — recount during roadmap creation)
- Mapped to phases: 60
- Unmapped: 0 ✓

---
*Requirements defined: 2026-08-24*
*Last updated: 2026-08-24 after roadmap traceability mapping (60 requirements across 7 phases)*
