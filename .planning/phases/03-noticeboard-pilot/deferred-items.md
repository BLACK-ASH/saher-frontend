# Phase 3 — Deferred Items (out-of-scope discoveries)

## Pre-existing test failure: tests/session.test.ts
- **Found during:** 03-01 Task 1 (RED run, 2026-08-26)
- **Detail:** `performLogoutCleanup` tests fail — `location.assign` expected to be called but receives 0 calls (2 of 7 tests in the file). Fails identically with none of plan 03-01's changes present; last touched by commit fafb9c4 ("fix: login redirect + logout redirect loop").
- **Action:** Not fixed per scope-boundary rule (unrelated to noticeboard work). Owner should audit the jsdom `window.location` mock vs. current session.ts implementation.

## Pre-existing build failure: /register prerender
- **Found during:** 03-01 final verification (`pnpm build`)
- **Detail:** "Functions cannot be passed directly to Client Components" while prerendering `/(main)/(admin)/register/page`. TypeScript compilation itself passes. Explicitly anticipated by 03-01-PLAN.md verification notes ("build may fail on pre-existing register issue, unrelated").
- **Action:** Out of scope for 03-01; should be addressed by whichever plan audits the register flow.
