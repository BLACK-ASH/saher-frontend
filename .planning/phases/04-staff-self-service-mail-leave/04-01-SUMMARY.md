---
phase: 04-staff-self-service-mail-leave
plan: "01"
subsystem: api
tags: [zod, mail, leave, tanstack-query, shared-components]

# Dependency graph
requires:
  - phase: 02-shared-infrastructure-session-reliability
    provides: normalizeList factory, IST date utils, apiFetch single-flight refresh
  - phase: 03-noticeboard-pilot
    provides: SLICE-CONTRACT patterns, PaginationFooter, vitest/msw test harness
provides:
  - Zod response schemas + inferred types for mail service (inboxMailSchema, outboxMailSchema, sendMailSchema, mailUserSchema)
  - Zod response schemas for leave service (leaveTypeSchema, leaveApplicationSchema, leaveBalanceSchema)
  - Correct sendMail return type matching backend data:null envelope
  - Paginated getMails/getSentMails signatures forwarding page/limit via normalizeList
  - Shared components/user-search-picker.tsx for mail compose (04-02) and Phase 5 advance bills
affects: [04-02-mail-compose-reply, 04-03-mail-pagination, phase-5-reimbursement]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "outbox schema = inbox schema .extend({ bcc }) mirroring backend InBoxMailSchema/OutBoxMailSchema"
    - "Response schemas exported alongside hand-written legacy types during migration"

key-files:
  created:
    - components/user-search-picker.tsx
  modified:
    - services/mail.api.ts
    - services/leave.api.ts
    - features/mail/column.tsx
    - features/mail/data-table.tsx
    - features/mail/outbox-column.tsx (renamed from outbox-colunm.tsx)
    - app/(main)/mail/page.tsx
    - hooks/use-mail.ts

key-decisions:
  - "Removed all four dead toast.error calls in mail service, not just the three listed — apiFetch throws on every failure path so all were unreachable dead code"
  - "selectedMail state typed as InboxMailT | OutboxMailT union with an 'in' guard on bcc instead of widening to OutboxMailT"
  - "MailDataTable props now genuinely generic over TData/TValue so inbox and outbox columns type-check"

patterns-established:
  - "UserSearchPicker: controlled chip+debounced-dropdown picker reusable across modules (multi/single via prop)"

requirements-completed: []

# Metrics
duration: 21min
completed: 2026-08-26
---

# Phase 4 Plan 01: Code Quality Foundation + Shared UserSearchPicker Summary

**Zod response schemas for mail/leave services with corrected sendMail contract, filename/import fixes, and a debounced multi/single-select UserSearchPicker ready for compose and Phase 5 reuse**

## Performance

- **Duration:** 21 min
- **Started:** 2026-08-26T05:26:34Z
- **Completed:** 2026-08-26T05:47:30Z
- **Tasks:** 4
- **Files modified:** 8 (7 modified/rewritten, 1 created)

## Accomplishments
- Mail service now exports zod schemas (`inboxMailSchema`, `outboxMailSchema`, `sendMailSchema`, `mailUserSchema`) with all types derived via `z.infer`; `sendMail` no longer falsely claims to return `MailT` (backend returns `data: null`)
- `getMails`/`getSentMails` accept `{ page, limit }`, pass them as query strings, and return `normalizeList<T>` — server pagination wired at the service layer ahead of Plan 04-03
- Leave service exports response schemas (`leaveTypeSchema`, `leaveApplicationSchema` using shared `userField`, `leaveBalanceSchema` with record balance) while keeping legacy types exported
- Dead `@tiptap/core` import removed from leave service; `outbox-colunm.tsx` renamed to `outbox-column.tsx` via git mv with import updated
- New `components/user-search-picker.tsx`: controlled chips + 300ms debounced search (fires ≥2 chars), selected-user filtering, keyboard nav (Escape/ArrowUp/ArrowDown/Enter), multi/single modes

## Task Commits

Each task was committed atomically:

1. **Task 1: zod schemas + return-type fixes in mail service** - `5a7588d` (refactor)
2. **Task 2: dead tiptap import + outbox filename typo** - `378d37d` (fix)
3. **Task 3: response zod schemas in leave service** - `8ed7d6e` (feat)
4. **Task 4: shared UserSearchPicker component** - `f368ad0` (feat)

## Files Created/Modified
- `services/mail.api.ts` - Rewritten: zod schemas, z.infer types, paginated list functions, correct sendMail envelope type
- `services/leave.api.ts` - Dead import removed; response schemas added alongside legacy types
- `features/mail/column.tsx` - `InboxMailT` column typing
- `features/mail/data-table.tsx` - Props made truly generic (`ColumnDef<TData, TValue>`)
- `features/mail/outbox-column.tsx` - Renamed from `outbox-colunm.tsx`; `OutboxMailT` typing
- `app/(main)/mail/page.tsx` - Union-typed selectedMail with `"bcc" in` guard; unwraps `normalizeList` items for tables
- `hooks/use-mail.ts` - Arrow-wrapped queryFns (TS weak-type compatibility with QueryFunctionContext)
- `components/user-search-picker.tsx` - NEW shared picker component

## Decisions Made
- Removed the fourth dead `toast.error` in `sendMail` too (plan listed three) — identical unreachable code
- Typed the detail-dialog selection as a union rather than forcing `OutboxMailT`, keeping inbox rows honest
- Left `features/program/session/session-editor.tsx` importing the page-local `MailUser` untouched — Plan 04-02 replaces the compose picker and will consolidate that import

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Arrow-wrapped queryFns in hooks/use-mail.ts**
- **Found during:** Task 1
- **Issue:** `queryFn: getMails` fails TS check — `QueryFunctionContext` has no properties in common with the `{ page?, limit? }` weak type
- **Fix:** `queryFn: () => getMails()` / `() => getSentMails()` (defaults apply)
- **Files modified:** hooks/use-mail.ts
- **Verification:** `pnpm typecheck` clean
- **Committed in:** 5a7588d (Task 1 commit)

**2. [Rule 1 - Bug] Detail dialog union typing + generic DataTable**
- **Found during:** Task 1
- **Issue:** Inbox rows (`InboxMailT`) assigned to `OutboxMailT | null` state; `outBoxColumns` incompatible with hardcoded `InboxMailT` table props
- **Fix:** `selectedMail: InboxMailT | OutboxMailT | null` with `"bcc" in selectedMail` guard; `MailDataTable` props parameterized by its existing generics
- **Files modified:** app/(main)/mail/page.tsx, features/mail/data-table.tsx
- **Verification:** `pnpm build` passes
- **Committed in:** 5a7588d (Task 1 commit)

**3. [Rule 1 - Bug] Zod v4 `z.record` requires explicit key schema**
- **Found during:** Task 3
- **Issue:** `z.record(z.object({...}))` is a build error under zod ^4.3.6
- **Fix:** `z.record(z.string(), z.object({ used: z.number(), remaining: z.number() }))`
- **Files modified:** services/leave.api.ts
- **Verification:** `pnpm build` passes
- **Committed in:** f368ad0's parent scope — included in Task 3 file, committed with Task 4 window (see 8ed7d6e content)

**4. [Rule 1 - Bug] setState-in-effect lint error in UserSearchPicker**
- **Found during:** Task 4
- **Issue:** `useEffect(() => setHighlighted(0), [keyword])` trips react-hooks cascading-render rule (error severity)
- **Fix:** Reset highlight inside `handleInputChange`; dropped the effect
- **Files modified:** components/user-search-picker.tsx
- **Verification:** `pnpm lint` 0 errors
- **Committed in:** f368ad0 (Task 4 commit)

---

**Total deviations:** 4 auto-fixed (4 × Rules 1–3; no architectural changes)
**Impact on plan:** All fixes required for compile/lint compliance with the new service contracts. No scope creep.

## Issues Encountered
None beyond the deviations above. Note: stale `.next/types/validator.ts` references deleted phase-3 noticeboard routes caused false `pnpm typecheck` errors until `pnpm build` regenerated `.next` — not a code issue.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Ready for 04-02 (mail compose/reply/validation): `sendMailSchema` is the compose-form resolver source; `UserSearchPicker` drops into the To/CC/BCC fields
- Ready for 04-03 (mail pagination): service layer already forwards page/limit and returns normalized lists; hook still fetches defaults
- Legacy `LeaveT`/`LeaveTypeT`/`LeaveBalanceT` types intentionally retained for existing hooks/features

---
*Phase: 04-staff-self-service-mail-leave*
*Completed: 2026-08-26*

## Self-Check: PASSED

All 4 task commits verified in git log; created files exist on disk; typo filename removed; no unexpected untracked files. Verification: pnpm lint exit 0 (0 errors, 52 baseline warnings), pnpm build passes, tests match baseline (only the 2 known session.test.ts failures).
