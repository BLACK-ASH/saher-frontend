---
fix_state_version: 1.0
milestone: fix
total_phases: 10
completed_phases: 1
last_updated: "2026-09-03T17:05:00.000Z"
---

# FIX Stabilization — Current State

## Position

**Active phase:** None (Phase 0 done; Phase 1 next)

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

## Next: Phase 1 — Soft Delete & Resource Lifecycle

Plan: `.planning/phases/fix-01-soft-delete/01-01-PLAN.md`
