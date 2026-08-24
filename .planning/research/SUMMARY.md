# Project Research Summary

**Project:** Saher Frontend Completion
**Domain:** Org-management / HRMS-lite internal tool frontend (Next.js 16 App Router over a canonical NestJS cookie-session backend)
**Researched:** 2026-08-24
**Confidence:** HIGH (all four research files independently HIGH; codebase-anchored, live-verified)

## Executive Summary

This is not greenfield product work. Saher's backend is deployed and canonical ("backend changes out of scope"), the frontend architecture already exists and works (thin routes → feature slices → hooks → zod-validated services → single apiFetch gateway), and the tech stack is locked and verified current as of Aug 2026. Experts build this kind of completion milestone by resisting two temptations: building UI for endpoints that don't exist (the #1 timeline killer — hence explicit anti-feature lists per domain), and abstracting seven structurally different domains (reimbursement lifecycle, events 4-level nesting, mail dual-scope, flat noticeboard) into one generic CRUD engine. The recommended approach is a written **Slice Contract** enforced by one hand-built pilot domain (noticeboard), plus exactly four pieces of new shared infrastructure: an envelope-normalization list factory (`lib/api-list.ts`), IST-safe datetime utils, a centralized session-death handler in the provider, and a pagination-footer guard. One runtime dependency is added (`@date-fns/tz`, ~1.2 kB — or zero deps if bare `Intl` + fixed `+05:30` constants suffice; see Gaps); the rest is test infrastructure (vitest 4 + Testing Library 16 + msw 2) that currently doesn't exist at all.

The dominant risks are silent-corruption bugs in money and date handling, not missing features. The five critical pitfalls — browser-timezone day windows corrupting IST boundaries, double-submitted/optimistically-corrupted money mutations, broken session-death/logout paths, response-envelope drift (`data: null` crashes, dual pagination field names), and cross-entity cache-invalidation blind spots — are all *latent*: they pass smoke tests on the developer's IST laptop and detonate in production. Every one has a prevention strategy that lands in the foundation phases and becomes acceptance criteria for the money modules. Mitigation is structural: gates and tests before mass feature work, a cheap pilot domain before the fleet, money flows with the strictest rules (no optimism, `isPending`-gated buttons, server-canonical balances), and module-by-module audit-and-fix of existing code only after the target utilities exist.

## Key Findings

### Recommended Stack

Full detail in [STACK.md](./STACK.md). The stack is **LOCKED and verified current — keep everything installed.** Additions are minimal and deliberate:

**Core technologies (no action):**
- Next.js 16 + React 19 + Tailwind v4 + shadcn/ui — locked framework, patch-bump opportunistically
- TanStack Query ^5 — all server state; no Redux/Zustand ever (zero cross-page client state exists)
- react-hook-form + @hookform/resolvers ^5 + zod ^4 — verified compatible combo
- TanStack Table **v8 for this entire milestone** — v9 exists but migrating mid-sprint violates audit-and-fix philosophy; never mix v8+v9 APIs; translate v9 doc snippets mechanically

**Add:**
- `@date-fns/tz` ^1.5 (~1.2 kB) — the only runtime addition; IST-correct date building/comparison regardless of device timezone
- Test infra (all dev): vitest 4 + @vitejs/plugin-react + jsdom + Testing Library 16 + user-event + jest-dom + **msw 2** (already allow-listed in pnpm-workspace.yaml, just install); configure per the official Next.js Vitest guide
- shadcn components via CLI as needed: `field`, `empty`, `item`, `button-group`, `input-group`, `spinner`, `pagination`, `combobox`, `alert-dialog` — map 1:1 onto module domains

**Never:** client-side money math (backend canonical, `Intl.NumberFormat("en-IN", {currency:"INR"})` display-only), `toISOString()` for payloads (emits UTC, violates `+05:30` contract), Temporal API (Safari gap), `date-fns-tz` in new code, optimism on money mutations.

**Hygiene (audit phase):** move `react-hook-form` devDependencies→dependencies; move/drop `shadcn` CLI dep; remove unused `jwt-decode`.

### Expected Features

Full detail in [FEATURES.md](./FEATURES.md). Every feature anchors to a real backend route; features the backend can't serve are anti-features, not backlogs.

**Must have (table stakes, P1):**
- **Reimbursement full loop** — submit bill w/ receipts → my bills/status → handle queue (approve/reject/hold) → settle → balance enquiry + advance-bill-for-user, recycle bin, audit log. The org's money pipeline and the pattern-setting domain.
- **Leave complete** — types visible → apply w/ proof doc → my applications → review queue → balances beside the form.
- **Payroll admin** — records list, per-user history, installment recording, manual cron trigger. ⚠️ **All payroll routes are admin-only — do NOT build employee payslip screens; they'd 403 their audience.**
- **Mail** — inbox, read, compose via user picker, outbox. Three endpoints; scope discipline makes it 2 days instead of 2 weeks.
- **Noticeboard** — feed + create/edit + trash/restore. Cheapest win, high staff visibility.
- **Bank/accounts admin** — atomic onboarding wizard (User+Account+Bank in one call → one guided form), account edit, bank detail CRUD, user soft-delete/restore.
- **Events depth** — program→workshop→session→participant CRUD, bulk session-attendance grid, reminder button, export via notification flow. Most routes, highest complexity.
- **Cross-cutting** — trash pattern everywhere, notification actions rendering everywhere, IST utilities tested, RBAC-gated affordances.

**Should have (v1.x differentiators):** bill lifecycle timeline, payroll anomaly highlighting vs previous run, mail reply prefill, attendance-percentage rollups.

**Defer to v2+ (all blocked by missing backend endpoints):** employee self-service payslips, statutory compliance surfaces, OCR receipt scanning, approval-workflow builders, mail folders/read-state, event RSVP/public pages, bulk employee import.

### Architecture Approach

Full detail in [ARCHITECTURE.md](./ARCHITECTURE.md). The architecture exists with a strictly downward import graph; the work is landing minimal shared infrastructure so seven new domains slot in identically **without copy-paste drift or a premature generic CRUD framework**. Seven hand-written slices following a written Slice Contract beat one configuration-soup engine — the domains differ exactly where it matters (dual-schema money lifecycle vs 4-level nesting vs dual read scopes).

**Major components (new shared infrastructure ★):**
1. **`lib/api-list.ts` (★)** — envelope-normalization factory: zod-parses every list response, unifies `total` vs `totalPages` meta spellings, makes declared-but-dead zod schemas load-bearing. Single-object endpoints keep calling `apiFetch` directly.
2. **IST datetime utils (★ extend `lib/utils/time.ts`)** — display formatters with `timeZone: "Asia/Kolkata"`, `+05:30` offset ISO builders, datetime-local round-trips. Delete naive browser-local calls.
3. **Session-death central handler (★)** — provider `QueryCache.onError` reacts once to the `"Unauthorized"` sentinel: clear cache, hard redirect `/login`. Kills toast storms and refetch loops.
4. **Slice Contract** — page renders one component; all data via `hooks/use-<domain>.ts`; queryKey `[domain, scope?, ...params]`; mutations invalidate domain prefix; apiFetch owns toasts (components use onError for side-effects only); trash = `isDeleted` scope + restore mutation.
5. **Rule-of-three promotion** — write inline first, extract trash-tabs/pagination footer/status badge to `components/shared/` on second concrete use. Never pre-extract.

### Critical Pitfalls

Full detail in [PITFALLS.md](./PITFALLS.md). Top five, all verified against live code:

1. **IST day-window off-by-one** — zero IST handling exists today; any non-IST device computes wrong day strings for attendance/payroll/date filters. Fix: one shared time module, explicit `+05:30` offset construction (never `toISOString()` for ranges), `Intl` display, TZ-matrix tests. Must land **before** the first money/date module.
2. **Double-submits & lost optimistic state in money flows** — settle/approve/pay-installment are non-idempotent. Rule: **no optimism for money mutations**; buttons gated by mutation `isPending`; invalidate instead. Established in reimbursement, copied into payroll, encoded as acceptance criteria.
3. **Session-death gaps** — refresh succeeds then retry 401s → nothing logs out; logout uses buggy `removeQueries` → refetch storm. Fix centrally in provider + fix logout ordering (cancel → clear → navigate); write the two highest-value tests first (single-flight refresh, redirect-once).
4. **Envelope drift** — `data` can be null; pagination uses two field names; three files have unsafe `?.meta!.total <` guards. Fix: normalization factory, `.nullable()` defaults, pagination disabled until meta exists.
5. **Cache-invalidation blind spots** — settling a bill also changes balance/dashboard/detail/notification views. Fix: stable key roots + per-domain invalidation map co-located in each hook; accept over-refetching for correctness.

Runners-up worth roadmap slots: RBAC affordance gaps (a `can()` helper fed by `/auth/me`; enumerate admin-only endpoints from OpenAPI *before* building each module), schema/payload drift (one input schema per resource serving both form resolver and service contract), export-job UX (trigger → ack toast → notification link surfaces; disable button while pending), error double-handling (apiFetch owns toasts; grep gate on new `toast.error` in onError).

## Implications for Roadmap

Based on combined research, suggested phase structure (7 phases; names are slots, renumber freely). The architecture research's build order and the pitfalls' phase mapping converge on this sequence almost exactly.

### Phase 1: Quality Gates + Test Infrastructure
**Rationale:** Gates must exist *before* mass changes or regressions hide in lint noise; zero test infra conflicts with the daily-driver reliability goal.
**Delivers:** CI blocking (lint, tsc, vitest); vitest+RTL+jsdom+MSW installed and wired to intercept at the `apiFetch` boundary; package.json hygiene fixes.
**Addresses:** PROJECT.md test-setup requirement.
**Avoids:** everything downstream shipping unverified.

### Phase 2: Shared Infrastructure (incl. critical auth/session fixes)
**Rationale:** These are the load-bearing, highest-fan-out modules — retrofitting 25 fresh endpoints onto the factory costs more than writing them onto it. This phase absorbs the *critical* part of the auth audit (session death, logout ordering) that PITFALLS insists comes before any new module piles mutations onto the broken death path.
**Delivers:** ① IST time utils ② `lib/api-list.ts` factory ③ provider session-death handler + logout fix ④ pagination-footer guard ⑤ `can()` helper — each with tests.
**Avoids:** Pitfalls 1, 3, 4, 7, 10 at the root.

### Phase 3: Pilot Slice — Noticeboard
**Rationale:** Smallest surface, has soft-delete+restore, exercises factory + trash pattern end-to-end. One cheap domain de-risks the contract every other domain copies.
**Delivers:** Working noticeboard (feed, create/edit, trash/restore, permanent-delete confirm) + the documented reference Slice Contract + promoted trash-tabs and pagination footer in `components/shared/`.
**Uses:** Everything from Phase 2.
**Avoids:** Pitfall 6 (trash UX confusion) in its simplest form.

### Phase 4: Staff Self-Service Group
**Rationale:** Independent, low-risk domains that consume the promoted widgets; builds the upload + user-search integrations the money phase needs next.
**Delivers:** Mail (inbox/outbox/compose w/ recipient picker), Leave staff half (apply w/ proof, balances beside form, my applications), Reimbursement staff half (bill create w/ image receipts, my bills, balance enquiry).
**Implements:** Upload integration (`components/image-upload.tsx` reuse + document variant), user-search picker.

### Phase 5: Money & Approval Group
**Rationale:** Richest relation graph; establishes the money-mutation rules that payroll copies verbatim. Bank/accounts could pull forward here if settle UX wants payout context visible (optional swap).
**Delivers:** Reimbursement admin half (handle/settle/recycle-bin/search/advance-bill/audit-log), Payroll admin (records, per-user history, installment recording, manual cron), Leave admin (types management, review queue).
**Encodes as acceptance criteria:** no optimism on money, `isPending` button gating, per-domain invalidation maps, money-hook tests. Caveat: verify cron-generated payroll data exists in the environment before calling screens done.

### Phase 6: Bank/Accounts Admin + Events Depth
**Rationale:** Events is highest complexity × lowest pattern risk (patterns proven by now) and depends on uploads + export pattern; bank admin shares the admin-only audience and `/api/admin` prefix.
**Delivers:** Onboarding wizard, bank detail CRUD, user restore; events program→workshop→session→participant CRUD, bulk session-attendance grid, reminders, export-job→notification→download flow (built here, reused everywhere).
**Avoids:** Pitfalls 8 (schema drift — multipart Media-id discipline) and 9 (export silence) get their canonical implementations here.

### Phase 7: Audit-and-Fix Existing Modules
**Rationale:** Runs last among build phases because alignment is mechanical once the target utilities exist (factory, IST utils, shared footer, session-death handler). Distinct from the *critical* auth fixes already landed in Phase 2.
**Delivers:** attendance/calendar/users/register/profile migrated onto factory + parsed schemas; naive date calls replaced; inline-apiFetch violations fixed; known `meta.total` pagination bug killed via shared footer; RBAC affordance sweep; sw.js origin whitelist; error-handler dedup; responsive-layout pass across staff screens.

### Phase Ordering Rationale

- **Gates/tests/shared-lib precede all feature mass** — retrofitting costs more than building-on (ARCHITECTURE build-order rationale, confirmed by PITFALLS phase mapping).
- **Pilot before fleet** — noticeboard de-risks the Slice Contract every subsequent domain copies.
- **Staff half before admin half within reimbursement** — same domain, one hook file, natural progression; money rules harden in Phase 5 where stakes peak.
- **Events last of the new builds** — most routes, 4-level nesting, oddly-shaped reminder endpoint; deserves proven patterns underneath.
- **Audit after infra** — "align old modules" is only mechanical when the target utilities exist; but session-death/logout fixes are pulled *forward* into Phase 2 because PITFALLS flags them as pre-condition for any new mutation surfaces.
- **Exports require notifications end-to-end** — download links arrive as notification actions; the events phase owns making that loop demonstrably work.

### Research Flags

Phases likely needing deeper research during planning (`--research-phase`):
- **Phase 6 (Events depth):** most routes, participant-creation input mode unknown (employee-search vs free entry), reminder endpoint shape odd (GET on session path), exact export route unverified — resolve against live OpenAPI at `/docs`.
- **Phase 5 (Money group):** verify payload field details for unbuilt domains — amounts as numbers vs strings, settlement sub-resource shape, advance-bill admin schema — against live OpenAPI before writing schemas.

Phases with standard patterns (skip research-phase):
- **Phases 1–2:** vitest config is the official Next.js guide verbatim; factory/handler/time-utils designs are fully specified in ARCHITECTURE.md/PITFALLS.md with code.
- **Phase 3:** contract fully documented; noticeboard is the deliberate low-risk pilot.
- **Phase 4:** mail is 3 endpoints; staff forms repeat the existing RHF+zodResolver pattern.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Locked stack verified live against npm registry on 2026-08-24; peer-dep compatibility verified; additions tiny and well-documented |
| Features | HIGH | Every feature anchored to a verified route in MODULE_ROUTES.md / FRONTEND-HANDBOOK.md; vendor analysis corroborates conventions |
| Architecture | HIGH | Codebase-anchored; every claim verified against source or the binding backend handbook |
| Pitfalls | HIGH | Contract hazards verified against live code; TanStack patterns verified via current docs |

**Overall confidence:** HIGH — unusually strong, because this is a completion milestone researched against an existing codebase and a deployed, documented backend rather than speculative greenfield claims.

### Gaps to Address

- **Live OpenAPI is final arbiter** where MODULE_ROUTES.md and FRONTEND-HANDBOOK disagree: notice restore route (flagged `underDevelopment` in one doc, documented in the other), events export route shape, mail multi-recipient support. Handle: check `/docs` at each affected phase start before writing schemas.
- **tz-library micro-decision:** STACK recommends `@date-fns/tz`; ARCHITECTURE/PITFALLS show bare `Intl` + fixed `+05:30` constants suffice (fixed offset, no DST). Both agree on the invariant (one shared time module, explicit offsets). Handle: decide in Phase 2 planning — zero-dep `Intl` first, add `@date-fns/tz` only if date-fns `in:` context arithmetic proves needed.
- **`useMe()` role string values** for manager gating (nav tier + RoleGuard arrays) — MEDIUM confidence; resolve with one API call in Phase 2.
- **Whether calendar month-aggregation includes leave data** — affects the leave/calendar differentiator only (v1.x); verify if pursued.
- **Multi-tab refresh race** (cookie rotation invalidating sibling tabs) — accepted limitation unless observed; escalation path documented in PITFALLS.md.
- **Backend amount representation** (numbers vs strings) for money inputs — check FRONTEND-HANDBOOK § before Phase 5 form schemas; don't guess.

## Sources

### Primary (HIGH confidence)
- `../saher-backend/FRONTEND-HANDBOOK.md` — binding integration contract: envelope, soft delete/restore, IST, RBAC matrix, exports
- `../saher-backend/MODULE_ROUTES.md` — complete route/permission surface, all 14 modules
- Live source reads: `lib/api-wrapper.ts`, `hooks/use-*.ts`, `services/*.api.ts`, `components/role-guard.tsx`, `package.json`
- `.planning/codebase/` prior analyses (ARCHITECTURE, CONVENTIONS, CONCERNS, TESTING, STACK) — cross-checked against source
- npm registry live queries (versions + peerDependencies), 2026-08-24
- Next.js official Vitest guide (rev. 2026-02); shadcn/ui docs incl. October 2025 component drop; TanStack Table v9 migration guide; @date-fns/tz README; TanStack Query v5 docs (via Context7)

### Secondary (MEDIUM confidence)
- Vendor feature corroboration: Ramp, Helios, ExpenseTron, NetSuite (expense workflows); HROne, TeamLease, RazorpayX, Keka, greytHR (Indian payroll norms); Claromentis, ThoughtFarmer (intranet feature sets defining what to skip)
- caniuse March 2026 (Temporal coverage → do-not-adopt verdict)
- Zod v4 migration guide + resolver issue threads (zod#4686)

### Tertiary (needs validation during execution)
- Live OpenAPI at backend `/docs` — final arbiter for doc conflicts and unbuilt-domain payload shapes
- Runtime observations pending: calendar/leave aggregation overlap, multi-tab refresh behavior, payroll cron data availability in environment

---
*Research completed: 2026-08-24*
*Ready for roadmap: yes*
