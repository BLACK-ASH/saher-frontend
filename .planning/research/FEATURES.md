# Feature Research

**Domain:** Org-management / ERP-lite intranet (HRMS-lite) frontend completion
**Researched:** 2026-08-24
**Confidence:** HIGH

## Framing: Features = UI Affordances on a Fixed Backend Contract

This is **not** greenfield product research. saher-backend is canonical and deployed (PROJECT.md: "Out of Scope: Backend changes"). Every feature below is anchored to a real route in `MODULE_ROUTES.md` / `FRONTEND-HANDBOOK.md`. Where commercial HRMS products (Keka, greytHR, Zoho People, RazorpayX Payroll, Ramp) have features the backend can't serve, they are listed as **anti-features / defer** — building UI for nonexistent endpoints is the #1 way this milestone blows its 1-month timeline.

Two flows in reimbursement deserve emphasis because they shape the whole module's IA:

- **Post-reimbursement**: employee pays out of pocket → submits bill claim → finance handles it → settles payment.
- **Pre-reimbursement (advance)**: admin creates an advance bill *for* a user; balance enquiry nets advance paid vs pocket expenses claimed.

Verified conventions that repeat across all domains (from FRONTEND-HANDBOOK): RBAC action gating (`read/write/update/delete` per resource), soft delete + `PATCH <resource>/restore/{id}` trash UX, `{ success, message, data, meta }` envelope, IST dates, exports enqueue a job whose download link arrives as a notification action.

---

## Feature Landscape (by domain)

### 1. Reimbursement (`/api/reimbursement`)

#### Table Stakes — Staff (employees)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Submit expense bill (amount, description, receipt images) | Core purpose of module; every competitor starts here | MEDIUM | `POST /bill`; receipts via `POST /api/upload/images` (≤10 imgs, ≤5 MB, auto-WebP). Multi-step form or single form + uploader |
| See my bills list w/ status | "Where is my money?" is the #1 employee anxiety (Ramp/Helios both call status visibility top friction) | LOW | `GET /mybills` (Redis-cached). Status badges: pending/approved/rejected/held/settled |
| Edit own pending bill | Competitors treat draft-edit-before-approval as baseline | LOW | `PATCH /:billId`; only while pending |
| Withdraw/delete own pending bill | Standard self-service | LOW | `DELETE /:billId` (soft delete) |
| Balance enquiry (advance vs pocket expenses vs net) | Saher-specific differentiator-vs-market that is table stakes *here* because endpoint exists | LOW | `GET /balance-enquiry`; render as 3-number summary card |
| Notification when bill handled | Employees shouldn't have to poll | LOW | Already emitted by backend; ensure feed renders bill actions |

#### Table Stakes — Manager/Admin (finance)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Handle queue: approve / reject / hold with reason | The approval step IS the control (ExpenseTron: undocumented approvals are a fraud/compliance risk) | MEDIUM | `POST /handle/:billId`; approval creates settlement record server-side. Reject/hold require note field |
| All-bills list + search & filters | Finance review tools = filter queues by user/status/date/amount (Helios) | LOW-MEDIUM | `GET /bills` (all), `GET /` (search by description/amount/date/user). Server-driven filters via query params |
| Bill detail view w/ receipt images | Approvers must see documentation before approving | LOW | `GET /:billId`; image gallery/lightbox |
| Settlement processing | Closing the loop: record how it was paid (UPI/bank transfer) | MEDIUM | `POST /settlement/:settleId`. Money path → needs test coverage |
| Recycle bin (deleted bills + restore) | Established app-wide pattern | LOW | `GET /recyclebills` + restore pattern |
| Create/edit advance bill for a user | Pre-reimbursement flow is core to this org's process | LOW-MEDIUM | `POST/PATCH/DELETE /admin/:user` / `/admin/:billId`; needs user-search picker (`GET /api/user/:keyword`) |
| Audit log view | Compliance expectation for money modules | LOW | `GET /audit-log`, `POST /create-log` |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Lifecycle timeline on bill detail (submitted → handled → settled w/ who+when+note) | Turns scattered audit log into one glanceable story; cheap because data already exists | MEDIUM | Compose from bill record + audit-log entries |
| Bulk handle (multi-select approve/reject) | Month-end finance throughput | MEDIUM | Only if done per-bill sequentially against `POST /handle/:id` — no bulk endpoint exists; queue client-side |
| Settlement status surfacing on my-bills ("paid on X via UPI") | Closes the employee's mental loop | LOW | Data present post-settlement |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| OCR/AI receipt scanning | Competitors showcase it | No backend extraction; org-scale value ≈ 0 for <100 employees; huge effort | Plain upload + manual amount entry |
| Configurable multi-level approval workflow builder | "Ramp has routing rules" | Approval chain here is fixed by role (`preReimbursement` perm); rules engine is months of work | Single handle step by finance role |
| Policy violation engine (spend limits, category rules) | NetSuite/Ramp market it | No policy model in backend; frontend-only checks create false trust | Show amounts clearly; humans enforce policy at handle step |
| Corporate card feeds / GL posting | Enterprise checklist item | No cards, no ledger in backend | N/A — out of scope |

---

### 2. Payroll (`/api/payroll`)

⚠️ **Key constraint discovered:** ALL payroll routes require `authorize(..., 'payroll')` — there is **no employee-facing payroll endpoint**. Employees cannot see their own salary records through this API today. Do not build an ESS payslip screen; it would 403 for its intended audience.

#### Table Stakes — Admin

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Payroll records list (paginated, across employees) | Review-before-pay is the universal month-end flow (maker-checker pattern in Indian HRMS: TeamLease, HROne) | LOW | `GET /payroll`; table + filters + pagination from `meta` |
| Per-employee payroll history | Auditing what someone was paid over time | LOW | `GET /payroll/user/:id` |
| Record installment payment / status update | Installment-based salary payment is this org's actual model | MEDIUM | `PUT /payroll/:id`; server accumulates paid amounts. Money path → tests required. Show paid-vs-total progress |
| Trigger generation cron manually | Admins need "run now" after fixing data; waiting for cron is unacceptable UX | LOW | `POST /payroll/cron`; long-running → toast + check-notifications pattern |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Run-review exception highlighting (flag rows where amount differs sharply from previous run) | HROne's headline pattern: "review ten anomalies instead of a thousand rows" | MEDIUM | Pure client-side diff of consecutive runs; no backend change needed |
| Payroll summary widget on admin dashboard (this month total, unpaid installments) | Month-end situational awareness | LOW-MEDIUM | Client-side aggregation of `GET /payroll` page data |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Employee self-service payslips | Every commercial HRMS has it | **No endpoint serves employees their own payroll**; building it means fake UI or backend change (out of scope) | Defer to next backend milestone |
| Payslip PDF designer / statutory formats | India-market checklist (Form 16, challans, PF/ESI/TDS) | Backend computes none of these; generating statutory-looking documents without computation is dangerous fiction | Render plain payroll record detail only |
| Salary structure editor, tax declarations, arrears engine | Keka/RazorpayX features | No corresponding backend model whatsoever | N/A |

---

### 3. Leave (`/api/leave`)

#### Table Stakes — Staff

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| View leave types (paid/casual/sick/paternity…) | Can't apply without knowing the vocabulary | LOW | `GET /leave/type` |
| Apply for leave (type, date range, reason, proof doc) | The core action; overlap validation happens server-side and errors must surface inline | MEDIUM | `POST /leave/application/apply`; proof via `POST /api/upload/document`. Handle overlap-validation error message gracefully |
| My applications list w/ status | Same status-anxiety driver as bills | LOW | `GET /leave/application` |
| Leave balances per type | Employees plan around balances; every leave product shows them prominently | LOW | `GET /leave/balance`; summary card beside application form so users see balance while applying |
| Update pending application | Change dates before review instead of cancel+reapply | LOW | `PUT /leave/application/update/:id` (server excludes itself from overlap re-check) |

#### Table Stakes — Manager/Admin

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Approve/reject applications with review note | The control point of the workflow | LOW-MEDIUM | `PUT /leave/application/review/:id` |
| All-applications queue (filterable by employee/status/date) | Managers triage before absences happen | LOW | `GET /leave/application/all` |
| Leave type management (create/edit definitions) | Admin owns the vocabulary; entitlements live in type definition | LOW | `POST /leave/type`, `PUT /leave/type/:id` |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Balances + team absence context merged into calendar | Calendar module already aggregates monthly data; seeing "who's off" prevents approval mistakes | LOW-MEDIUM | Cross-reference `GET /calendar/:year/:month`; verify whether leave data is included in aggregation — if not, render balances card only |
| Proof document viewer in review screen | Manager sees sick-note before approving | LOW | Document link from media record |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Accrual/carry-forward policy engine | greytHR/Zoho depth feature | Balance math lives in backend; a parallel frontend engine will disagree with server | Display computed balances only |
| Holiday calendar editor inside leave | Feels related | Holidays belong to attendance module already (`/attendance/holiday` CRUD exists); duplicating creates two sources of truth | Link to existing holidays admin |
| Team leave calendar grid with drag-drop planning | Calendly-style appeal | No backend support for tentative/planned leaves | Simple list view of approved upcoming leaves |

---

### 4. Mail (`/api/mail`)

⚠️ This is an **internal messaging feature with 3 endpoints**, not an email client. Scope discipline here is the difference between a 2-day module and a 2-week one.

#### Table Stakes — Staff

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Inbox list (paginated) | Baseline | LOW | `GET /mail` |
| Read message view | XSS-sanitized server-side, so safe rendering of content | LOW | Detail pane/route |
| Compose + send to colleague(s) | Baseline | MEDIUM | `POST /mail` (`write mail` permission gates who can send!); recipient picker built on `GET /api/user/:keyword` search |
| Outbox (sent items) | "Did it send?" reassurance | LOW | `GET /mail/outbox` |
| Unread indicator / notification on new mail | Backend sends instant notification alert on send | LOW | Wire into existing notification feed/badges |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Reply (compose prefilled with recipient + quoted body) | Cheapest possible "conversation" feel without threading backend | LOW | Pure client-side prefill of compose state |
| Role/department quick-addressing in picker | Sending "all managers" is common internal-comms need | LOW-MEDIUM | Only if recipient schema accepts multiple targets — verify `sendMailSchema` shape first |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Folders/labels/filters/rules | Gmail muscle memory | Zero backend support; pure client fiction | Single inbox list |
| Read/unread state tracking, delete, archive | Feels mandatory | No endpoint marks mail read or deletes it | Use notification seen-state as the proxy for "attended" |
| Attachments, drafts, signatures, HTML editor | Email-client parity | Mail is sanitized text; uploads are a separate module not wired into mail | Rich text stays out; link to uploaded docs by URL if ever needed |
| Real-time chat | "Mail is too slow" | Chat is a different product; WebSocket infra doesn't exist | Notifications + mail covers async comms |

---

### 5. Noticeboard (`/api/notice`)

Note: MODULE_ROUTES.md shows notice marked `underDevelopment` with permanent-delete only; the FRONTEND-HANDBOOK (binding, newer) documents soft delete + `PATCH /notice/{id}/restore`. Trust the handbook; verify live at `/docs` during implementation.

#### Table Stakes — Staff

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Active notices feed | The entire point; expired notices auto-hidden server-side (7-day default expiry) | LOW | `GET /notice/notice` |
| Notice detail view | Long announcements need full-page reading | LOW | Expand/card-click |
| Highlighting recent/expiring-soon notices | Attention management | LOW | Client-side from expiry dates (IST-aware) |

#### Table Stakes — Admin

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Create notice (title, content, optional expiry override) | Publishing baseline | LOW | `POST /notice/notice`; show the 7-day default expiry in UI so admins aren't surprised |
| Edit notice | Typo fixes | LOW | `PUT /notice/notice/:id` |
| Soft delete + restore (trash tab) | Consistent with app-wide trash UX pattern | LOW | Handbook-documented restore route |
| Permanent delete | End-of-lifecycle cleanup | LOW | `DELETE /notice/notice/:id/permanent`; confirm dialog mandatory |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Pinned/important visual tier | Urgent announcements shouldn't scroll away | LOW | If schema lacks a flag, sort by recency and style first item |
| Notice creation → targeted notification broadcast | Reuse `POST /api/notification` (managers can broadcast) to ping staff about major notices | LOW-MEDIUM | Two-call flow; opt-in checkbox on create form |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Comments/discussion threads on notices | Engagement-checklist item | No comment backend; turns broadcast into moderation burden | Mail reply for questions |
| Audience segmentation builder ("publish to dept X only") | Claromentis/Jalios sell it | No targeting model in notice schema; company-wide is the honest scope | One board, everyone |
| Newsletter scheduling + open-rate analytics | Intranet-vendor feature set | Massive effort, zero fit for <100-person org | Publish-and-expiry model |
| Rich CMS (media galleries, drag-drop layouts) | "Make it pretty" | Content model is title/content | Keep text; embed nothing |

---

### 6. Bank & Accounts Admin (`/api/admin`)

This module is the identity + payout-data backbone: atomic onboarding (User + Account + Bank in one call), bank detail CRUD, user directory management.

#### Table Stakes — Admin

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Onboard employee (account + bank details in one wizard) | Atomic endpoint means partial failures are impossible — the UI should mirror that with a single guided form, not three separate ones | MEDIUM | `POST /admin/account`; multi-section form submitting once. Onboarding email is sent server-side |
| Employee directory (search, paginate) | Existing users admin — audit-fix territory | LOW | `GET /admin/users` |
| Account detail + edit | Corrections to profile/account data | LOW | `GET /admin/account/:id`, `PUT /admin/account/:id` |
| Bank details view/create/update/delete per employee | Payout accuracy depends on this data being maintainable; display masked account numbers | LOW-MEDIUM | `POST/GET/PUT/DELETE /admin/bank/:id`; money-adjacent → tests |
| Soft delete + restore user | Offboarding without data loss | LOW | `DELETE /admin/user/:id`, `PATCH /admin/user/:id/restore` |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Session management UI (list/revoke sessions) | Security self-service; endpoints already exist and are unused | LOW | `GET /auth/sessions`, revoke routes — could also live in profile |
| Onboarding validation feedback (email format, IFSC-style patterns) | Fewer bad bank records reaching settlement | LOW | Client-side zod schemas mirroring `bankSchema` |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Bank statement import / reconciliation ledgers | "Accounts" sounds like accounting | Module manages bank *details*, not bank *transactions*; double-entry bookkeeping is a different product | Clean CRUD of payout details |
| Payment gateway / bank-file (NEFT/RTGS batch) integration | RazorpayX envy | No such backend; fabricating transfer files is high-risk fiction | Record settlements manually in reimbursement/payroll screens |
| Bulk import employees via spreadsheet | Onboarding 50 people | No bulk endpoint; client-side loops over atomic create would half-fail messily | One-by-one wizard; defer bulk to backend milestone |

---

### 7. Events (`/api/events`) — NGO programs → workshops → sessions → participants

Hierarchy: Program ⊃ Workshop ⊃ Session; Participants attach to programs; Attendance attaches to sessions. (Saher runs NGO programs — participants may be beneficiaries, not employees; confirm during implementation whether participant creation uses employee search or free entry.)

#### Table Stakes — Staff (read access via `read event`)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Browse programs/workshops/sessions lists + detail | Visibility into org activity | LOW-MEDIUM | Nested GETs; drill-down navigation program→workshop→session |
| Sessions surfaced in calendar | Calendar module already aggregates sessions monthly | LOW | Mostly existing calendar work — verify rendering quality |

#### Table Stakes — Admin/Manager

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Program CRUD (+trash/restore) | Top of hierarchy | LOW-MEDIUM | Full route family incl. restore |
| Workshop CRUD under program | Mid hierarchy; creation requires `:programId` in path | LOW-MEDIUM | `POST /workshops/:programId` etc. |
| Session CRUD | Leaf scheduling entity; drives reminders + attendance | LOW-MEDIUM | Session create takes `:programId`; IST datetime pickers critical |
| Participant CRUD + attach/detach to program | Rosters | MEDIUM | Participants routes + `POST/DELETE /programs/participants/:programId[...]`; likely needs user-search or free-entry depending on schema |
| Mark session attendance (bulk per session) | The operational record that workshops happened | MEDIUM | `POST/PUT/DELETE /attendance/sessions/:sessionId` with batch schema — design a fast checkbox-grid UI; update + delete variants exist for corrections |
| Send session reminder | Endpoint exists and is oddly-shaped: reminder is a GET on `/programs/workshops/sessions/:sessionId` | LOW | One button; notification delivered server-side |
| Export reports | Milestone-committed; follows app-wide job→notification→download pattern | LOW-MEDIUM | Verify exact export route in live OpenAPI (handbook confirms capability exists) |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Attendance percentage per participant/program | Impact reporting for an NGO is gold; derivable from existing data | MEDIUM | Client-side rollup of attendance records |
| Session roster print/export per session | Field usability — carry the list, mark later | LOW | Browser print CSS or reuse export pattern |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Public event pages / registration links / RSVP | Eventbrite reflex | Participants are managed internally; public surface = auth + privacy exposure | Internal roster management |
| Ticketing/payments/waiting lists | Vendor feature creep | No commerce backend whatsoever | N/A |
| QR-code check-in for sessions | Feels modern | No scanning backend; hardware dependency for field staff | Fast checkbox grid works on phones |
| Video-conferencing integration | Hybrid-work checklist | No provider backend | Store a meeting URL string in session notes if schema allows |

---

### Cross-Cutting (audit-fix scope — existing modules)

These aren't new features but the audit pass must verify them per PROJECT.md's daily-driver bar:

| Concern | Complexity | Notes |
|---------|-----------|-------|
| Auth flows incl. session list/revoke | LOW | Routes exist; verify UI coverage of revoke-all |
| Attendance check-in/out, overtime, week-off claims, correction request→approve loop | MEDIUM | Correction approval is a manager workflow — verify it has UI, not just API wiring |
| Calendar month aggregation + custom events + Google sync button | LOW | Existing; fix adherence to apiFetch/zod patterns |
| Notification feed + web-push enable/disable + unseen badge | LOW | Existing; every new module hooks into it |
| Profile + change email/password token flows | LOW | Token-confirm flows need clear pending-state UX |
| RBAC hiding everywhere (`read/write/update/delete` per resource) | MEDIUM | The single most important cross-cutting audit item — UI affordances must gate on permissions consistently |
| Trash UX consistency (all resources: `?isDeleted=true` + restore) | LOW | One shared component/pattern |
| IST date handling (offset ISO strings) | MEDIUM | Silent-corruption risk; add util-level tests |

---

## Feature Dependencies

```
Auth/session audit-fix + RBAC gating
    └──requires──> EVERYTHING below (gates all affordances)

Uploads service integration (image/doc components)
    └──requires──> Reimbursement bill submit (receipts)
    └──requires──> Leave apply (proof docs)
    └──enhances──> Events participants/sessions

User search (GET /api/user/:keyword)
    └──requires──> Mail compose recipients
    └──requires──> Advance-bill-for-user (reimbursement admin)
    └──requires──> Payroll per-user history lookup
    └──possibly requires──> Events participant creation (verify schema)

Bank accounts admin
    └──enhances──> Reimbursement settlement (payout destination context)
    └──enhances──> Payroll installment recording (accuracy checking)

Notification feed + push (existing)
    └──enhances──> Mail delivery, bill handling, leave review, event reminders,
                   export download links (exports REQUIRE it end-to-end)

Calendar aggregation (existing)
    └──displays──> Events sessions; enhanced by holiday correctness (attendance module)

Payroll review screens
    └──require──> Cron having generated records (backend-side; UI must handle empty state)

Noticeboard, Mail, Leave
    └──independent──> buildable in any order once auth/uploads/search audited
```

### Dependency Notes

- **Everything requires the auth/RBAC audit:** new modules copy existing patterns; if gating is inconsistent in old code, new code inherits the rot.
- **Exports require notifications end-to-end:** the download link arrives as a notification action; if the notification feed drops actions, exports appear broken even when the job succeeded.
- **Reimbursement settle ↔ bank accounts:** independent builds, but settle UX improves when bank details are visible; sequence bank admin earlier if choosing.
- **Leave balances ↔ leave apply:** same screen ideally; balance endpoint is trivial, no ordering constraint.
- **Conflict:** don't schedule payroll UI before confirming cron-generated data exists in the environment — otherwise all screens render empty states and "done" is unverifiable.

---

## MVP Definition

For a completion milestone, "MVP" = **every backend domain has its lifecycle-critical screens working against the real contract** (PROJECT.md Core Value). Ruthless cut: anything that only reads data prettily.

### Launch With (v1)

- [ ] Auth/RBAC/upload/user-search audit-fix — unblocks and protects everything
- [ ] Reimbursement full loop: submit bill w/ receipts → my bills + status → handle queue (approve/reject/hold) → settle → balance enquiry — the org's money pipeline
- [ ] Reimbursement admin extras: all-bills search, advance-bill-for-user, recycle bin, audit log
- [ ] Leave complete: types visible → apply w/ proof → my apps → review queue → balances — time-off is daily-driver frequency
- [ ] Payroll admin: records list, per-user history, installment recording, manual cron trigger — money path with tests
- [ ] Mail: inbox, read, compose via user picker, outbox — 3 endpoints, no excuses
- [ ] Noticeboard: feed + create/edit + trash/restore — cheapest win, high staff visibility
- [ ] Bank/accounts admin: onboarding wizard, account edit, bank CRUD, user restore — payout data integrity
- [ ] Events: full program→workshop→session CRUD, participants, session attendance grid, reminder button, export via notification flow
- [ ] Cross-cutting: IST utilities tested, trash pattern shared, notification actions render everywhere

### Add After Validation (v1.x)

- [ ] Reimbursement lifecycle timeline view — trigger: finance asks "who did what when"
- [ ] Payroll anomaly highlighting vs previous run — trigger: first real month-end with >30 records
- [ ] Mail reply prefill — trigger: staff actually use mail
- [ ] Attendance-percentage rollups in events — trigger: program reporting demand
- [ ] Session-revoke security UI in profile — trigger: security review

### Future Consideration (v2+ — requires backend changes, currently out of scope)

- [ ] Employee self-service payroll/payslips — blocked: no employee-facing endpoint
- [ ] Statutory compliance surfaces (PF/TDS/Form 16) — blocked: backend computes none
- [ ] Bulk employee import — blocked: no bulk endpoint
- [ ] Notice audience targeting — blocked: no targeting schema

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Reimbursement lifecycle (submit→handle→settle) | HIGH | MEDIUM | P1 |
| Leave apply/review/balances | HIGH | LOW-MEDIUM | P1 |
| Bank/accounts admin + onboarding wizard | HIGH (blocks accurate payouts) | MEDIUM | P1 |
| Events hierarchy + session attendance | HIGH (org's operational core) | MEDIUM-HIGH (most routes) | P1 |
| Payroll review/installments | HIGH | LOW-MEDIUM | P1 |
| Noticeboard CRUD+restore | MEDIUM-HIGH | LOW | P1 |
| Mail inbox/outbox/compose | MEDIUM | LOW | P1 |
| Recycle bins everywhere | MEDIUM | LOW | P1 (pattern shared) |
| Exports + reminders | MEDIUM | LOW-MEDIUM | P2 |
| Search/filter polish (bills, directory) | MEDIUM | LOW | P2 |
| Timeline/anomaly differentiators | MEDIUM | MEDIUM | P2 |
| Dashboard widgets aggregating domains | MEDIUM | MEDIUM | P2-P3 |
| Session-revoke UI, reply prefill, rollups | LOW-MEDIUM | LOW | P3 |

---

## Competitor Feature Analysis

| Feature | Commercial HRMS (Keka/greytHR/HROne) | Expense tools (Ramp/Light) | Intranet portals (Claromentis/ThoughtFarmer) | Saher Approach |
|---------|--------------------------------------|----------------------------|---------------------------------------------|----------------|
| Expense capture | Scan+upload bills, mobile-first | OCR/AI extraction, Slack intake | — | Web upload (≤10 images), manual entry — right-sized |
| Approval chain | Multi-level configurable workflows | Amount-threshold routing rules | — | Fixed single-step by finance role; correct for org size |
| Payment | Bank transfer files, instant payouts | Card settlement, scheduled reimbursement | — | Manual settlement recording (UPI/transfer) |
| Payroll | Full statutory suite (PF/ESI/TDS/Form 16) | — | — | Records review + installment tracking only; compliance deliberately absent |
| Payslip ESS | Mobile payslips, password-protected PDFs | — | — | Deferred — no employee endpoint (backend gap) |
| Leave | Accrual engines, carry-forward policies | — | — | Types + apply/review + computed balances |
| Notices | — | — | Segmented audiences, newsletters, analytics, comments | One company-wide board w/ expiry + trash |
| Internal comms | — | — | Chat, blogs, engagement feeds, required-reading | 3-endpoint mail + notification broadcast |
| Events | — | — | RSVPs, registrations, hybrid video | Internal roster + attendance + reminder + export |
| Trash/audit | Varies | Audit trails marketed heavily | Version histories | Uniform soft-delete/restore + reimbursement audit log — genuinely competitive hygiene |

The consistent lesson: commercial suites monetize configurability Saher doesn't need at its scale. Its edge is doing the eight core loops reliably, which matches PROJECT.md's Core Value exactly.

---

## Sources

**Backend contract (HIGH confidence, binding):**
- `saher-backend/MODULE_ROUTES.md` — all 14 modules, every route, auth level, validation (verified in repo)
- `saher-backend/FRONTEND-HANDBOOK.md` — soft-delete/restore pattern, export-job→notification flow, module map (verified in repo)
- `.planning/PROJECT.md` — scope, constraints, out-of-scope boundaries

**Domain conventions (MEDIUM-HIGH confidence, corroborated across vendors):**
- Ramp — expense management workflow stages & anti-patterns (ramp.com/blog/expense-management-workflow)
- Helios — reimbursement software feature taxonomy: submission→approval→finance review→payment status (helios-global.ai)
- ExpenseTron — approval workflow failure modes, audit-trail/fraud rationale (expensetron.com, 2026)
- NetSuite — expense automation features, policy validation, multi-level approvals (netsuite.com)
- Microsoft Dynamics 365 Business Central — expense report state machine (Open→Pending Approval→Released→Paid→Completed) informing Saher status modeling (learn.microsoft.com)
- HROne / TeamLease / RazorpayX Payroll / Payroll Mitra — Indian payroll norms: maker-checker, installment/loan EMI tracking, exception-list review, ESS payslips, statutory suite scope
- Claromentis / ThoughtFarmer / AgilityPortal / Jalios / Precurio — intranet noticeboard/event/mail feature sets defining what to deliberately skip

**Gaps flagged for implementation-phase verification:**
- Live OpenAPI at backend `/docs` is final arbiter where MODULE_ROUTES.md and FRONTEND-HANDBOOK disagree (notice restore, events export route shape, mail multi-recipient support, participant creation input mode)
- Whether calendar month-aggregation includes leave data (affects leave/calendar differentiator)

---
*Feature research for: Saher org-management frontend completion*
*Researched: 2026-08-24*
