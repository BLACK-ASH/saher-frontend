---
phase: 04-staff-self-service-mail-leave
plan: "02"
subsystem: ui
tags: [mail, zod, react-hook-form, tanstack-query, user-search-picker, xss-escaping]

# Dependency graph
requires:
  - phase: 04-staff-self-service-mail-lease
    plan: 01
    provides: UserSearchPicker component, paginated getMails/getSentMails with normalizeList, SendMailInput/MailUser types from services/mail.api
provides:
  - useMail hook with { keyword, page, limit } props and dual ["sent"]+["inbox"] invalidation on send
  - Compose form with zod validation (to/subject/body required) rendered via UserSearchPicker + FieldError
  - Reply flow in mail detail dialog (prefill To/Subject/quoted body, switch to Compose tab)
  - HTML-escaped mail body rendering (escapeHtml) in detail dialog
  - Outbox To column with "and N other(s)" multi-recipient display
affects: [04-03-mail-pagination-ui, phase-5-reimbursement, phase-4-verifier]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Controlled Tabs + setActiveTab for cross-tab programmatic navigation (reply/send flows)"

key-files:
  created: []
  modified:
    - hooks/use-mail.ts
    - app/(main)/mail/page.tsx
    - features/mail/outbox-column.tsx
    - features/program/session/session-editor.tsx

key-decisions:
  - "session-editor.tsx consolidated into this plan: its useMail call site updated to the new object signature (Task 1) and its page-local MailUser import redirected to services/mail.api (Task 2), as 04-01 anticipated"
  - "Reply click handler guards on selectedMail null instead of the plan snippet's redundant optional chaining"
  - "Empty Cc/Bcc sections no longer render orphan headers (length checks; bcc keeps the 'bcc' in guard for the inbox union)"

patterns-established:
  - "Reply prefill pattern: setValue to/subject/body + close dialog + switch tab"

requirements-completed: ["MAIL-01", "MAIL-02", "MAIL-03", "MAIL-04"]

# Metrics
duration: 12min
completed: 2026-08-26
---

# Phase 4 Plan 02: Complete Mail Experience Summary

**Compose/reply/paginated mail end-to-end: 3x duplicated pickers replaced by UserSearchPicker with zod validation, reply prefill switching tabs, HTML-escaped body view, server pagination wired through useMail, and outbox multi-recipient display**

## Performance

- **Duration:** 12 min
- **Started:** 2026-08-26T05:50:01Z
- **Completed:** 2026-08-26T06:01:41Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- `useMail` accepts `{ keyword?, page? = 1, limit? = 10 }`; inbox/sent queryKeys carry page/limit and forward them to the paginated services; `send.onSuccess` invalidates both `["sent"]` and `["inbox"]`
- Mail compose form: ~180 lines of triplicated chip+dropdown picker markup deleted, replaced by `<UserSearchPicker>` ×3 under `<Controller>`; zod validation (`to` min 1 recipient, `subject`/`body` min 1 char) surfaces via `<FieldError>`
- Reply button in detail dialog prefills To with the sender, prefixes subject with `Re:` when absent, quotes body line-by-line with `> `, closes the dialog and switches to Compose (controlled Tabs); successful send lands on the Sent tab
- Mail body in detail dialog is HTML-escaped (`&`, `<`, `>`, `"`, `'`) and renders with `whitespace-pre-wrap`
- BCC section label fixed ("CC" → "Bcc"); outbox To column shows first recipient plus "and N other(s)"

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire pagination + fix invalidation in hooks/use-mail.ts** - `f0f5aee` (feat)
2. **Task 2: Replace inline pickers + add validation + reply + sanitize** - `2247b6a` (feat)
3. **Task 3: Multi-recipient display in outbox column** - `cd3499e` (feat)

Pre-task repair commit (belongs to prior plan):
0. **Missed two-arg z.record fix from 04-01** - `5a9de4d` (fix)

## Files Created/Modified
- `hooks/use-mail.ts` - Object-props signature, page/limit in queryKeys/queryFns, dual invalidation, ≥2-char search gating
- `app/(main)/mail/page.tsx` - 488 → 373 lines: pickers replaced, schema validated, reply flow, escapeHtml, controlled tabs, Bcc label fix, local MailUser type removed
- `features/mail/outbox-column.tsx` - accessorKey "to", first-recipient cell + "and N other(s)" suffix
- `features/program/session/session-editor.tsx` - `useMail({ keyword })` call-site fix + MailUser import redirected to `@/services/mail.api`

## Decisions Made
- Updated session-editor's `useMail(userKeyWord)` string call within Task 1's commit so every intermediate commit typechecks; its stale page-local `MailUser` import followed in Task 2 exactly as 04-01's summary anticipated
- Reply handler early-returns on `!selectedMail` rather than replicating the plan snippet's optional-chaining that could interpolate "undefined" into the quote

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] session-editor.tsx call/import fixes**
- **Found during:** Task 1 and Task 2
- **Issue:** session-editor called `useMail(userKeyWord)` with a bare string (TS2559 under the new signature) and imported `MailUser` from the mail page, which Task 2 deletes
- **Fix:** `useMail({ keyword: userKeyWord })` in the Task 1 commit; import moved to `@/services/mail.api` in the Task 2 commit
- **Files modified:** features/program/session/session-editor.tsx
- **Verification:** `pnpm exec tsc --noEmit` clean after each task
- **Committed in:** f0f5aee / 2247b6a

**2. [Rule 1 - Bug] Empty Cc/Bcc sections rendered orphan headers**
- **Found during:** Task 2 rewrite
- **Issue:** `selectedMail?.cc && ...` is truthy for empty arrays, showing a "Cc"/"Bcc" header above an empty grid; the bcc branch also needed the `"bcc" in` guard kept for the InboxMailT union member
- **Fix:** length-based conditions (`cc.length > 0`; `"bcc" in selectedMail && selectedMail.bcc.length > 0`)
- **Files modified:** app/(main)/mail/page.tsx
- **Verification:** tsc clean; visual logic reviewed
- **Committed in:** 2247b6a

---

**Total deviations:** 2 auto-fixed (1 Rule 3 blocking, 1 Rule 1 bug) + 1 pre-task repair commit (`5a9de4d`) restoring a fix documented in 04-01's summary but missing from git history
**Impact on plan:** All fixes required for compile correctness or were anticipated by prior-plan documentation. No scope creep.

## Issues Encountered
- Working tree arrived with an uncommitted `services/leave.api.ts` change (two-arg `z.record`) that 04-01's summary claimed was committed but never was — committed separately as `5a9de4d` before Task 1 so task commits stay atomic
- Unrelated pre-existing working-tree state left untouched: `.planning/STATE.md` modified (orchestrator-owned) and `docker-compose.dev.yml` deleted (not part of this plan)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Ready for 04-03 (mail pagination UI): `useMail` now exposes page/limit params and normalized `{ items, page, totalPages }` data; the data tables still consume `.items` only — wiring pager state into `useMail` remains for 04-03
- MAIL-01..04 acceptance paths implemented; final human verification of compose/reply flows pending phase verifier
- `features/program/session/session-editor.tsx` still uses its own inline speaker picker — a future cleanup candidate for UserSearchPicker reuse (out of this plan's scope)

---
*Phase: 04-staff-self-service-mail-leave*
*Completed: 2026-08-26*

## Self-Check: PASSED

All 3 task commits verified in git log (f0f5aee, 2247b6a, cd3499e) plus pre-task repair 5a9de4d; all modified files exist on disk; `pnpm lint` exit 0 (0 errors, 52 baseline warnings); `pnpm build` completes with no type errors; tests match baseline (2 known session.test.ts failures, 340 passed); "outbox-colunm" grep returns zero results.
