# Pitfalls Research

**Domain:** Org-management frontend completion (Next.js 16 + TanStack Query + NestJS cookie-session backend, IST-bound money/attendance workflows)
**Researched:** 2026-08-24
**Confidence:** HIGH (contract hazards verified against live code in `lib/api-wrapper.ts`, `hooks/use-logout.ts`, `services/*.api.ts`; TanStack Query patterns verified via Context7; browser support via caniuse 2026-03 data)

---

## Critical Pitfalls

### Pitfall 1: IST day-window off-by-one — dates computed in browser-local time

**What goes wrong:**
"Today's attendance", reimbursement date filters, payroll periods, and calendar month ranges are day-windows the backend interprets in IST (`Asia/Kolkata`). The frontend currently has **zero** IST handling — grep confirms no `Asia/Kolkata`, no `+05:30` construction anywhere; dates flow through `z.coerce.date()` (browser-local interpretation) and one `timeZone="local"` render. Any device not set to IST computes the wrong day string. Two failure shapes:
1. Building a range with `new Date()` / `toISOString()`: `toISOString()` converts to UTC `Z`, so "Aug 24 IST" becomes `2026-08-23T18:30:00Z` — if the backend parses that as an IST-day boundary or compares date-only parts, you get yesterday.
2. Backend sending naive local strings (`2026-08-24T09:30:00` without offset): JS parses these as *browser-local*, silently shifting instants for non-IST devices.

**Why it happens:**
It works on the developer's IST laptop. India has no DST, so the bug is latent, not loud — it only appears on UTC CI runners, non-IST devices, or near midnight.

**How to avoid:**
One shared module (`lib/datetime.ts`) as the only place dates cross the API boundary:
- Day-window params are built as explicit offset strings: `` `${yyyy}-${mm}-${dd}T00:00:00+05:30` `` — never `toISOString()` for query params or date-only payloads. Since Asia/Kolkata is fixed +05:30 (no DST since 1945), a constant is safe forever; no tz library needed for offsets.
- Display formatting uses `Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata" })` explicitly, never `timeZone="local"`.
- Never `z.coerce.date()` for date-only fields — keep them as `"YYYY-MM-DD"` strings end-to-end; coerce only true timestamps.
- Native `<input type="date">` gives local-date semantics — perfect fit; just append the fixed offset when serializing, don't round-trip through Date.
- Vitest runs under `TZ=UTC` and `TZ=America/New_York` for any test touching day boundaries.

**Warning signs:**
Records appear "yesterday"/"tomorrow" for some users only; tests green locally fail in the Docker/CI container (`TZ=UTC`); attendance corrections cluster around midnight; calendar month view shows events on the wrong edge days.

**Phase to address:**
Foundation phase — must land **before** the first new money/date module (reimbursement) and as part of the attendance/calendar audit. Retrofitting after payroll ships means migrating stored filter state.

---

### Pitfall 2: Double-submits and lost optimistic state in money flows

**What goes wrong:**
Settle-bill, approve-payroll, pay-installment, handle-reimbursement are non-idempotent money mutations. A double-click fires two POSTs → two payments or a confusing backend error. Separately, hand-rolled "optimistic" updates (mutating local state before the response) lose data when: an in-flight refetch overwrites the optimistic row, the mutation fails but UI still shows "settled", or rollback writes a stale snapshot. Staff then act on false money state — the worst class of bug in this app.

**Why it happens:**
Buttons wired to `onClick={async () => { await mutate(); }}` without pending-state gating; optimism added because invalidation "feels slow" without measuring; TanStack Query's documented snapshot/cancel/rollback choreography skipped.

**How to avoid:**
- **Default rule: no optimism for money mutations.** Server computes balances; use plain `useMutation` + invalidate on success. Perceived slowness is solved with a button spinner, not cache surgery.
- Every submit button disabled by the mutation's own `isPending` (single source of truth — never a separate `loading` useState that drifts).
- Where optimism is genuinely needed (e.g., toggling handled-status in a long list), follow the verified v5 pattern exactly: `onMutate` → `await queryClient.cancelQueries(...)` → snapshot via `getQueryData` → `setQueryData` → return context; roll back in `onError` from context; always `invalidateQueries` in `onSettled`. (Verified against TanStack Query current docs.)
- One vitest per money hook asserting: second `mutate()` call while pending is a no-op, and failed mutation restores prior cache state.

**Warning signs:** duplicate rows/payments in dev testing; two success toasts for one click; list shows settled bill whose detail still says pending; balance enquiry disagrees with bill list.

**Phase to address:**
Reimbursement phase establishes the pattern (it's the first money lifecycle); copy verbatim into payroll. Encode in the phase's acceptance criteria, not convention.

---

### Pitfall 3: Session-death handling gaps around the single-retry refresh

**What goes wrong:**
`apiFetch` has correct single-flight refresh (module-level `refreshPromise`), but the surrounding lifecycle has holes:
1. Refresh succeeds yet the retried request 401s again ("Invalid Session.") → toast + throw, but nothing logs out: authenticated shell stays mounted, every subsequent click fires another refresh attempt + toast spam, and stale org data stays visible.
2. Logout cleanup is buggy: `hooks/use-logout.ts:16` calls `queryClient.removeQueries({ queryKey: [] })` — removal while active observers are still mounted triggers immediate refetches with now-dead cookies → fresh 401s → refresh attempts → toast storm during logout. In-flight mutations aren't cancelled either.
3. Multi-tab race: two tabs hit refresh simultaneously; cookie rotation in tab A invalidates tab B's refresh token → B spuriously "logs out".
4. The `_retried` positional boolean param is misuse-prone for any direct caller (already flagged in CONCERNS).

**Why it happens:**
The happy path works, so the death path is never exercised; zero tests exist on this state machine (CONCERNS lists it as the #1 untested fragile area).

**How to avoid:**
- Centralize session death once: a `QueryCache({ onError })` (and MutationCache) in `app/provider.tsx` that detects `error.message === "Unauthorized"`, clears the cache, and redirects to login exactly once (guard flag). Remove per-mutation session logic.
- Fix logout order: cancel queries → `queryClient.clear()` → navigate; or navigate first and clear in the login page mount. Never bare-remove while protected screens are mounted.
- Write the two highest-value vitest cases first (per CONCERNS priority): parallel 401s produce exactly one `/refresh-token` call; refresh-failure path redirects once without refetch loops.
- Treat multi-tab spurious logout as accepted limitation unless observed; if it appears, verify session liveness via `/auth/me` before declaring death instead of trusting one refresh failure.

**Warning signs:** stacked duplicate "Session expired" toasts; after re-login the previous page's data flashes before refetch; network tab shows refresh-request storms.

**Phase to address:**
Auth audit in the foundation/first audit phase — before any new module piles more mutation surfaces onto the broken death path.

---

### Pitfall 4: Envelope drift — `data: null` crashes and dual pagination field names

**What goes wrong:**
Contract says `{ success, message, data, meta }` where **`data` can be null**, and endpoints use **two different page-count field names** (`total` vs `totalPages`). The frontend's `MetaResponse` type hardcodes `{ page, limit, count, total }`. Consequences: a zod schema asserting the wrong meta shape rejects an HTTP-200 response → whole query throws → table shows error despite good data; `.data.map()` crashes on null empty-results; and `meta?.total! < ...` guards (already a known bug in three files per CONCERNS) let users paginate into empty pages when meta is undefined mid-load.

**Why it happens:**
Schemas written from one endpoint's example, then copy-pasted to siblings with different meta; null-data case only occurs on specific endpoints so it passes smoke tests.

**How to avoid:**
- A shared envelope schema factory in `services/` that accepts both `total` and `totalPages` and normalizes to one canonical shape at the service layer; hooks consume only the normalized shape.
- `.nullable()` on `data` everywhere by default; components guard null before mapping (empty-state component).
- Pagination controls derive from normalized meta with `?? 0` defaults and stay disabled until `meta` exists — fixes the existing unsafe comparison in all three flagged files.
- One fixture-based zod round-trip test per endpoint family, fixtures generated from the OpenAPI doc at backend `/docs`.

**Warning signs:** zod errors in console on pages that visibly work; "next" button clickable on loading tables; empty-list crash traces pointing at `.map`.

**Phase to address:**
Foundation normalization (small, mechanical) + enforced in every subsequent module build; fold the three existing unsafe comparisons into the attendance audit.

---

### Pitfall 5: Cache invalidation blind spots across related entities

**What goes wrong:**
Mutations invalidate only the mutated entity's key. But settling a reimbursement also changes: balance enquiry, dashboard stat cards, bill detail, notification feed (export jobs land there); approving a correction changes today-attendance AND calendar month aggregation AND admin tables. Stale aggregates are worse than stale lists here because they're money/attendance figures people trust. Conversely, over-invalidation done ad hoc produces inconsistent conventions that rot.

**Why it happens:** Query keys grow organically per feature; nobody maintains a map of which views read which entities.

**How to avoid:**
- Key convention with stable roots: `['reimbursement', facet, params]`, `['dashboard']`, `['calendar', month]` — broad invalidation is then `queryClient.invalidateQueries({ queryKey: ['reimbursement'] })`, one line.
- Per-domain invalidation map co-located in each `hooks/use-*.ts`: each mutation lists every affected root key (including cross-domain ones like dashboard/balance). Accept over-refetching — correctness beats request count for a daily-driver internal tool.
- For paginated facets, prefer invalidating the whole root over surgical `setQueryData` patching of pages (patched-page math with shifting totals is its own bug farm).

**Warning signs:** dashboard number disagrees with module list right after an action; users report "I have to refresh the page"; devtools show a mutation touching one key while three views render stale data.

**Phase to address:**
Standard established in the reimbursement build (richest relation graph), then audited into existing modules (attendance-correction ↔ calendar ↔ dashboard is the worst existing tangle).

---

### Pitfall 6: Soft-delete trash UX confusion

**What goes wrong:**
Trash (`?isDeleted=true`) built as a separate screen with separate keys invites three failures: (1) delete removes the row optimistically but the trash list isn't invalidated → user deletes, opens trash, sees nothing, concludes data was destroyed, recreates duplicates; (2) restore PATCH invalidates trash but not the active list → restored item invisible where the user is looking; (3) permanent delete offered too casually — unrecoverable destruction behind one click. Also deep-linking a soft-deleted record's detail page renders as if alive.

**Why it happens:** Trash treated as a bonus page rather than a facet of one entity's state machine.

**How to avoid:**
- Model as one entity root with a `{ deleted: boolean }` facet in the key; every delete mutation invalidates both facets, restore likewise.
- Permanent delete requires typed confirmation naming the item; soft delete gets an undo toast (restore endpoint already exists — use it).
- Detail views detect `deletedAt` and render a "in recycle bin — restore?" banner instead of normal action buttons.
- Reimbursement's bill→handle→settle lifecycle plus trash makes deletion states part of money auditing — show deleted bills in trash with their amounts intact.

**Warning signs:** support requests of form "I deleted X and now it's gone forever"; duplicate records created minutes apart; restore button that appears to do nothing.

**Phase to address:** Noticeboard (simplest CRUD+trash) pilots the pattern; reimbursement reuses it for the high-stakes version.

---

### Pitfall 7: Role-gating gaps — affordances rendered, actions 403

**What goes wrong:**
RoleGuard covers *pages*; action *buttons* inside staff-visible screens are the gap. `apiFetch` toasts `json.message` on every non-401 error, so a staff member clicking an admin-only affordance gets a raw backend 403 message — confusing, and it advertises endpoints they can't use. Inverse failure: hiding entire screens from managers who legitimately need read access. And hardcoded role-string arrays scattered across components diverge from actual backend RBAC as roles evolve.

**Why it happens:** Page-level guard feels like "auth done"; per-affordance checks feel redundant until the 403 toasts start.

**How to avoid:**
- One `can(action, resource)` helper fed by the `/auth/me` payload; used by nav, tables, and buttons alike. No literal role arrays in components.
- Decide the UX policy once: hidden-if-unauthorized for write affordances; disabled-with-tooltip where discoverability matters. Never rely on hiding for security (backend enforces; RoleGuard is UX polish — CONCERNS already notes middleware checks cookie existence only).
- Handle 403 as expected: gentle informational toast (or silent for background queries), never red error styling — distinguishable from real failures in logs.
- During each module build, enumerate admin-only endpoints from OpenAPI *first*, then gate — not discovered via 403 whack-a-mole after ship.

**Warning signs:** 403 entries appearing in normal user sessions; QA checklist "log in as staff and click everything" not run; role checks duplicated with slightly different strings in three components.

**Phase to address:** `can()` helper in the foundation/auth-audit pass; enforced per-module thereafter (users admin and program pages are the existing offenders to audit).

---

### Pitfall 8: Form/validation drift between zod schemas and API payloads

**What goes wrong:**
Response schemas live in `services/*.api.ts`; form input schemas live separately in features — they drift. Classic shapes here: form sends `""` where API wants `null` (or omits); numbers as strings from inputs; multipart bill uploads returning Media ids that forms accidentally send as File objects (or forget to attach at all); optional fields sent as `undefined` breaking JSON serialization expectations. Result: client validation passes, server 400s with a generic message, or worse — succeeds with garbage (`"[object File]"`).

**Why it happens:** Two schema sources written at different times by different passes; transforms considered "presentation concern".

**How to avoid:**
- One input schema per resource in `services/<domain>.api.ts`, used both as the react-hook-form resolver and as the service-layer contract; boundary transform (empty string → null, numeric coercion) declared once via `.transform()`.
- Upload step is explicit: multipart POST returns Media id → stored in form state → payload carries the id only. Forms never serialize a File into JSON.
- Round-trip test per create/update schema against OpenAPI examples (same fixtures as Pitfall 4).

**Warning signs:** 400s whose messages don't match what the form showed as valid; console shows FormData mixed into JSON bodies; fields that clear themselves on edit dialogs.

**Phase to address:** Standard set in reimbursement (has multipart bills — ideal pilot), retrofitted onto older modules during audit.

---

### Pitfall 9: Export jobs feel broken — async delivery via notifications

**What goes wrong:**
Exports are async: trigger returns immediately, result arrives later as a notification action link. Frontends routinely (a) leave the button inert-looking so users click five times → five jobs, (b) poll an endpoint that doesn't exist, or (c) render the action link as a raw `<a href>` that bypasses same-origin auth context — plus `public/sw.js` currently `openWindow`s arbitrary URLs from push payloads without origin validation (flagged in CONCERNS).

**How to avoid:**
- Clicking export: immediate "We'll notify you when ready" toast + optimistic bump of a pending-exports indicator; invalidate the notifications query shortly after triggering so the result link surfaces without manual refresh.
- Download links route through an in-app handler (same-origin fetch with credentials → blob download), not raw cross-origin anchors.
- While touching `sw.js`, whitelist same-origin/relative paths before `openWindow`.
- Disable the export button while a job for that scope is pending (track from notifications feed).

**Warning signs:** repeated identical export jobs server-side; users reporting "export doesn't work" followed by a notification arriving minutes later; downloads opening a blank tab.

**Phase to address:** Events exports phase builds it; reuse wherever exports appear (attendance, payroll later).

---

### Pitfall 10: Toast-and-throw double-handling of errors

**What goes wrong:**
`apiFetch` already toasts every failure **and** throws. Existing modules add per-mutation `onError` handlers that toast again (three inline duplicates in attendance-correction per CONCERNS) → users see every error twice; meanwhile queries with `retry: false` surface errors nowhere. New modules copying either style randomly produce inconsistent, sometimes silent, sometimes duplicated error UX.

**Why it happens:** The wrapper's toast side-effect isn't obvious from call sites, so each author guesses.

**How to avoid:**
- Policy: `apiFetch` owns the toast; hooks own nothing except special cases (403 gentleness per Pitfall 7, session death per Pitfall 3). New code adds no `toast.error` in `onError` unless deliberately replacing wrapper behavior.
- Centralize remaining per-mutation handlers when auditing attendance-correction; document the policy in one comment at the top of `lib/api-wrapper.ts`.

**Warning signs:** duplicate toasts in demo; errors visible in console but no UI feedback; three different `onError` styles in one file.

**Phase to address:** Foundation convention note + attendance-correction audit; zero-cost to keep in every later phase.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `z.coerce.date()` for date-only fields | One-liner parsing | Silent timezone shifts; unfixable once filter state persisted | Never — keep date-only as strings |
| Optimistic updates on money mutations | Feels snappy | False money state on rollback misses | Never — invalidate instead |
| Copy-pasting meta types per service | Speed | Dual field-name drift resurfaces per module | Only after normalization factory exists |
| Hardcoded role arrays per component | Skip `can()` helper | Divergence from backend RBAC on every role change | Never |
| Per-mutation inline error toasts | Local control | Duplication + inconsistency (proven in attendance-correction) | Only overriding wrapper for special cases |
| Skipping URL-synced table state | Faster build | Back-button/reset surprises in admin workflows | OK for MVP staff tables; required for admin audit tables |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Cookie-session auth | Treating 401 as fatal per-call; retrying manually | Route everything through `apiFetch`; single-flight refresh; centralize death handling |
| Response envelope | Assuming `data` always present/typed | `.nullable()` schemas + null-guarded components |
| Pagination meta | Reading `total` on endpoints that return `totalPages` | Normalize in service layer; disable pager until meta exists |
| Multipart uploads | Serializing File into JSON payload; uploading twice (once standalone, once embedded) | Upload once → Media id in form state → id-only payload |
| Export jobs | Polling nonexistent status endpoints | Trigger → toast → invalidate notifications feed → download via in-app handler |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Over-invalidation on every mutation (whole-root for everything) | Flash-refetching across dashboard/calendar after small edits | Root-level only for money/state-changing ops; param-scoped keys for reads | Noticeable ~50+ concurrent staff |
| Unbounded notification-feed growth in cache | Memory bloat on long sessions | Paginated feed + default `gcTime` | Hours-long daily-driver sessions |
| Refetch-on-focus storms on flaky office Wi-Fi | Spinner flicker on window focus across many mounted tables | Keep defaults but scope `refetchOnWindowFocus` off for heavy tables if reported | Many open tabs |
| `images.unoptimized` + full-size uploads rendering avatars/documents | Slow staff phones on cellular | Enforce sized uploads at upload time (Media pipeline) | Immediately on photo-heavy profiles |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Treating RoleGuard/middleware as security boundary | Protected shells/data requests fire pre-redirect (current behavior) | Acceptable ONLY because backend enforces every endpoint — verify per module during audit; keep guards as UX |
| Raw `openWindow(push.data.url)` in sw.js | Push payload can open arbitrary URLs (server-compromise vector) | Whitelist relative/same-origin paths (CONCERNS-flagged) |
| Rendering backend `message` verbatim in toasts | Leaks internal details (RBAC messages, SQL-ish errors) to UI | Map known messages to friendly text; log raw to console for diagnosis |
| Money amounts in float arithmetic client-side | Penny drift in installment/balance previews | Display-only formatting via `Intl.NumberFormat("en-IN", { currency: "INR" })`; never compute balances client-side — server is canonical |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Trash hidden behind filter toggle | Users believe deleted = destroyed; recreate duplicates | Named "Recycle bin" view + undo-toast on delete |
| 403 raw-message toasts for staff | Confusion; app feels broken | Hidden/disabled affordances via `can()`; gentle messaging |
| Export silence | Repeat clicks; distrust | Immediate ack toast + pending indicator tied to notification arrival |
| Dates shown in device timezone for non-IST devices | "Meeting says 9:00, I attended at 9:00, marked absent" | Fixed `Asia/Kolkata` display formatting everywhere |
| Empty-state = crash (null data) | Blank/error screens on quiet days | Shared empty-state component fed by null-guarded queries |

## "Looks Done But Isn't" Checklist

- [ ] **Attendance day view:** Often missing IST-bounded range — verify record set matches backend "today" at 23:59 IST from a UTC device
- [ ] **Bill settle/handle:** Often missing double-submit guard — verify two rapid clicks produce one mutation (network tab)
- [ ] **Payroll approval:** Often missing invalidation of balance/installment aggregates — verify related views update without reload
- [ ] **Trash/restore:** Often missing dual-facet invalidation — verify delete→trash→restore→list round-trip without reload
- [ ] **Logout:** Often missing cache clear ordering — verify no refetch storm after logout (network tab)
- [ ] **Export:** Often missing notification-driven completion — verify link arrives in feed and downloads with cookies
- [ ] **Staff-role walkthrough:** Often missing entirely — log in as lowest-privileged role and click every affordance on every screen
- [ ] **Empty results:** Verify every table with `data: null` response renders empty-state, not crash
- [ ] **Pagination edges:** Verify next disabled on last page *while loading*, filters reset page to 1

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Duplicate payment submitted | HIGH | Backend-side void/reversal flow; add idempotency guard + test before re-enabling button |
| Wrong-day attendance batch | MEDIUM | Re-run admin corrections with fixed range builder; add TZ matrix tests |
| Optimistic update corrupted cache | LOW | Invalidate affected root; remove optimistic path |
| Session toast-storm shipped | LOW | Centralized death handler; hotfix is provider-only |
| Zod schema rejected valid responses | MEDIUM | Fixture from OpenAPI reproduces; widen factory; deploy fast (service-layer only) |
| Data "lost" to trash confusion | LOW | Restore via trash or PATCH; fix UX flags |

## Pitfall-to-Phase Mapping

*(Phase names are roadmap slots, not numbers — map to whatever the roadmap defines.)*

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. IST day-windows | Foundation (before first dated module); attendance/calendar audit | Vitest under `TZ=UTC` asserts `2026-08-24T00:00:00+05:30`-style ranges; manual 23:59 IST check |
| 2. Money double-submit / optimism | Reimbursement (pattern-setting), copied in payroll | Network-tab single-request assertion; rollback unit test per money hook |
| 3. Session death/logout | Auth audit (first) | Two vitest cases: single-flight refresh; logout without refetch storm |
| 4. Envelope/null/meta drift | Foundation normalization; every module build | Fixture round-trip tests per endpoint family vs OpenAPI |
| 5. Cross-entity invalidation | Established in reimbursement; audited in attendance-correction tangle | Post-mutation assertions that dashboard/balance/calendar refetch |
| 6. Trash UX | Noticeboard pilot → reimbursement | Delete→trash→restore→list round-trip without reload |
| 7. RBAC affordances | `can()` helper in auth audit; per-module enforcement | Lowest-privilege walkthrough per module at phase review |
| 8. Schema/payload drift | Reimbursement pilot standard; retrofit in audits | Create/update schema tests vs OpenAPI examples |
| 9. Export jobs | Events exports phase | Trigger → notification arrives → cookie-authenticated download works |
| 10. Error double-handling | Foundation convention + attendance-correction cleanup | Grep gate: no `toast.error` in new `onError` handlers without justification |

## Sources

- Live contract verification: `lib/api-wrapper.ts` (refresh single-flight, toast-and-throw), `hooks/use-logout.ts` (cache-clear ordering), `services/attendance.api.ts` (`z.coerce.date()`), repo-wide grep confirming zero IST-offset handling — HIGH confidence
- `.planning/codebase/CONCERNS.md` (unsafe pagination comparisons, refresh-flow fragility, sw.js openWindow, zero test infra) — HIGH confidence
- TanStack Query v5 optimistic-update pattern (`onMutate`/cancel/snapshot/rollback/onSettled) via Context7 (tanstack.com/query docs) — HIGH confidence
- Temporal browser support: caniuse (March 2026) — Chrome 144+/Firefox 139+/Edge yes, Safari/iOS Safari no (~69% global coverage) → do NOT adopt Temporal; fixed `+05:30` constants + Intl suffice — MEDIUM-HIGH confidence
- India fixed offset (+05:30, no DST) — well-established, HIGH confidence

---
*Pitfalls research for: Saher org-management frontend completion*
*Researched: 2026-08-24*
