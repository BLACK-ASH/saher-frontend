# Phase 2: Shared Infrastructure & Session Reliability - Context

**Gathered:** 2026-08-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Tested shared foundations that every later module builds on, plus session reliability per contract: IST-correct datetime utilities replacing `lib/utils/time.ts`, an envelope normalization factory for paginated lists, a central session-death handler + best-effort logout cache clearing, a crash-proof shared pagination footer, and a `can(action, resource)` RBAC helper — with login/logout/refresh verified against the backend contract. **Full retrofit**: existing screens adopt all of it within this phase (all date call sites, all paginated lists onto the normalizer + footer). MVP mode: vertical slices (utility + tests + consumers together), not horizontal layers.
</domain>

<decisions>
## Implementation Decisions

### Adoption Sweep
- **D-01:** Full retrofit inside Phase 2 — every existing date rendering/parsing call site and every paginated list (attendance, corrections, users admin table, notifications, …) migrates to the new utilities/factory/footer in this phase. Not just new modules.
- **D-02:** All list screens swap to the shared pagination footer — one consistent pagination UX everywhere, including TanStack Table screens (users admin, corrections).
- **D-03:** Retrofit regression safety at agent's discretion ("do what will be ok"). Default: render tests via the Phase 1 helper where user-visible output changes (attendance times, calendar, users list); lint/typecheck/test gates everywhere else.
- **D-04:** Scope guard: if the retrofit uncovers breakage beyond what these utilities touch, log it to STATE.md blockers/deferred — do not fix here. Audit-and-fix is Phase 7.

### Session Death & Logout Contract
- **D-05:** On confirmed session death (401 even after refresh attempt): redirect once to `/login?next=<current-path>`; after re-login the user lands back where they were.
- **D-06:** Exactly one deduped "Session expired" toast at death time — never a toast storm across concurrently failing queries.
- **D-07:** Clear-all on BOTH session death and logout: `queryClient.clear()` + cancel in-flight queries so nothing refetches into a dead session and nothing of the old session survives the redirect.
- **D-08:** Best-effort logout: if `POST /api/auth/logout` fails (network, already-dead session), still clear cache + redirect. The user is never trapped by a failing logout call.

### IST Date Conventions
- **D-09:** Two canonical display formats, one source of truth: date-only `DD MMM YYYY` and datetime `DD MMM YYYY, hh:mm A` (IST). Existing `formatDate`/`formatTime` behavior folds into this set; screens stop inventing formats.
- **D-10:** Form input strategy is mixed but IST-bound: native `<input type="date">` / `datetime-local` for entry plus shadcn Calendar popover where a month view helps (events/calendar); ALL values round-trip through the IST utils to `+05:30` ISO before hitting the API.
- **D-11:** Absolute times only — no relative times anywhere, notification feed included.
- **D-12:** Libraries that own a clock (FullCalendar, react-day-picker) are configured to fixed `+05:30` timeZone where supported, and every value crossing their boundary flows through the IST utils. No silent exceptions — success criterion #1 (identical rendering regardless of browser timezone) holds on calendar surfaces too.

### RBAC Helper
- **D-13:** `can(action, resource)` reads a hardcoded frontend role→permissions matrix (e.g., `lib/permissions.ts`) mirroring the backend's actual `authorize()` guards; the matrix vocabulary is pinned during this phase's contract check.
- **D-14:** `can()` unifies ALL gating: RoleGuard route checks, sidebar nav filtering, and button/row-action affordances derive from it; existing inline `role ===` comparisons are swept in the retrofit.
- **D-15:** Manager role strings are MEDIUM confidence today — resolve with ONE live probe of `GET /api/auth/me` during the contract check; matrix + tests assert against the exact strings observed.

### Module Placement & Auth Test Depth
- **D-16:** Envelope normalization is an explicit pure factory in `lib/` (e.g., `normalizeList(res)`) that services call after `apiFetch`; `apiFetch` stays a dumb envelope parser. Normalized shape handles both meta field names (`total`, `totalPages`) and nullable `data`.
- **D-17:** One shared session module in `lib/` owns the D-05..D-08 contract; both the 401-after-refresh path (`lib/api-wrapper.ts`) and the logout hook call into it — one behavior, two triggers.
- **D-18:** The new IST utilities REPLACE `lib/utils/time.ts` outright (helpers folded in or deleted); every importer migrates during this phase's retrofit. One home for dates.
- **D-19:** AUTH-01 verification = msw-driven integration tests through the REAL `lib/api-wrapper.ts`: concurrent 401s trigger exactly one refresh call, original requests retried exactly once, refresh failure fires the D-05..D-07 contract. These are the durable money-path tests AUDT-08 later relies on.

### Pagination Footer Behavior
- **D-20:** Footer renders prev/next buttons + "Page N of M" readout; controls DISABLED (never hidden/crashing) when meta is missing/malformed or already at first/last page.

### Hooks Consolidation (user request, 2026-08-24)
- **D-21:** While migrating lists onto `normalizeList` (D-16) and the session module (D-17), collapse the six hand-rolled list hooks (`use-workshops`, `use-sessions`, `use-programs`, `use-participant`, `use-leave`, `use-admin-attendance-correction`) onto ONE shared list-hook factory so query/mutation/invalidate wiring exists once. Fix `use-login`'s `invalidateQueries({ queryKey: [] })` and `use-logout`'s `removeQueries({ queryKey: [] })` to target real keys. Non-query utility hooks (tiptap/dom/breakpoint) are out of scope.

### the agent's Discretion
User delegated remaining mechanics ("do what will be ok / best"): exact file names for new lib/ modules and the footer component, factory signature details, which shadcn primitives back the footer, test case lists beyond D-19's minimum, internal structure of the permissions matrix, how `next=` interacts with proxy.ts cookie redirects.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend contract
- `.planning/codebase/INTEGRATIONS.md` §Authentication & Identity — refresh single-flight mechanics, cookie names, role strings, endpoint map this phase verifies against
- `.planning/codebase/ARCHITECTURE.md` §Key Abstractions + §Anti-Patterns — apiFetch envelope contract, query-key collision patterns to avoid while retrofitting
- Backend auth routes + `authorize()` guards at `../saher-backend/src/**` — ground truth for D-13/D-15 (routes over docs)

### Prior decisions
- `.planning/phases/01-quality-gates-test-infrastructure/01-CONTEXT.md` — D-05/D-06/D-08: test harness rules this phase's tests must follow (msw at apiFetch boundary, shared QueryClient helper, co-located tests)
- `.planning/STATE.md` §Blockers/Concerns — Phase 2 entry: manager role string MEDIUM confidence (resolved by D-15 live probe)
- `.planning/REQUIREMENTS.md` §Foundation + §Auth & Profile — FNDT-02…06, AUTH-01 verbatim requirements

### Files being modified
- `lib/utils/time.ts` — replaced outright (D-18); its 8 exports enumerate the retrofit surface
- `lib/api-wrapper.ts` — refresh path rewires through the shared session module (D-17, D-19)
- `hooks/use-login.ts`, `hooks/use-logout.ts` — return-URL handling (D-05), best-effort logout (D-08)
- `components/role-guard.tsx`, `components/sidebar/nav-list.tsx` — unified onto `can()` (D-14)
- `.planning/ROADMAP.md` §Phase 2 — success criteria 1–5 planning must satisfy exactly
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/utils/time.ts` — 8 existing helpers (`formatDate`, `formatTime`, `transformTime`, `toLocalInput`, `getMonthYear`, …): the retrofit's starting inventory; replaced per D-18
- `lib/api-wrapper.test.ts` (Phase 1) — proves the msw→real-wrapper test pattern D-19 extends
- `components/ui/calendar.tsx` (react-day-picker) — the picker half of D-10's mixed input strategy
- Phase 1 test helper wrapping QueryClientProvider — reused by every render/flow test this phase adds

### Established Patterns
- Layering `features → hooks → services → lib` — new factories/session module belong in `lib/`; services adopt the normalizer; hooks stay the only query-cache touchers
- Zod-inferred DTOs in `services/*.api.ts` — normalizer composes with zod-validated envelopes rather than bypassing them
- Roles `"user" | "manager" | "admin"` from `useMe()` — matrix keys off these until D-15 pins exact strings

### Integration Points
- `app/provider.tsx` QueryClient singleton — where clear-all wiring (D-07) meets the app
- `proxy.ts` cookie-presence redirects — must not fight the `?next=` flow (D-05)
- Every paginated service (`services/*.api.ts` returning `{ data, meta }`) and every list screen — retrofit targets enumerated during research
</code_context>

<specifics>
## Specific Ideas

- Owner directive pattern from Phase 1 carries over: policy decided by user (retrofit breadth, session UX contract), implementation delegated ("do what will be ok / best").
- Success criterion #3 phrasing is the contract: "/login exactly once", "no toast storm", "retries exactly once" — plans should quote these as acceptance criteria.
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Breakage discovered during retrofit gets logged per D-04, not fixed.)
</deferred>

---

*Phase: 2-Shared Infrastructure & Session Reliability*
*Context gathered: 2026-08-24*
