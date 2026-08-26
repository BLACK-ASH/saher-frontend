---
phase: 04-staff-self-service-mail-leave
verified: 2026-08-26T16:05:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 3/5
  gaps_closed:
    - "Staff apply for leave with balances visible while applying; overlap errors surface inline; optional proof doc attaches"
    - "Staff see their applications with status badges and edit their own pending ones"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Mail round-trip: log in as two accounts; A composes to B via the To picker (type ≥2 chars, click chip), sends; B opens Inbox tab, clicks the row, reads body"
    expected: "Picker chips show name+email with X remove; after send, success toast lands on Sent tab and B sees the mail in inbox within ~60s staleTime/refetch; detail dialog shows From/To/Cc/Bcc grids, IST date, Bcc label (not 'CC')"
    why_human: "End-to-end browser flow against live backend; cross-account delivery and dialog rendering not statically verifiable"
  - test: "Reply flow: B clicks Reply on A's mail, observes prefilled compose, sends back to A"
    expected: "Compose tab opens with To = sender, subject prefixed 'Re:' (no double prefix if already present), body quoted line-by-line with '> ' and an 'On {IST date}, {name} wrote:' header"
    why_human: "Prefill values and tab switching are runtime UI behaviors"
  - test: "Inbox pagination: with >10 mails in the backend, page through Inbox/Sent using the footer arrows"
    expected: "Page readout advances (2 of N…), new rows load from server (?page=2&limit=10), switching tabs resets to page 1"
    why_human: "Requires seeded data volume and live query refetch observation"
  - test: "Sanitize/display check: send a mail whose body contains &, <, > and quotes; open it in the detail dialog"
    expected: "Body is inert (no HTML execution) — but note WR-05 was left open: pre-escaping means readers see literal '&amp;'/'&lt;' entity soup. Decide whether that display mangling is acceptable or needs the follow-up fix (render text node directly, delete escapeHtml)"
    why_human: "XSS behavior + visual entity rendering in a live DOM"
  - test: "After the /leave gate fix ships: log in as role 'user', click sidebar 'Leave', apply for leave"
    expected: "Staff reaches /leave (not /forbidden); balance cards render at top of dialog from GET /api/leave/balance; submitting an overlapping range shows the server's overlap message inline below the dates with the form still open; non-overlap failures toast once"
    why_human: "Role-guard redirect behavior and live API error routing under real session"
  - test: "Proof upload end-to-end (CR-01 fix): in Apply Leave, drop/crop an image, wait for upload, submit"
    expected: "'Uploaded' toast fires, preview shows, form submits with proof URL stored; proof icon appears in the table row and the image renders in the details dialog. Fixer explicitly marked this requires-human-verification (runtime canvas.toBlob → /api/upload/image → data.url path untested automatically)"
    why_human: "Async crop/upload pipeline with live multipart endpoint"
  - test: "Edit pending application (CR-02 fix): as staff, change the leave TYPE on a pending application and save; re-open details"
    expected: "Type change persists (dialog resolves code → _id → payload.leaveCode for PUT /application/update/:id); dates shown pre-filled correctly in the date inputs (dateToIstDateOnly); guard toast fires if type list hasn't loaded"
    why_human: "Fixer marked requires-human-verification; contract asymmetry between create (by code) and update (by _id) only observable against live backend"
  - test: "Manager review queue: log in as manager/admin, open /leave-management, exercise All/Pending/Approved/Rejected filters, approve one request with a comment and reject another"
    expected: "Filter buttons toggle variant, empty filter shows inline 'No leave applications found.' row; decisions persist with managerComment visible later in the staff details dialog"
    why_human: "Role-scoped live review mutations + cache invalidation refetch"
  - test: "Admin leave-type CRUD: create a type, then edit a DISABLED type without touching its Active checkbox and save"
    expected: "Create succeeds and appears in table; editing a disabled type keeps it disabled (isActive pre-fill fix, commit 66f547b); carry-forward > allocated days is rejected inline by the zod refine"
    why_human: "Dialog state across open/close cycles and refine error placement are runtime behaviors"
  - test: "Visual/responsive pass of /mail and /leave screens at mobile + desktop widths"
    expected: "Layouts consistent with existing shadcn conventions; balance card grid collapses cleanly; tables scroll/hide gracefully"
    why_human: "Visual appearance and responsive layout"
  - test: "(NEW in re-verification — side effect of the guard fix) As role 'user', paste /dashboard, /users, /attendance-correction and /leave-management directly into the URL bar"
    expected: "Pages render (group guard now admits leave:write holders). Decide whether empty/erroring admin shells with sonner error toasts are acceptable UX for staff who deep-link, or whether per-page guards (or moving /leave out of the (manager) group) should follow. Note /leave-management will actually render live data for staff because backend GET /leave/application/all carries no authorize() guard — that is a backend scoping question, outside this repo"
    why_human: "Runtime redirect/render behavior under real sessions; policy decision on acceptable degradation"
---

# Phase 4: Staff Self-Service — Mail & Leave Verification Report

**Phase Goal:** Staff handle daily personal workflows in-app — internal mail and the full leave lifecycle (apply, track, review, type management) — reusing the pilot's promoted widgets and building the user-search picker later phases need.
**Verified:** 2026-08-26T16:05:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure

> **Process note (MVP mode):** ROADMAP declares `mode: mvp`, but the phase goal is not in User Story form (`gsd-sdk query user-story.validate` → `false`). Same situation as Phase 3: surfaced per protocol rather than silently ignored; verification proceeded goal-backward against the five roadmap Success Criteria, which are concrete and behavioral. Recommend `/gsd mvp-phase 4` if a User Story goal is wanted for future re-verification.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Staff read their inbox as a paginated list with sanitized message view, and see sent items in the outbox | ✓ VERIFIED | Regression check passed: `app/(main)/mail/page.tsx` — `useState(1)` page → `useMail({ page })` (lines 63-64), `onPageChange={setPage}` both tables (127, 143), tab-switch reset (110); UserSearchPicker still consumed ×4 in compose. No regression-inducing changes to mail files since prior verification |
| 2 | Permitted users compose mail via user-search picker, and reply prefills recipient + quoted body | ✓ VERIFIED | Regression check passed: picker imported and used in compose form; reply handler, validation schema, dual invalidation unchanged since initial verification (file mtimes match reviewed commits) |
| 3 | Staff apply for leave with balances visible while applying; overlap errors surface inline; optional proof doc attaches | ✓ VERIFIED | **Gap closed by commit 3f816af** ("allow staff leave:write holders past manager layout guard", lands directly after 4761a71): `(manager)/layout.tsx:20` adds `can(r, "write", "leave")` to allow(). Role `'user'` holds `leave:write` (`lib/permissions.ts:125`) and none of the three read permissions → passes via exactly the new clause. Dialog implementation itself was already verified substantive (balances, inline overlap errors, ImageUpload proof envelope fix fb72b19) — the sole defect was route reachability, now fixed |
| 4 | Staff see their applications with status badges and edit their own pending ones | ✓ VERIFIED | Same root cause, same fix. Sidebar "Leave" is an unconditional `userRoutes` entry (`components/sidebar/nav-list.tsx:56-60`) so staff also have discoverability, not just direct-URL reachability. Table badges/pending-edit gating/detail-dialog Edit flow unchanged and previously verified |
| 5 | Managers/admins review applications (approve/reject with note) from a filterable queue, and admins create/edit leave type definitions | ✓ VERIFIED | Regression check passed: `statusFilter` variant-swap filter group intact (`admin-page.tsx:49,55,86`); `review.mutate` wired in ReviewLeaveDialog (`review-leave-dialog.tsx:53`); apply/updateApplication mutations wired in the shared dialog (`apply-leave-dialog.tsx:121,138`). Manager/admin pass the widened guard via their pre-existing `leave:read` |

**Score:** 5/5 truths verified

### Re-Verification: Predicate × Role Matrix

The orchestrator asked explicitly that no role WITHOUT any of the four permission clauses gains access. Complete enumeration against `ROLE_PERMISSIONS` (`lib/permissions.ts`; `UserRole` pins exactly four roles, D-15):

| Role | read:user | read:attendance-correction | read:leave | write:leave | New predicate result |
| ------ | --------- | -------------------------- | ---------- | ----------- | -------------------- |
| admin | ✓ (:30) | ✓ (:33) | ✓ (:40) | ✓ (:69) | PASS — intended (queue + type mgmt) |
| manager | ✓ (:74) | ✓ (:77) | ✓ (:82) | ✓ (:108) | PASS — intended (queue) |
| **user** | ✗ | ✗ | ✗ | **✓ (:125)** | **PASS via the new clause only — the gap fix** |
| intern | ✗ | ✗ | ✗ | ✗ | FAIL all four → `/forbidden` — unchanged, intended |

No role holding none of the four permissions gains access. The only such role (intern) remains blocked. Blast radius at the predicate level is exactly: staff gains `/leave`.

**Known side effect (accepted, documented):** the guard wraps the whole `(manager)` route group (dashboard, users, users/[id], attendance-correction, leave-management, leave), so a staff member can now deep-link to sibling pages and see their shells. This grants zero new API access — RoleGuard is documented UX-only (`lib/permissions.ts:5`), the commit changes one client predicate, and the working tree contains no other source changes (`git diff 4761a71..3f816af`: +2/-1 lines in layout.tsx). Sidebar links for those pages remain hidden from staff (`canSeeManagerGroup`). Degradation quality routed to human verification item #11.

### Deferred Items

None. No later phase covers staff access to `/leave`: Phase 7's audit scope lists attendance, calendar, users, program, dashboard, profile, notifications, auth — leave is Phase 4's own deliverable.

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `components/user-search-picker.tsx` | Shared debounced user-search picker for compose + later phases | ✓ VERIFIED | Regression: exists, 4 uses in mail compose |
| `services/mail.api.ts` | Zod schemas + paginated list fns + correct sendMail envelope | ✓ VERIFIED | Unchanged since initial verification |
| `services/leave.api.ts` | Response schemas, aligned request schema, clean endpoints | ✓ VERIFIED | Unchanged since initial verification |
| `hooks/use-mail.ts` | Paginated queries + dual invalidation | ✓ VERIFIED | Unchanged |
| `hooks/use-leave.ts` | Queries + mutations with invalidation | ✓ VERIFIED | Unchanged |
| `app/(main)/mail/page.tsx` | Full mail experience | ✓ VERIFIED | Server pagination wiring re-confirmed at lines 63-64, 110, 127, 143 |
| `features/mail/outbox-column.tsx` | Renamed from typo; multi-recipient cell | ✓ VERIFIED | Unchanged |
| `features/leave/apply-leave-dialog.tsx` | Single create/edit dialog w/ balances, proof, overlap | ✓ VERIFIED | apply.mutate/updateApplication.mutate re-confirmed (138, 121) |
| `features/leave/leave-table.tsx` | Status badges, pending-only edit, pager | ✓ VERIFIED | Unchanged |
| `features/leave/admin-page.tsx` | Filterable admin queue | ✓ VERIFIED | Filter wiring re-confirmed (49, 55, 86) |
| `features/leave/leave-type.tsx` + `leave-type-dialog.tsx` | Type CRUD UI | ✓ VERIFIED | Unchanged |
| `components/image-upload.tsx` | Envelope-correct upload payload | ✓ VERIFIED | Unchanged |
| `app/(main)/(manager)/layout.tsx` | Guard that lets the phase's own target persona reach its pages | ✓ VERIFIED | **Fixed in 3f816af**: `can(r, "write", "leave")` added; role-'user' passes, intern still blocked (matrix above) |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| mail page | `GET /api/mail?page&limit` / `GET /api/mail/outbox` | useMail → apiFetch | WIRED | Regression-passed |
| compose form | `POST /api/mail` | send.mutate | WIRED | Regression-passed |
| UserSearchPicker | `GET /api/user/:keyword` | debounced useQuery | WIRED | Regression-passed |
| reply button | compose form state | form.setValue + setActiveTab | WIRED | Regression-passed |
| apply/edit dialog | `POST /api/leave/application/apply` | apply.mutate (+05:30 dates) | WIRED | Regression-passed |
| edit branch | `PUT /api/leave/application/update/:id` | updateApplication.mutate({…,leaveCode}) | WIRED | Regression-passed |
| review dialog | `PUT /api/leave/application/review/:id` | review.mutate | WIRED | Regression-passed |
| type dialogs | `POST/PUT /api/leave/type(/:id)` | createType/updateType | WIRED | Regression-passed |
| image-upload | `POST /api/upload/image` | apiFetch FormData → res.data | WIRED | Regression-passed |
| staff role → `/leave` page | RoleGate passage | (manager) layout allow() | **WIRED** | **Previously NOT_WIRED — closed by 3f816af; staff pass via write:leave, sidebar link unconditional** |

### Data-Flow Trace (Level 4)

Unchanged from initial verification — no data-path code was touched by the gap fix (single client-side predicate).

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| Mail tables | `inData/seData.items` | `useMail({page})` → backend list endpoints with meta | Yes | ✓ FLOWING |
| Balance cards | `balance.data.balance` | `["leave","balance"]` → GET /api/leave/balance | Yes | ✓ FLOWING |
| Applications tables | `applications.data.items` | GET /api/leave/application(/all) | Yes — backend returns unbounded arrays (no meta), footers stay hidden until backend paging lands (WR-09 open) | ⚠️ STATIC (paging inert, data real) |
| Picker dropdown | `results` | getSearchUser(debouncedKeyword) | Yes | ✓ FLOWING |
| Proof field | `form.proof` | upload response `data.url` | Yes (post-CR-01) — runtime flow needs human check | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------- |
| Lint post-fix | `pnpm lint` (run by verifier this session) | 0 errors, 51 warnings (pre-existing warnings) | ✓ PASS |
| Fix commit present, on top of 4761a71, minimal | `git log` + `git diff 4761a71..3f816af` | 3f816af follows 4761a71; diff is exactly +2/-1 lines in `(manager)/layout.tsx` | ✓ PASS |
| Working tree matches fix commit | `git status --short` | Only .planning artifacts dirty; zero app-source drift | ✓ PASS |
| Predicate × all roles | manual matrix over `ROLE_PERMISSIONS` | user passes via write:leave only; intern blocked; admin/manager unchanged | ✓ PASS |
| Prior commits still valid | carried forward (20 hashes verified initially) | no history rewrite (`git log` linear through fb72b19) | ✓ PASS |
| Runtime flows | — | CSR app requires live backend + auth cookies | ? SKIP (routed to human verification) |

Step 7c Probe Execution: SKIPPED — no probe scripts declared in PLAN/SUMMARY and none exist conventionally (`scripts/**/probe-*.sh` absent).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| MAIL-01 | 04-02 | Read inbox (paginated + sanitized view) | ✓ SATISFIED | Carried forward |
| MAIL-02 | 04-02 | Compose via user-search picker | ✓ SATISFIED | Carried forward |
| MAIL-03 | 04-02 | See sent items in outbox | ✓ SATISFIED | Carried forward |
| MAIL-04 | 04-02 | Reply prefilled recipient + quoted body | ✓ SATISFIED | Carried forward |
| LEAV-01 | 04-03 | Staff can view leave types | ✓ SATISFIED | **Was BLOCKED** — types render in apply-dialog Select + /leave-management table; staff now reach /leave via the 3f816af predicate fix |
| LEAV-02 | 04-03 | Apply w/ balances visible, overlap inline, optional proof | ✓ SATISFIED | **Was BLOCKED** — implementation was always complete; route reachable for staff now |
| LEAV-03 | 04-03 | See own applications with status | ✓ SATISFIED | **Was BLOCKED** — badge table reachable for staff now |
| LEAV-04 | 04-03 | Edit own pending application | ✓ SATISFIED | **Was BLOCKED** — CR-02 edit flow reachable for staff now |
| LEAV-05 | 04-04 | Managers/admins review from filterable queue | ✓ SATISFIED | Carried forward |
| LEAV-06 | 04-04 | Admins create/edit leave type definitions | ✓ SATISFIED | Carried forward |

All 10 requirement IDs satisfied. None orphaned.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `app/(main)/(manager)/layout.tsx` | 15-22 | Group-wide guard admits leave:write holders to sibling admin shells (/dashboard, /users, /attendance-correction, /leave-management) | ⚠️ Warning | Zero new API access (guard is UX-only, lib/permissions.ts:5); sidebar still hides links; degradation quality → human check #11. Accepted consequence of the sanctioned fix — not a gap |
| `app/(main)/mail/page.tsx` | 52-58, 354 | escapeHtml pre-escape double-escapes (WR-05, left open) | ⚠️ Warning | Readers see literal `&amp;`/`&lt;` for ordinary text; XSS-safe either way |
| `features/mail/outbox-column.tsx` | 16-21 | Unguarded `users[0]` (IN-01, left open) | ⚠️ Warning | Legacy/corrupt row with empty `to` crashes Sent tab |
| `services/mail.api.ts` | 44 | Keyword interpolated into URL unencoded (WR-06, left open) | ⚠️ Warning | Search breaks for keywords containing `?#%` |
| `features/leave/admin-page.tsx` | 177-195 | Check and X buttons both open Approve-defaulted dialog (IN-08, left open) | ⚠️ Warning | One Enter away from mis-approval |
| `app/(main)/mail/page.tsx` | 361-373 | Reply leaves stale Cc/Bcc from previous compose (IN-05, left open) | ℹ️ Info | Leftover recipients ride along on replies |
| `services/leave.api.ts` | 279-304 | page/limit params backend ignores (WR-09, left open) | ℹ️ Info | Inert plumbing until backend ships paging meta; footers correctly stay hidden |
| ../saher-backend `leave.route.ts` | :63 | `GET /leave/application/all` has no authorize() — staff deep-linking /leave-management see all applications' data | ℹ️ Info (out of repo) | Pre-existing backend property, unchanged by this frontend commit; recorded for the developer — this milestone has no backend phase |

Debt-marker gate: zero TBD/FIXME/XXX markers in any phase-touched file; zero console.log. Open items are documented review findings (04-REVIEW.md), not unauditable debt.

## Human Verification Required

See the 11 structured items in the frontmatter `human_verification:` list — the original 10 are preserved unchanged (mail round-trip/reply/pagination/sanitize-display, staff-role /leave access demonstration, apply-with-balances + overlap + proof-upload runtime [CR-01], pending-edit type persistence [CR-02], manager review queue, admin type CRUD, responsive visual pass). Item #11 is new in this re-verification and covers the guard-fix side effect (staff deep-linking sibling (manager) pages) plus the policy call on whether that degradation is acceptable.

Note: former expectation in item #5 ("currently expect /forbidden") is superseded — the static analysis now predicts staff reach /leave successfully; the live-session confirmation is still required because redirect behavior under a real cookie session can't be grepped.

## Gaps Summary

**None remaining.** The single root cause behind both failed truths — the `(manager)` route-group guard excluding the phase's own target persona — is closed by commit 3f816af, which adds `can(r, "write", "leave")` as a fourth allow-clause (`app/(main)/(manager)/layout.tsx:20`). Verified from the codebase, not the claim: the diff is exactly +2/-1 lines; role `'user'` holds `leave:write` and none of the three read clauses, so it passes via precisely the new clause; every other role's outcome is unchanged (admin/manager already passed via `leave:read`; intern fails all four and stays redirected). The sidebar exposes "Leave" to all authenticated roles, so the feature is discoverable, not just reachable. All five roadmap success criteria now have complete artifact/wiring/data-flow evidence; all 10 requirement IDs are satisfied. Status is `human_needed` solely because 11 items require live-backend browser sessions — automated checks are exhausted and green (lint 0 errors re-confirmed by the verifier this session).

---

_Verified: 2026-08-26T16:05:00Z_
_Verifier: the agent (gsd-verifier)_
