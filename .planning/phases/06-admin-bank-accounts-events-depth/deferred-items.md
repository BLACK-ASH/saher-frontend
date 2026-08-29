# Deferred Items — Phase 06 (plan 01 execution)

Items discovered during execution that are OUT OF SCOPE for the current plan and
deliberately not fixed. Logged per the executor scope-boundary rule.

| Category | Item | Status | Note |
|----------|------|--------|------|
| pre-existing test failure | `tests/session.test.ts` — `performLogoutCleanup` "calls cancelQueries, clear, and redirects to /" and "can be called repeatedly without guard interference" fail (2/2) | Deferred | Unrelated to plan 06-01; touches `lib/session.ts` logout cleanup. Fails on the base before this plan's commits. Success criteria "full suite still green" counted on it — flagged so the verifier does not attribute it to plan 06-01. |
