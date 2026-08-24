# Phase 1: Quality Gates & Test Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-24
**Phase:** 1-Quality Gates & Test Infrastructure
**Areas discussed:** CI enforcement, Starter test scope, Coverage policy (all resolved in one user response)

---

## CI enforcement

| Option | Description | Selected |
|--------|-------------|----------|
| PR workflow | Lint/typecheck/test gate pull requests into dev | |
| Deploy-job gates | Checks run as pre-steps inside Deploy Dev before docker build | |
| Both | PR gating + deploy-job gating | |
| Local-only | Scripts exist but nothing runs them in CI | |

**User's choice:** Free-text: "do what will be good and dont push anything on main branch use dev branch"
**Notes:** User delegated the choice and set a branch decree. Agent decision: gate steps inside the existing Deploy Dev job (shortest diff with real gating), with the job retargeted from main to dev — otherwise a dev-only policy would leave deploys permanently stale. No separate PR workflow until a PR flow exists.

## Starter test scope

| Option | Description | Selected |
|--------|-------------|----------|
| Samples only (throwaway) | Minimal tests just to prove SC #2–3 | |
| Samples only (reference-quality) | Required samples built as durable patterns later phases copy | ✓ |
| Seed real suites now | Also test api-wrapper refresh single-flight + register schema rules | |

**User's choice:** Delegated ("do what will be good")
**Notes:** Reference-quality samples chosen; deep suites deferred to Phase 2/7 where that code actually changes.

## Coverage policy

| Option | Description | Selected |
|--------|-------------|----------|
| Thresholds day one | Enforce coverage minimums immediately | |
| Report-only | Coverage available, no thresholds until Phase 7 | ✓ |

**User's choice:** Delegated ("do what will be good")
**Notes:** Thresholds without broad coverage = noise now; revisit at Phase 7 money/auth coverage completion.

---

## Branch policy (user decree, not agent discretion)

- Never push `main`; all work on `dev`.
- Grounding discovered during discussion: `origin/dev` is strictly ahead of `origin/main` by 19 feature commits; local `main` holds 6 unpushed planning commits. Deploy Dev workflow currently resets to `origin/main` and triggers on push to `main` — retargeting recorded as D-02 in CONTEXT.md.

## the agent's Discretion

- Exact dependency versions/pins, sample component choice, vitest setup-file organization, coverage reporter format, config file details.

## Deferred Ideas

None — discussion stayed within phase scope.
