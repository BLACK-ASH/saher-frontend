---
fix_state_version: 1.0
milestone: fix
total_phases: 10
completed_phases: 2
last_updated: "2026-09-03T17:50:00.000Z"
---

# FIX Stabilization — Current State

## Position

**Active phase:** Phase 2 — Soft Delete & Resource Lifecycle

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

## Phase 2 — Soft Delete & Resource Lifecycle ⏳ IN PROGRESS

**Root cause:** React Query list hooks for Programs, Sessions, and Workshops accept `isDeleted` from tab components but never forward it to the backend list query, so Active and Deleted tabs collapse onto one identical React Query cache key and the backend filter is never sent. The backend is correct (soft delete via `isDeleted` flag), but the frontend never sends the filter.

**Changes planned:** 
- Hooks: Forward `isDeleted` into `createResourceListHook` params (already committed in `a68efc8`)
- Backend: Consistency hardening already applied

**Next steps:** Execute Phase 2 plan per `fix-01-soft-delete/01-01-PLAN.md`