---
fix_state_version: 1.0
milestone: fix
total_phases: 10
completed_phases: 8
last_updated: "2026-09-05T00:00:00.000Z"
---

# FIX Stabilization — Current State

## Position

**Active phase:** Phase 9 — Full Regression Testing (awaiting execution)

## Phase 0 — Authentication & Authorization ✅ COMPLETE

**Root causes:**
1. AUTH-01: Login enforcement was correct, but onboarding sent no verification link and `verify-email/request` is auth-gated → unverified users deadlocked.
2. AUTH-02: `protectedRoute` and `renewToken` never checked `User.isActive`; admin delete never flushed the user's Redis sessions.

**Changes (backend commit `aaec417`):**
- `src/admin/account/controller.ts` — onboarding sends one-time verify-email token (hashed, 15-min TTL) with URL.
- `src/libs/mail/templates/onboard-mail.ts` — "Verify Email" CTA + fallback URL + expiry note.
- `src/admin/user/controller.ts` — `userDeleteController` calls `revokeUserSessions(id)`.
- `src/auth/_utils/token.ts` — `renewToken` checks `isActive` before minting tokens.
- `src/libs/middleware/protected-route.ts` — rejects inactive users on every protected request.
- `tests/auth/auth.test.ts` — test 16 expects `401 Account Has Been Deactivated.`.

**Verification:**
- `pnpm typecheck` PASS
- `pnpm lint` 0 errors (45 pre-existing warnings)
- `pnpm test` 257/257 PASS
- frontend `pnpm build` PASS

## Phase 1 — Soft Delete & Resource Lifecycle ✅ COMPLETE

**Root causes:**
1. React Query hooks (`use-programs`, `use-sessions`, `use-workshops`) dropped `isDeleted` → Active/Deleted tabs shared one React Query key → deleted records appeared in both lists.
2. Backend `program.controller.ts` parsed `isDeleted` with truthiness (`|| false`) inconsistent with session/workshop controllers (`=== 'true'` pattern).

**Changes:**
- Frontend: `hooks/use-programs.ts`, `hooks/use-sessions.ts`, `hooks/use-workshops.ts` — now forward `isDeleted` filter so the Active/Deleted tabs request distinct data
- Backend: `src/events/program/program.controller.ts` — `getPrograms` now parses `isDeleted` with `=== 'true'` instead of truthiness `|| false`.

**Verification:**
- Frontend `pnpm lint` 0 errors, `pnpm build` PASS, `pnpm test` 428/428 PASS
- Backend `pnpm lint` 0 errors, `pnpm test` 257/257 PASS, `pnpm typecheck` PASS
- No endpoint signatures changed → OpenAPI/docs and graphify update unaffected.

## Phase 2 — Image/Upload `src` contract & Media ObjectId ✅ COMPLETE

**Goal:** Align every upload consumer with the backend `{ id, alt, src }` contract. The backend stores/needs the Media ObjectId (`id`); the frontend previews use the `src` URL, never `id`.

**Backend changes (commit `55334aa` on `fix/module-fixes`):**
- `src/upload/image/image.controller.ts` — single + bulk now return `{ id, fileName, alt, src, size, mimetype, width?, height? }`; `url` removed.
- `src/upload/document/document.controller.ts` — single + bulk now return `{ id, fileName, alt, src, size, mimetype }`; `url` removed.
- `openapi/paths/upload/*.yaml` — all 4 updated: `url` → `src`, added `alt`.
- `tests/upload/image.test.ts`, `tests/upload/document.test.ts` — updated to assert `src`/`alt`.

**Frontend changes (commit `8f4237a` on `dev`):**
- `components/image-upload.tsx` — `UploadedImage` type no longer references `url`; now `{ id, alt, src }`.
- `features/leave/apply-leave-dialog.tsx` — proof stores Media ObjectId (`file.id`).
- `features/attendance/attendance-correction.tsx` — proof stores `id`, preview `upload` uses `src`.
- `features/register/basic-details.tsx`, `features/register/document-upload.tsx` — `user.image`/`account.*` store `id`, `uploaded.*` preview uses `src`.
- `features/program/participant/add-participant.tsx`, `update-participant.tsx` — doc preview uses `src`.
- `app/(main)/program/sessions/review/[id]/page.tsx` — gallery preview uses `src`.
- `features/profile/profile-info.tsx` — already used `id`+`src`, no change.

**Verification:**
- Backend: `pnpm tests` 257/257 PASS, `docs:lint` valid, typecheck clean.
- Frontend: `pnpm lint` 0 errors/58 warnings, `pnpm build` PASS.

**Unrelated backend edits** (get-bill schema + search-bill controller) committed separately as `5af6bd2` to keep them out of the Phase 2 commit.

## Phase 3 — Form Validation (fix-03) ✅ COMPLETE

**Goal:** Audit every major form against its backend schema and close gaps.

**Frontend changes (commit pending, on `dev`):**
- `features/attendance/attendance-correction.tsx` — message max `.max(100)` → `.max(300)` (+ counter).
- `features/attendance-correction/attendance-correction-view.tsx` — handle/submit status enum drops `"pending"` (now `['reject','on-hold','approve']`, matching backend); reset normalizes pending → on-hold.

**Docs:**
- `VALIDATION-AUDIT.md` — 13-form audit, 14 GAP rows, 5 HIGH + 2 MEDIUM.
- `VALIDATION-BACKEND-GAPS.md` — bill amount/advance `.positive()` (fix-04), leave type `.min(1)` (fix-06) tracked.

**Verification:** lint 0 errors, build PASS, test 428/428 PASS.

## Deployment status (Phase 3)

- Frontend: pushed to `dev` (phase commits follow once committed).
- Backend: pushed to `dev` (`b89b357..5af6bd2`, merged `fix/module-fixes`).
- CI test deploys triggered on `dev` push for both repos.

## Phase 4 — Bill Management (fix-04) ✅ COMPLETE

**Root causes of the live bill bugs:**
1. BILL-01 (bug 2): `my-bills/page.tsx` passed `onView={() => {}}` and never
   passed `onWithdraw` → the View/Withdraw buttons were no-ops.
2. Bugs 1 & 3 (receipts): the backend stored `images: [Media-id]` but the
   response schema only had a dead singular `image` field and stripped
   `images` → `bill.image` was always `undefined`, so receipts never rendered
   in the detail dialog nor prefilled in the edit dialog.
3. BILL-02: backend `bill/schema.ts` had no positive constraint on `amount`.

**Changes:**
- Backend — `get-bill.schema.ts` replaces `image` with `images: [{id,src,alt}]`;
  `my-bills`/`search-bill`/`recycle-bill` controllers `.populate('images')`;
  `bill/schema.ts` `amount` → `.positive()`; `bill.model.ts` `amount` `min:1`
  (advance stays `min:0` — user bills legitimately carry `advance: 0`).
- Frontend — `reimbursement.api.ts` `billSchema.images` array;
  `bill-detail-dialog` renders receipts; `edit-bill-dialog` prefills from
  `bill.images` ids; `my-bills/page.tsx` wires `onView` + `onWithdraw`
  (AlertDialog confirm) + `BillDetailDialog`; test fixture updated.

**Not a bug:** "admin panel won't open" — management page correctly requires
`preReimbursement:read` (admin/manager only); a `user`/`intern` account is
redirected to `/forbidden`. Role/config matter, not code.

**Verification:**
- Backend: typecheck PASS, test 257/257 PASS, lint 0 errors.
- Frontend: lint 0 errors, test 428/428 PASS, build PASS.

**Docs:** `.planning/phases/fix-04-bill-management/04-01-SUMMARY.md`.

## Phase 5 — User Registration & Profile (fix-05) ✅ COMPLETE

**Root causes:**
1. USER-01: `RegisterUserForm` was missing the `accountNumber` default in `defaultValues`; bank name could carry a numeric value.
2. USER-02: `AccountT` (frontend) typed aadhar/pan/resume as REQUIRED objects while backend `accountSchemaFinal` declared them non-nullish — when a user's KYC Media ref is missing/deleted, the backend `.parse()` threw (500) or the frontend rendered `undefined.src` → profile-view crash for any user.

**Changes:**
- Backend — `accountSchemaFinal` aadhar/pan/resume → `imageType.nullish()`; `userGetController` falls back to `getUser(id)` (no 404) when no Account doc; `getAllSessionController` marks `current` via cookie.
- Frontend — `use-profile.ts` AccountT aadhar/pan/resume nullable + `bank` nullable; `features/profile/profile.tsx` null-guards Documents/Bank; manager `users/[id]/page.tsx` same guards; `user-register.tsx` `accountNumber: ""` default; `services/auth.api.ts` session shape (`sessionId`/`updatedAt`, `revoke` GET); `lib/date.ts` `dateToIstDateOnly` accepts strings.

**Verification:** backend 258/258, frontend 430/430, lint 0 errors, typecheck + build clean.

## Phase 6 — Notice & Leave (fix-06) ✅ COMPLETE

**Root causes:** notice `_id` vs `id` drift; leave proof stored the URL instead of the Media ObjectId; leave GET controllers lacked `.populate('proof')`.

**Changes:**
- Frontend — noticeboard components + `services/notice.api.ts` use `id`; leave proof: input sends `file.id`, response type is the populated `{id,src,alt}`; `apply-leave-dialog`/`leave-details-dialog` null-safe on `proof`.
- Backend — all leave GET/update/review controllers `.populate('proof')`; `getLeaveApplicationSchema.proof` → `.nullish()` (populate yields `null` for missing ref — legacy rows must not 500).

**Verification:** backend leave suite + full 258/258, frontend 430/430.

## Phase 7 — Attendance Correction (fix-07) ✅ COMPLETE

**Root causes:** `combineDateAndTimeToIso` produced unparseable datetimes (non-normalized date); message min/max mismatch; create endpoint returned unpopulated proof.

**Changes:** `lib/date.ts` `toDateOnly` normalizes the date + `+05:30` offset, `dateToIstDateOnly` accepts `Date | string`; message min 3 / max 300 with counter; backend `create-correction.ts` `.populate('proof')`.

**Verification:** backend 258/258, frontend 430/430, lint 0 errors.

## Phase 8 — Notification UI (fix-08) ✅ COMPLETE

**Root causes:** frontend had only a static card (no persistent bell, no read/unread distinction, no mark-seen); `getUnseenCount` read `data.count` but the backend puts count in `meta.count`.

**Changes:** `notification.api.ts` `getUnseenCount` reads `res.meta.count` + `markNotificationSeen` (PATCH `/:id`); `use-notification.ts` exposes `list`/`unseen`/`markSeen`; new `notification-bell.tsx` with unread badge in `sidebar-header`; `notification-box.tsx` read/unread styling + error/loading/empty states + click-to-mark-seen.

**Verification:** backend 258/258, frontend 430/430, lint 0 errors, build clean.
