# Phase 2: Shared Infrastructure & Session Reliability - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-24
**Phase:** 2-shared-infrastructure-session-reliability
**Areas discussed:** Adoption sweep, Session-death UX, IST date conventions, RBAC helper shape, Module placement, Auth test depth, Footer behavior, 3rd-party clocks

---

## Adoption sweep

| Option | Description | Selected |
|--------|-------------|----------|
| Full retrofit | Every existing date call site AND paginated list migrates within this phase | ✓ |
| Infra + partial retrofit | Utilities tested; screens migrate where cheap; rest adopt later | |
| Infra only | Building blocks only; zero changes to existing screens | |

**User's choice:** Full retrofit
**Notes:** Success criteria demand all date rendering/parsing route through the new utils.

### Regression safety (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| Test per screen | Render test for every migrated screen | |
| Gates + smoke | lint/typecheck/test + manual click-through only | |
| Tests where visible | Tests only where user-visible output changes | |

**User's choice:** Free text — "do what will be ok" → agent's discretion. Default: tests where visible, gates elsewhere.

### Pagination footer swap (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| All lists swap | Every list screen renders the shared footer, incl. TanStack tables | ✓ |
| Lists only, not tables | Plain lists adopt; table screens keep built-in controls | |
| New modules only | Footer ships tested; existing screens untouched | |

**User's choice:** All lists swap

---

## Session-death UX

| Question | Options presented | Selected |
|----------|-------------------|----------|
| Where does the user land on session death? | Return URL (`?next=`) / Plain /login | Return URL ✓ |
| What does the user see? | Single deduped toast / Silent redirect | Single toast ✓ |
| What gets cleared on death + logout? | Clear all (+cancel in-flight) / Partial clear / You decide | Clear all ✓ |
| Logout when backend call fails? | Best-effort (clear+redirect anyway) / Strict (only on confirm) | Best-effort ✓ |

**Notes:** All recommended options accepted; mechanics delegated to research/planning.

---

## IST date conventions

| Question | Options presented | Selected |
|----------|-------------------|----------|
| Display formats | 2 canonical formats / Preserve current looks / You decide | 2 formats ✓ |
| Form input strategy | Mixed native+picker, IST-bound / Native only / Picker only | Mixed, IST-bound ✓ |
| Relative times ("2h ago") | Absolute only / Relative in feed / Relative widely | Absolute only ✓ |

**Follow-up:** Libraries owning a clock (FullCalendar, react-day-picker) — "All through utils" selected over documented carve-out; fixed +05:30 config, no silent exceptions.

---

## RBAC helper shape

| Question | Options presented | Selected |
|----------|-------------------|----------|
| Where does permission knowledge live? | Frontend matrix / Server-driven (impossible: frozen backend) / Thin wrapper | Frontend matrix ✓ |
| Relationship to existing gates? | Unify everything via can() / New code only | Unify everything ✓ |
| How to resolve manager role string? | Live probe of GET /api/auth/me / Trust docs | Live probe first ✓ |

**Notes:** Resolves STATE.md MEDIUM-confidence flag with evidence during contract check.

---

## Module placement

| Question | Options presented | Selected |
|----------|-------------------|----------|
| Envelope normalization hook | Explicit lib/ factory called by services / Inside apiFetch | Explicit factory ✓ |
| Session contract packaging | Shared lib/session module used by apiFetch + logout hook / Split provider+hook | Shared module ✓ |
| IST utils vs lib/utils/time.ts | Replace time.ts outright / Split modules | Replace ✓ |

---

## Auth test depth / Footer behavior

| Question | Options presented | Selected |
|----------|-------------------|----------|
| AUTH-01 verification depth | Real-wrapper msw flows (single-flight, retry-once, death contract) / Contract unit tests only | Real-wrapper flows ✓ |
| Footer rendering | Prev/next + "Page N of M", disabled-not-hidden on bad meta / Numbered pages / + page-size selector | Prev/next + count ✓ |

---

## the agent's Discretion

- Regression-safety default for retrofit (tests-where-visible chosen as sensible default)
- Exact file names for new lib/ modules and footer component; factory signatures
- shadcn primitives backing the footer; permissions matrix internal structure
- Test case lists beyond the D-19 minimum; `next=` interaction with proxy.ts redirects

## Deferred Ideas

None — discussion stayed within phase scope. Retrofit-discovered breakage is logged (STATE.md), fixed in Phase 7 audit.
