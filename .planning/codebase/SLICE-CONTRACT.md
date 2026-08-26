# Slice Contract — Module Recipe

> Every new module follows this recipe. Noticeboard is the reference implementation.
> All file references use noticeboard as the living example — update these paths when
> promoting the pattern to a new module.

## 1. Service Layer (`services/<module>.api.ts`)

**Pattern:** Define Zod schemas mirroring the backend, export typed async functions.

**See:** `services/notice.api.ts` — noticeSchema, createNoticeSchema, getNotices, createNotice, updateNotice, deleteNotice, restoreNotice, permanentDeleteNotice.

**Steps:**
1. Mirror backend entity shape as a Zod response schema (export both schema and inferred type via `z.infer`)
2. Define input schemas for create/update operations
3. One async function per backend endpoint using `apiFetch<T>()`
4. GET endpoints returning arrays: return `res.data` directly (do NOT use `normalizeList` unless backend provides `meta`)
5. Mutations: return `res.data` for endpoints that return data; void for void endpoints
6. Export all schemas, types, and functions

**Backend contract notes:**
- Backend uses `new: false` on PUT — returns OLD document. Callers must invalidate cache, not trust response.
- Backend may add days to dates — document the quirk, compensate in frontend.

## 2. Data Hook (`hooks/use-<module>.ts`)

**Pattern:** TanStack Query wiring — one query per list/detail, one mutation per write operation.

**See:** `hooks/use-notice.ts` — useNotices with notices query + addNotice/editNotice/removeNotice/restore/permanentRemove mutations sharing one invalidation helper.

**Steps:**
1. Import all service functions
2. Export a single hook (e.g., `useNotices`) taking optional `{ id }` props
3. Queries: `useQuery` with hierarchical key `["<resource>", "active"]` for list, `["<resource>", "detail", id]` for detail
4. Mutations: `useMutation` wrapping each write service function
5. All mutations: `onSuccess` → `queryClient.invalidateQueries({ queryKey: ["<resource>"] })`
6. Return flat object bag — no nested objects
7. No single-resource endpoint? Resolve detail from the cached list (`queryFn` finds by id)

## 3. Feature Components (`features/<domain>/`)

**Pattern:** One file per concern — feed, detail, form, card, badge, trash.

**See:** `features/noticeboard/` — notice-feed.tsx, notice-detail.tsx, notice-form.tsx, notice-card.tsx, notice-edit.tsx, notice-expiry-badge.tsx, notice-trash.tsx

**Key patterns:**
- `"use client"` on all components using hooks/state
- Import hooks (not services directly) from `hooks/use-<module>.ts`
- Import shared UI from `components/ui/*`
- Use `cn()` from `@/lib/utils` for conditional classes

## 4. Forms (`react-hook-form` + `zod`)

**Pattern:** Shared form component handling both create and edit modes.

**See:** `features/noticeboard/notice-form.tsx` — NoticeForm with mode: "create" | "edit"

**Steps:**
1. Define props: `{ mode: "create" | "edit"; initialData?: {...} }`
2. Use `useForm<InputType>({ resolver: zodResolver(schema) })`
3. Fields rendered through `<Controller>` with `<Field>`, `<FieldLabel>`, input, and conditional `<FieldError errors={[fieldState.error]} />`
4. Submit handler named `on<Noun>Submit`; call the appropriate mutation, `onSuccess` → toast + redirect to list
5. Do NOT use mutation response to update UI — invalidate cache instead

## 5. Client-Side Pagination

**Pattern:** Component holds page state, slices full array, renders PaginationFooter.

**See:** `features/noticeboard/notice-feed.tsx` — PAGE_SIZE=10, useState for page, slice + PaginationFooter

**Steps:**
1. `const PAGE_SIZE = 10;`
2. `const [page, setPage] = useState(1);`
3. Compute: `const items = data ?? []; const totalPages = Math.ceil(items.length / PAGE_SIZE); const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);`
4. Clamp page when data shrinks: `if (page > totalPages && totalPages > 0) setPage(totalPages);`
5. Render `<PaginationFooter page={page} totalPages={totalPages} onPageChange={setPage} />`
6. PaginationFooter lives at `components/shared/pagination-footer.tsx`

## 6. Trash Tab Pattern

**Pattern:** Active/Trash tabs using shadcn Tabs. Trash content via TrashTabPattern wrapper.

**See:** `app/(main)/noticeboard/page.tsx` (Tabs), `features/noticeboard/notice-trash.tsx` (placeholder), `components/shared/trash-tab-pattern.tsx` (reusable wrapper)

**Steps:**
1. Wrap feed content in `<Tabs defaultValue="active">` with TabsList containing "Active" and "Trash" triggers
2. TabsContent for "active" contains the list view
3. TabsContent for "trash" renders `<TrashTabPattern>` (from `components/shared/trash-tab-pattern.tsx`)
4. For modules with working trash endpoints: pass custom children to TrashTabPattern
5. For modules without trash endpoints: use default NoData placeholder
6. Destructive row actions require a shadcn Dialog confirmation showing the item title ("Are you sure?" + Cancel/destructive buttons)

## 7. RBAC Gating

**Pattern:** Frontend `can()` helper gates UI affordances. Backend may not enforce.

**See:** `lib/permissions.ts` (can function), noticeboard uses `can(role, "write", "notice")` for admin buttons and `can(role, "delete", "notice")` for delete affordances

**Steps:**
1. Import `can` from `@/lib/permissions`
2. Get current user: `const { data: user } = useMe();`
3. Gate create/edit/delete buttons: `can(user?.role ?? "user", "action", "resource")`
4. Do NOT gate read access on `can(role, "read", resource)` — permission matrices may be incomplete
5. Document any backend authorization gaps (no `authorize()` middleware)

## 8. IST Date Handling

**Pattern:** All date display/parsing through `lib/date.ts` utilities.

**See:** `lib/date.ts` — formatIstDate, formatIstDateTime, dateInputToIso

**Steps:**
1. Display dates: `formatIstDate(isoString)` for date-only, `formatIstDateTime(isoString)` for date+time
2. Form input to ISO: `dateInputToIso("YYYY-MM-DD")` → `"YYYY-MM-DDT00:00:00+05:30"`
3. Never use `new Date().toLocaleDateString()` — always route through IST utilities
4. Badge/derivation logic can use raw Date math (e.g., expiry badge days calculation in `features/noticeboard/notice-expiry-badge.tsx`)

## 9. Route Structure

**Pattern:** Thin page shells composing feature components.

**See:** `app/(main)/noticeboard/page.tsx`, `app/(main)/noticeboard/[id]/page.tsx`, `app/(main)/noticeboard/new/page.tsx`, `app/(main)/noticeboard/[id]/edit/page.tsx`

**Steps:**
1. Staff-accessible routes: `app/(main)/<module>/page.tsx`
2. Detail routes: `app/(main)/<module>/[id]/page.tsx` (async server shell awaiting `params: Promise<{ id }>`)
3. Authoring routes: `app/(main)/<module>/new/page.tsx` and `app/(main)/<module>/[id]/edit/page.tsx` — same group as staff routes, NOT under `(admin)`
4. Guard authoring routes with a per-module `"use client"` `layout.tsx` checking `can(r, "write"/"update", "<resource>")` and redirecting to `/forbidden` — do NOT rely on `(admin)` group-layout inheritance (its coarse `user:write` gate breaks per-resource permissions; see phase 03 CR-01)
5. Page files are thin shells (≤15 lines): export default function, render feature component
6. Add navigation entry to `components/sidebar/nav-list.tsx` in appropriate route group

## 10. Testing

**Pattern:** TDD for data layer (services, hooks, pure functions). Component tests for critical UI.

**See:** `tests/notice-api.test.ts`, `tests/notice-expiry.test.tsx`, `tests/notice-hook.test.tsx`

**Steps:**
1. Service tests: MSW handlers + assert service functions call correct endpoints
2. Hook tests: renderWithProviders + assert query/mutation shape
3. Pure function tests: fake timers for date-dependent logic
4. Component tests for pagination/shared components (e.g., `tests/pagination-footer.test.tsx`)
5. Form tests: submit validation + success path

---

*Document created: Phase 3 (Noticeboard Pilot)*
*Living examples: All noticeboard files in `services/notice.api.ts`, `hooks/use-notice.ts`, `features/noticeboard/`*
