# Stack Research

**Domain:** Data-heavy internal org-management frontend (tables, forms, money flows, exports, notifications, uploads) on a locked Next.js App Router + NestJS-backend stack
**Researched:** 2026-08-24 (all versions verified live from npm registry on this date)
**Overall confidence:** HIGH — locked stack verified current; additions are small, well-documented packages

**Scope note:** The framework stack is LOCKED (Next.js 16 + Tailwind v4 + shadcn/ui + TanStack Query + apiFetch/zod services). This research covers what to **keep**, what to **add** for the new modules (reimbursement, payroll, leave, mail, noticeboard, admin bank/accounts), and the two genuinely open decisions: **TanStack Table v8 vs v9** and the **test stack**.

---

## Verdict Up Front

1. **Keep everything already installed.** Every existing choice is still the current standard as of Aug 2026 — no greenfield churn needed.
2. **Add exactly one runtime dependency:** `@date-fns/tz` (~1.2 kB) for IST-correct dates. Everything else needed at runtime already exists in `package.json`.
3. **Stay on TanStack Table v8 this milestone.** v9 is out but migrating now violates the audit-and-fix philosophy mid-sprint. Flag v9 for a follow-up.
4. **Test stack:** vitest 4 + @vitejs/plugin-react + jsdom + Testing Library 16 + msw 2, configured exactly per the official Next.js guide (verified Feb 2026 revision).
5. **Pull new shadcn components via CLI:** `field`, `empty`, `item`, `button-group`, `input-group`, `spinner`, `pagination`, `combobox`, `alert-dialog` — these map 1:1 onto the module domains.

---

## Recommended Stack

### Core Technologies (LOCKED — verified current, no action)

| Technology | Repo Version | Latest (npm, 2026-08-24) | Purpose | Action |
|------------|---------|-----------------|-----------------|--------|
| next | 16.1.6 | 16.3.2 | App Router framework | Keep; patch-bump opportunistically (`proxy.ts` middleware model is correct for 16) |
| react / react-dom | 19.2.3 | 19.x | UI runtime | Keep |
| tailwindcss | ^4 | 4.x | Styling | Keep |
| @tanstack/react-query | ^5.94.5 | 5.102.2 | All server state | Keep; minor bump safe |
| zod | ^4.3.6 | 4.4.3 | Form schemas + response DTOs | Keep |
| react-hook-form | ^7.71.1 | 7.86.0 | Forms | Keep — **but move from `devDependencies` to `dependencies`** (it's imported by shipped features; prod-only install would break) |
| @hookform/resolvers | ^5.2.2 | 5.9.1 | zodResolver bridge | Keep — v5 peer-supports `zod ^3.25 \|\| ^4` (verified via registry peerDeps) |
| sonner, next-themes, radix-ui, cva/clsx/tailwind-merge, lucide-react | current | current | UI plumbing | Keep |
| tiptap 3, fullcalendar 6, recharts 3, react-day-picker 9, react-dropzone 15, react-image-crop 11 | installed | current majors | Feature libs | Keep — mail compose (tiptap), events (calendar), charts, uploads all covered |

### New Runtime Dependencies

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @date-fns/tz | ^1.5.0 | `TZDate` + `tz()` context so date-fns v4 computes/formats in `Asia/Kolkata` regardless of device timezone | **Everywhere dates are built or compared**: attendance check-in payloads, leave ranges, payroll periods, event sessions. India has no DST, but staff devices may not be set to IST — never rely on system timezone |

That is the entire runtime addition. No state library, no date alternative, no money library, no table swap.

### Development Tools (test infra — currently zero)

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| vitest | ^4.1.11 | Test runner | Official Next.js-recommended runner (docs updated 2026-02); watch-mode default via `pnpm test` |
| @vitejs/plugin-react | ^6.1.0 | JSX/fast-refresh transform in tests | Required by official guide |
| vite-tsconfig-paths | latest | Resolves `@/*` alias in tests | Official guide includes it; matches repo's `@/*` alias |
| jsdom | ^30.0.1 | DOM environment | Guide's choice; safest with Radix-based shadcn components |
| @testing-library/react | ^16.3.2 | Component testing | Peer-supports React 19 (verified) |
| @testing-library/dom | ^10.4.1 | Underlying queries | Peer dep of RTL 16 |
| @testing-library/user-event | ^14.6.6 | Realistic interaction (typing, clicks) | Use over `fireEvent` everywhere |
| @testing-library/jest-dom | ^7.0.1 | DOM matchers (`toBeInTheDocument`…) | Import once in setup file |
| msw | ^2.15.0 | Network mocking via service-worker-level interception | Mocks `fetch` used by `apiFetch`; matches relative `/api/*` paths against test origin. Already allowlisted in `pnpm-workspace.yaml` — just install |

**Vitest config (per official Next.js guide, verifiable pattern):**

```ts
// vitest.config.mts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

```ts
// vitest.setup.ts
import '@testing-library/jest-dom/vitest'
```

Testing constraints to respect (from official docs): Vitest does not support async Server Components — irrelevant here since the app is effectively CSR ("use client" features), which makes it an easy vitest target. Test the layers that exist: services (msw + zod), hooks (QueryClient wrapper), feature forms/tables (render + user-event). Create a **fresh QueryClient per test** (`retry: false`) in a shared `renderWithProviders` helper; start/stop msw `setupServer()` in global `beforeAll`/`afterAll` with `onUnhandledRequest: 'error'` so stray requests fail loudly.

### shadcn Ecosystem Components to Add (CLI-generated, no npm deps)

Verified present in current shadcn registry (October 2025 component drop + earlier):

| Component | Maps To |
|-----------|---------|
| `field` (+ `input-group`) | All new CRUD forms — composes with existing RHF+zodResolver pattern without the older `Form` wrapper's rigidity; Input Group gives ₹ prefix on money inputs, trailing units on leave-days inputs |
| `empty` | Replaces hand-rolled `<NoData>` states across reimbursement/payroll/mail lists (existing `components/no-data.tsx` can migrate to it during audit-and-fix) |
| `item` | Mail inbox/outbox rows, notification feed entries, noticeboard cards |
| `button-group` | Row actions (approve/handle/settle lifecycle buttons), table toolbars |
| `spinner` | Standardizes pending-state buttons (`isPending` mutations) alongside existing `DefaultLoader` |
| `pagination` | Server-paginated tables footer (pairs with manualPagination below) |
| `combobox` (command + popover) | Search/filter selects: user pickers, leave-type select, account selectors in bank admin |
| `alert-dialog` | Destructive confirms — recycle-bin permanent deletes, payroll approval |
| Existing: `sheet`/`dialog`, `tabs`, `badge`, `table`, `calendar`/date-picker, `sonner` | Detail panels, inbox tabs, status badges (bill lifecycle), server tables, IST-aware pickers, toasts |

Install per-component when a module needs it: `pnpm dlx shadcn@latest add field empty …`. Note: repo pins `shadcn` CLI as a runtime **dependency** (^3.8.5) — move to devDependencies or drop entirely (use `pnpm dlx`). [HIGH]

---

## Domain Recipes (the patterns roadmap phases will repeat)

### Server-paginated tables (reimbursement, payroll, corrections, mail lists)

Backend paginates via `meta` envelope → use TanStack Table in **manual mode**:

- `manualPagination: true`, `manualSorting: true`, `manualFiltering: true`; only the core row model (no client `getPaginationRowModel`)
- Page/sort/filter/search state lives in the component (or URL later) and is serialized into the query key:
  `['bills', 'list', { page, pageSize, sort, search, status }]`
- Hook uses `placeholderData: keepPreviousData` (TanStack Query v5 API) so page changes don't flash empty
- `meta.totalCount` drives `<Pagination>`; row actions column uses `Button Group` + `DropdownMenu` per current shadcn data-table guide
- Soft-delete trash UX stays contract-driven: separate query variant `?isDeleted=true` + `PATCH restore/{id}` mutation invalidating both list keys

**Table major-version decision — stay on v8 (^8.21.3):**
TanStack Table **v9 (9.1.2) is released** and current shadcn data-table docs now target v9 (`useTable`, mandatory `features` object, `create*RowModel`, `sortFn`, start/end pinning). Migrating is real work (API renames throughout, feature registration), and the repo has 2 working v8 tables plus ~6+ tables still to build. Recommendation: **write all milestone tables on v8**, translating doc snippets mechanically (drop `features` object, `useTable`→`useReactTable`, `create*RowModel`→`get*RowModel`). Consistent single API > bleeding-edge alignment inside a 1-month sprint. Trigger for revisiting: dedicated follow-up phase migrating all tables to v9 before any future heavy datagrid work (aggregation/pinning needs). [HIGH confidence on facts; MEDIUM on judgment call — if the team prefers, do v9 migration as its own pre-phase; do NOT mix APIs mid-milestone]

### IST date correctness

One tiny dependency, three rules:

1. **Build** user-entered date/time in IST explicitly: `new TZDate(y, m, d, h, min, "Asia/Kolkata")` (accepts IANA names or plain `"+05:30"`).
2. **Send** offset ISO strings per backend contract: `format(tzDate, "yyyy-MM-dd'T'HH:mm:ssXXX")` → `…+05:30` (plain `.toISOString()` always yields UTC `Z` — do not use it for payloads).
3. **Compare/group** with date-fns v4 context option: `startOfDay(d, { in: tz("Asia/Kolkata") })`, `differenceInCalendarDays(a, b, { in: tz("Asia/Kolkata") })`.

Centralize all of this in `lib/utils/time.ts` (already the date home): add `toIST()`, `formatISTDate/formatISTTime` (wrap every display format through `TZDate`), `istOffsetISO()`. Audit-and-fix phases then sweep old call sites onto these helpers. Display formatting can also use bare `Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata" })` where date-fns isn't needed. [HIGH — verified against @date-fns/tz README + date-fns v4 context API]

### Money flows (reimbursement bills, payroll, balances)

- **No money library.** Backend is canonical for arithmetic/balances (balance enquiry endpoints exist); frontend formats only.
- Format: `new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n)` — platform-native, correct lakh/crore grouping. One shared helper in `lib/utils`.
- Inputs: `<Input inputMode="decimal">` + zod string schema (`/^\d+(\.\d{1,2})?$/`) transformed per backend contract (check FRONTEND-HANDBOOK whether amounts arrive as numbers or strings — don't guess).
- Never `parseFloat` raw input into payload math; validate → send → re-render from response.

### Forms + validation (zod pairing)

Keep RHF + `@hookform/resolvers/zod` + zod v4 — fully supported combo. Known v4-specific gotchas for the new modules: [HIGH]

- Error customization: prefer `{ error: "…" }` (v4 idiom); legacy `{ message: "…" }` still works but is deprecated — fine for existing schemas, use `error:` in new ones. `invalid_type_error`/`required_error` are GONE in v4 — replaced by `error: (issue) => …`.
- Coerced fields (money, numeric IDs): type forms as `useForm<z.input<typeof S>, unknown, z.output<typeof S>>` to avoid the known `z.coerce.number()` resolver typing friction.
- File attachments (bills): validate with `z.file().size().mime(...)` — but surface MIME errors via `.refine()` instead of relying on `.mime()` custom messages (known resolver message-propagation gap, zod#4686).
- Non-ref components (Select, DatePicker popovers) go through `Controller` — existing pattern, continue it.

### Uploads & exports

Uploads: react-dropzone (installed) → FormData straight through `apiFetch` (already skips Content-Type for FormData). Exports: backend delivers download links as notification actions — frontend needs only notification-action rendering (anchor/download), nothing new.

---

## Installation

```bash
# The one runtime addition
pnpm add @date-fns/tz@^1.5.0

# Test infrastructure (all dev)
pnpm add -D vitest@^4 @vitejs/plugin-react@^6 jsdom@^30 \
  @testing-library/react@^16 @testing-library/dom@^10 \
  @testing-library/user-event@^14 @testing-library/jest-dom@^7 \
  vite-tsconfig-paths msw@^2

# shadcn components — pull per-module as needed
pnpm dlx shadcn@latest add field empty item button-group input-group spinner pagination combobox alert-dialog
```

Plus package.json hygiene fixes (audit phase):
1. Move `react-hook-form` devDependencies → dependencies (runtime import; prod install would break).
2. Move `shadcn` dependencies → devDependencies, or remove and use `pnpm dlx`.
3. Remove unused `jwt-decode` (flagged in codebase analysis).

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| @date-fns/tz (TZDate + `in:` context) | `date-fns-tz` v3 | Never for new code — legacy API of same team, superseded by @date-fns/tz |
| @date-fns/tz | Luxon or day.js w/ timezone plugin | Only if the app ever becomes multi-timezone org-wide; a second date library in an IST-only app is pure cost |
| Stay TanStack Table v8 | Upgrade to v9 now | If a dedicated pre-phase absorbs ~2–4 days migration AND team wants alignment with current shadcn docs; never mix v8+v9 concurrently |
| useState table state in query keys | `nuqs` ^2.10 (URL search-param state) | Add when shareable/bookmarkable filtered views become a requirement (e.g., "send me your pending-bills view"); not needed to ship modules |
| Intl.NumberFormat INR | currency.js / decimal.js | Only if client-side money math becomes necessary — backend owns arithmetic |
| jsdom | happy-dom ^20 | Only if jsdom proves too slow at scale; happy-dom is faster but Radix/shadcn edge cases make jsdom the lower-risk default |
| RHF + zodResolver | TanStack Form | Not while every existing form + shadcn examples use RHF; no pain point justifies a second form system |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Mixing TanStack Table v8 and v9 across modules | Two mental models, double review burden, shadcn snippets won't copy cleanly into either | Pick v8 for this milestone, translate v9 doc snippets mechanically |
| `date-fns-tz` in new code | Legacy API (toDate/formatInTimeZone style), superseded; adds a second tz abstraction beside date-fns v4's native `{ in }` | `@date-fns/tz` |
| System-local Date math (`new Date(y,m,d)` for IST days) | Device timezone leaks in; attendance/leave day boundaries silently wrong for non-IST devices | TZDate/"Asia/Kolkata" builders in `lib/utils/time.ts` |
| `toISOString()` for request payloads | Always emits UTC `Z`, violating the backend `+05:30` offset-string convention | `format(tzDate, "yyyy-MM-dd'T'HH:mm:ssXXX")` |
| Redux/Zustand/Jotai | Zero cross-page client state exists; TanStack Query + useState cover everything (architecture doc concurs) | Query cache as the store |
| Client-side money arithmetic on floats | Rounding drift in payroll/reimbursement totals | Backend-computed values, render-only formatting |
| Temporal API | Still not baseline across target browsers; no polyfill budget in scope | TZDate (same semantics, works today) |

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| zod ^4.3.6 | @hookform/resolvers ^5.2.2+ | Verified peer range `^3.25 \|\| ^4`; auto-detects major |
| @tanstack/react-table 8.21.3 | Current shadcn data-table *docs* target v9 | Snippets need mechanical translation; v8 runtime is stable/maintained |
| react 19.2.3 | @testing-library/react ^16.3.2 | Peer-verified `\|\| ^19` |
| vitest 4 | Next 16 App Router | Official guide (rev. 2026-02) supports; async RSC untested by design — N/A for this CSR app |
| msw 2.15 | Node 24, vitest 4, relative `/api/*` URLs | Already allowlisted in pnpm-workspace.yaml built-deps list |
| @date-fns/tz ^1.5 | date-fns ^4.1.0 | Designed pair; `in:` context requires v4 (repo has it) |

## Sources

- npm registry live queries (versions + peerDependencies for resolvers/table/RTL/msw) — 2026-08-24 — HIGH
- Next.js official Vitest guide (nextjs.org/docs/app/guides/testing/vitest, rev. 2026-02-11, v16.3.2) — config + package list — HIGH
- shadcn/ui docs: data-table guide (targets TanStack Table v9), October 2025 component drop (Field/Item/Empty/ButtonGroup/InputGroup/Spinner/Kbd), spinner docs — HIGH
- TanStack Table v9 migration guide + v9 RFC discussion #5834 (breaking changes inventory, useLegacyTable bridge) — HIGH on facts
- @date-fns/tz GitHub README (TZDate, `tz()` context, offset formats, moved into date-fns monorepo) — HIGH
- Zod v4 migration guide (error param, dropped error params) + zod#4686 (.mime message propagation workaround) + resolvers PR #776 history — HIGH/MEDIUM
- Repo files: package.json, .planning/codebase/STACK.md, ARCHITECTURE.md, PROJECT.md — ground truth for locked choices

---
*Stack research for: Saher frontend completion milestone*
*Researched: 2026-08-24*
