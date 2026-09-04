---
fix_state_version: 1.0
milestone: fix
total_phases: 10
completed_phases: 4
last_updated: "2026-09-04T00:00:00.000Z"
---

# FIX Stabilization — Current State

## Position

**Active phase:** Phase 4 — awaiting execution

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
