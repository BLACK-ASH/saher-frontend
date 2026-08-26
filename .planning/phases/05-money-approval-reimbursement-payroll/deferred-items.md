# Deferred Items — Phase 05

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Pre-existing test failure | `tests/session.test.ts` — "calls cancelQueries, clear, and redirects to /" and "can be called repeatedly without guard interference" fail (location.assign spy: 0 calls). Verified failing at base commit 0c26740 before any 05-01 work; unrelated to reimbursement data layer. | Out of scope — pre-existing | 2026-08-26 (05-01) |
