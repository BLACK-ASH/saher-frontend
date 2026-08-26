---
phase: 04-staff-self-service-mail-leave
fixed_at: 2026-08-26T13:05:00Z
review_path: .planning/phases/04-staff-self-service-mail-leave/04-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 04: Code Review Fix Report

**Fixed at:** 2026-08-26T13:05:00Z
**Source review:** .planning/phases/04-staff-self-service-mail-leave/04-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6 (CR-01, CR-02, WR-01, WR-02, WR-03, WR-04)
- Fixed: 6
- Skipped: 0
- Out of scope (left open): WR-05…WR-09, IN-01…IN-09

## Fixed Issues

### CR-01: Leave proof upload always throws — reads nonexistent `res.file`

**Files modified:** `components/image-upload.tsx`, `features/leave/apply-leave-dialog.tsx`, `features/attendance/attendance-correction.tsx`, `features/program/participant/update-participant.tsx`, `app/(main)/program/sessions/review/[id]/page.tsx`
**Commit:** fb72b19
**Applied fix:** Verified backend ground truth first (`uploadImageController` returns `data: { id, fileName, url, size, width?, height?, mimetype }`). `image-upload.tsx` now calls `apiFetch<UploadedImage>` and forwards `res.data`; the `@ts-expect-error` (and the `any` prop) are gone. All 8 consumers audited: apply-leave-dialog now uses `file.url`; attendance-correction had the same latent `data.file.*` bug and was migrated to `data.id`/`data.url`; update-participant's preview reads `?.url` and its document tiles map `alt: data.fileName`; the session-review page maps uploads into its `{id, src, alt}` state. profile-info, document-upload, basic-details, add-participant already consumed `id`/`url` and needed no change.
**Status:** fixed — requires human verification (runtime upload flow not covered by automated tests)

### CR-02: Editing a leave application silently ignores the selected leave type

**Files modified:** `features/leave/apply-leave-dialog.tsx`, `services/leave.api.ts`
**Commit:** 8229751
**Applied fix:** Backend check showed an asymmetry the review suggestion missed: create resolves `LeaveType.findOne({ code: payload.type })` but **update** resolves `LeaveType.findOne({ _id: payload.leaveCode })`. Sending `leaveCode: values.type` (`"CL"`) would have 404'd. The dialog now resolves the selected code to its `_id` via `leaveTypes.data` before mutating, sends `{ startDate, endDate, reason, proof, leaveCode }` (no `type`), and guards with an explicit toast if the type list hasn't loaded instead of silently keeping the old type. `UpdateLeavePayload` drops inherited `type` and adds `leaveCode?: string`.
**Status:** fixed — requires human verification (edit flow against live backend)

### WR-01: Service layer double-toasts and unreachable failure branches

**Files modified:** `services/leave.api.ts`, `features/leave/apply-leave-dialog.tsx`
**Commit:** d3767c8
**Applied fix:** Ground truth verified: `lib/api-wrapper.ts` still toasts every failure (line 122) and throws on `!success`, so the warning stands. Removed all nine toast/error branches plus the sonner import from `services/leave.api.ts` (pure fetch+types again); dialogs keep their single success toasts. `handleError` now only routes overlap errors inline — generic failures arrive pre-toasted by apiFetch.
**Status:** fixed

### WR-02: Client/server validation drift on apply-leave form

**Files modified:** `services/leave.api.ts`
**Commit:** fc8fb4d
**Applied fix:** `applyLeaveSchema` aligned with `leaveApplicationSchemaBase`: reason `.trim().min(5).max(400)` and `endDate >= startDate` refine targeting `endDate`. Date-only strings compare correctly lexicographically.
**Status:** fixed

### WR-03: Date-only values submitted without the mandated `+05:30` offset

**Files modified:** `features/leave/apply-leave-dialog.tsx`
**Commit:** 0e9e9b5
**Applied fix:** Both apply and edit submissions now route dates through the previously unused `dateInputToIso()` (`YYYY-MM-DD` → `YYYY-MM-DDT00:00:00+05:30`) before mutating.
**Status:** fixed

### WR-04: Mail pagination can never advance past page 1

**Files modified:** `app/(main)/mail/page.tsx`, `features/mail/data-table.tsx`
**Commit:** 5c8b400
**Applied fix:** Confirmed the hook already accepted `{page}` and the backend pages server-side with `meta.total`. Mail page owns `page` state passed to `useMail({ page })` and to both tables' `PaginationFooter` (`totalPages` from normalized meta); tab switch resets to page 1. Dropped the client-side `getPaginationRowModel` so exactly one pager remains.
**Status:** fixed

## Skipped Issues

None — all six in-scope findings were fixed.

## Verification

- `pnpm lint` → 0 errors (51 warnings; the 7 in touched files are byte-for-byte the pre-fix baseline set: react-compiler incompatible-library notices, unused `loading`, exhaustive-deps, stale eslint-disable directive)
- `pnpm vitest run` → 342 tests: 340 passed, 2 failed — exactly the two known `tests/session.test.ts` `performLogoutCleanup` baseline failures
- `pnpm build` → passes (all routes compiled)

---

_Fixed: 2026-08-26T13:05:00Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 1_
