---
status: advisory
score: 16/24
---

# Phase 4 — UI Review

**Audited:** 2026-08-26
**Baseline:** `.planning/phases/04-staff-self-service-mail-leave/04-UI-SPEC.md` + shadcn conventions (noticeboard = phase-03 reference)
**Screenshots:** Not captured — no dev server detected on ports 3000/5173/8080. Code-only audit.
**Mode:** Advisory. No source files were modified.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Domain-specific copy throughout; only generic nits ("No results.", "Filter Mails...") |
| 2. Visuals | 2/4 | Primary Send action styled `outline`; admin approve/reject icons visually identical |
| 3. Color | 3/4 | Fully token-based, zero hardcoded colors; reject affordance misses destructive color |
| 4. Typography | 3/4 | 5 sizes / 3 weights, mostly per spec §7; page-title scale inconsistent with phase 03 |
| 5. Spacing | 3/4 | Zero arbitrary values; route shells compose padding inconsistently (`p-4` + `py-8`) |
| 6. Experience Design | 2/4 | Mail body double-escaping renders `&#039;`; swallowed validation errors; filter×pagination conflict |

**Overall: 16/24**

---

## Top 3 Priority Fixes

1. **Mail body double-escaping shows raw HTML entities to users** — `app/(main)/mail/page.tsx:352-355` runs the body through `escapeHtml()` and then renders it *as a React text child*. React already escapes text children, so every apostrophe displays as `I can&#039;t attend…`, every `&` as `&amp;`. Since apostrophes appear in nearly every real mail, this corrupts virtually every rendered body (the spec snippet at UI-SPEC §5f contains this bug verbatim — implementation faithfully copied it). **Fix:** delete the `escapeHtml` call and render `{selectedMail?.body ?? ""}` directly — React's child-escaping IS the defense-in-depth the spec wanted.

2. **Validation errors silently swallowed in both leave dialogs** — `applyLeaveSchema` defines "Start date is required" / "End date is required" (`services/leave.api.ts:41-43`) and an end-before-start refine targeting `endDate` (`:53-55`), but `apply-leave-dialog.tsx:210-234` renders no `FieldError` for either date field. Same pattern in `leave-type-dialog.tsx`: the carry-forward refine error ("Carry forward days cannot exceed allocated days", `services/leave.api.ts:28-31`, path `maxCarryForwardDays`) targets a field that never renders errors. Users click submit, nothing happens, no feedback. **Fix:** add `{fieldState.error && <FieldError errors={[fieldState.error]} />}` to startDate/endDate Controllers in apply dialog and to maxCarryForwardDays Controller in type dialog (mirroring lines 203/251 which already do it correctly).

3. **Admin status filter fights server pagination + shows fake empty state** — `admin-page.tsx:39-56` fetches with `page`/`limit` (server-paginated) then client-side filters the current page only. Spec §3h assumed "backend returns all records"; here, filtering "Pending" shows pending items from page N only, and pagination still pages through all statuses — pending requests on other pages are invisible. Worse, there is no loading state: while `applications.isLoading`, `filteredItems` is `[]` and the table flashes "**No leave applications found.**" before data arrives. **Fix:** pass status as a query param to the API (filter server-side), or at minimum gate the empty state on `!applications.isLoading` and show the staff-table-style loading card.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

Spec-mandated copy is implemented almost verbatim and is domain-specific everywhere:

- ✓ "Apply Leave" / "Edit Leave Application" / "Update Application" / "Submitting..." (`apply-leave-dialog.tsx:161,274-279`)
- ✓ "Loading leave applications..." / "No leave applications found." exactly per spec §5c (`leave-table.tsx:53,63`)
- ✓ "Submit Decision" / "Updating..." (`review-leave-dialog.tsx:127`)
- ✓ Toasts carry backend messages or specific strings ("Leave applied successfully", "Leave updated successfully")
- ✓ Empty inbox → "No results." row per spec §3a (`data-table.tsx:166`)

Minor nits (why not 4):
- `"Filter Mails..."` placeholder (`data-table.tsx:79`) — odd capitalization vs the codebase's sentence-case norm ("Search users...", "Enter Subject")
- Staff subtitle says "monitor your leave balance" (`page.tsx:42`) vs spec wireframe "monitor your balance." — trivial drift
- Leave-type table Status column prints raw booleans as words "Active"/"Disabled" (`leave-type.tsx:93`) where the rest of the app uses `<LeaveStatusBadge>`-style badges — readable but below the bar set elsewhere

### Pillar 2: Visuals (2/4)

- ✗ **Send button de-emphasized:** `variant="outline"` on the compose form's primary action (`mail/page.tsx:239`) while surrounding toolbar buttons (Refresh, Columns) use the same outline variant — the main CTA has zero visual precedence. Should be default variant.
- ✗ **Approve/reject indistinguishable:** in `admin-page.tsx:179-194`, Check and X are both `size="icon" variant="ghost"` with same-size icons — no color differentiation between a career-affecting approval and rejection. Spec §7 assigns semantic colors via badge variants; the actions should echo them (e.g., X in `text-destructive`).
- ✗ UserSearchPicker dropdown rows are plain text `{name} — {email}` (`user-search-picker.tsx:150`); spec §6 explicitly calls for Avatar (24×24) + name + email result rows.
- ✗ Chip remove is an unstyled native `<button>` inside the chip (`user-search-picker.tsx:91-98`) — visually jarring against shadcn styling; needs ghost sizing/cursor/muted color.
- ✓ Clear focal hierarchy on leave pages: `text-3xl` h1 → `text-xl font-semibold` h2 → muted subtitles (`page.tsx:37-43,56-60`)
- ✓ Mail detail dialog structure matches spec wireframe (From block, To/Cc/Bcc avatar grids, separator, whitespace-pre-wrap body)
- ✓ Compact balance cards match spec §7 exactly (capitalize title, Badge secondary "{n} Left")

### Pillar 3: Color (3/4)

- ✓ Zero hardcoded hex/rgb values in any phase-04 file (sole grep hit is the `&#039;` string literal, not a color). Everything routes through tokens: `bg-muted`, `text-muted-foreground`, `text-destructive`, `border-primary/20 bg-primary/5`, `text-primary`.
- ✓ Accent restraint good: `text-primary` used sparingly (FileCheck proof icon `leave-table.tsx:127`, UserCheck `leave-details-dialog.tsx:132`, manager-comment border wash).
- ✗ Reject affordance uses no destructive signal (see Visuals) — the token exists and is unused where semantics demand it.
- ✗ Inconsistent image-src handling: mail columns wrap in `imageUrl()` helper (`column.tsx:20`), admin employee avatar reads `leave.user.image.src` raw (`admin-page.tsx:127`). Currently equivalent (helper is near-identity), but two patterns for the same job will diverge when the helper gains logic.

### Pillar 4: Typography (3/4)

Distribution (grep counts across phase-04 files):

- Sizes: `text-sm`(13), `text-xs`(3), `text-xl`(3), `text-3xl`(3), `text-2xl`(2) — 5 distinct sizes, at the flag threshold
- Weights: `font-bold`(17), `font-semibold`(7), `font-medium`(6) — 3 weights

- ✓ Spec §7 patterns honored: `font-bold` subjects/names, `text-xs text-muted-foreground` secondary lines, TableHead defaults untouched
- ✗ Page-title scale drift vs phase 03 reference: leave pages use `text-3xl font-bold` (`page.tsx:37`, `admin-page.tsx:61`, `leave-type.tsx:35`) while noticeboard's "New Notice" uses `text-2xl font-bold` — two competing h1 scales now coexist. Pick one.
- ✗ `font-bold` used for both sender names AND subjects in tables (`column.tsx:24,36`) — spec calls for bold names; everything-bold flattens the hierarchy it was meant to create

### Pillar 5: Spacing (3/4)

- ✓ Zero arbitrary `[...]px/[...]rem` values anywhere in phase-04 files
- ✓ Compact balance cards byte-for-byte match spec §7: `grid gap-3 sm:grid-cols-3`, card `rounded-lg border p-3` (`apply-leave-dialog.tsx:169-171`)
- ✓ Chip styling matches the declared `flex items-center gap-2 rounded-full bg-muted px-2 py-1 text-sm`
- ✓ Filter buttons `flex flex-wrap gap-2` per spec (`admin-page.tsx:76`)
- ✗ Route-shell composition inconsistent: `/leave` and `/leave-management` wrap features in `<main className="p-4">` (`(manager)/leave/page.tsx:6`) *and* the features add their own `container space-y-8 py-8` / `space-y-6 py-8` — nested containers with double vertical padding. The noticeboard route applies a single `p-4` and lets the feature own content. Also note `(manager)` group layout contributes nothing visual, so padding responsibility is split three ways.
- ✗ `leave-management` stacks `LeaveTypePage` (which carries its own full `container py-8` header block) above `AdminLeavePage` (another container header) — two stacked h1 blocks ("Leave Types" then "Leave Approval") read as two unrelated pages sewn together rather than one management screen

### Pillar 6: Experience Design (2/4)

State coverage matrix:

| State | Mail | Staff leave | Admin leave | Type CRUD |
|-------|------|-------------|-------------|-----------|
| Loading | ✗ none (stale rows during refetch) | ✓ loading card | ✗ **fake empty state** | ✗ blank table |
| Error | partial (apiFetch toasts) | partial + inline overlap ✓ | partial | partial |
| Empty | ✓ "No results." | ✓ card copy | ✓ copy, but shown during load | ✗ **no empty state** |
| Pending submit | ✗ Send button lacks disabled/"Sending..." (spec §3c) | ✓ disabled + "Submitting..." | ✓ "Updating..." | ✓ disabled, but label stays "Create"/"Update" (spec §7 `{action}...` pattern not followed) |

Specific defects beyond the Top 3:

- **Reject button doesn't preselect "rejected"** — spec §3i explicitly requires X to open ReviewLeaveDialog defaulted to rejected. Both Check and X call identical `setReviewLeave(leave)` (`admin-page.tsx:182,190`); radio always opens on "approved". An admin clicking X and then Submit Decision without touching the radio **approves** the leave they intended to reject. This is a decision-integrity defect, borderline blocker.
- **UserSearchPicker states missing** — spec §6 state table requires "Searching...", "No users found.", and "Search failed. Try again." dropdown messages. Implementation (`user-search-picker.tsx:75-76,137`) only renders when results exist: loading = silence, failure = silence, all-results-already-selected = silence.
- **Enter key falls through to send** — pressing Enter in the To/Cc/Bcc input when the dropdown is closed skips the picker handler (`onKeyDown` only intercepts Enter when `dropdownOpen`, line 128) and submits the compose form via implicit form submission.
- **Stale form state on reopen** — ApplyLeaveDialog resets only via `useEffect([leave])`; closing via Apply button after abandoning a half-filled form reopens with stale values (effect doesn't rerun). ReviewLeaveDialog never resets on close-without-submit, so a previously selected "rejected" leaks into the next review.
- **Pagination hidden at totalPages ≤ 1** (`leave-table.tsx:161`, `admin-page.tsx:208`) vs spec §3e's "shows 1 of 1 with disabled controls". Defensible UX choice, noted as deviation.
- ✓ Positives worth keeping: inline overlap error below dates matches spec §3j exactly (`apply-leave-dialog.tsx:236-238`); IST-aware helpers used consistently (`lib/date.ts`); reply quoting format implements §3b fully including `Re:` prefix guard; tab switch resets shared page counter (`mail/page.tsx:108-111`).

**Accessibility (cross-cutting):**

- 6 icon-only buttons across mail/leave tables (Eye ×2, Pencil ×2, Check, X) — **zero `aria-label`s**. Only UserSearchPicker chips have them. Screen reader users hear "button" six times per row.
- `aria-invalid`: 0 occurrences in both feature dirs — the register-form convention (`aria-invalid` + FieldError) wasn't carried over.
- FieldLabels unassociated: To/Cc/Bcc, Leave Type, Start/End Date labels have no `htmlFor`/id linkage; checkbox rows in type dialog (`leave-type-dialog.tsx:199-207,214-222`) can't be toggled via their labels. Counter-example done right: RadioGroup in review dialog uses id+htmlFor pairs.
- Picker dropdown lacks listbox/option roles and `aria-activedescendant`; arrow-key selection is invisible to AT. Table rows activated by cell click have no keyboard path (no tabIndex/onKeyDown).
- ✓ Dialog titles/descriptions present (leave-details-dialog includes DialogDescription — best-practice).

**Responsive behavior:**

- ✓ Balance grids collapse per spec (`sm:grid-cols-2 xl:grid-cols-4` staff, `sm:grid-cols-3` compact cards)
- ✓ Filter row wraps (`flex-wrap`), shadcn `Table` provides `overflow-x-auto` wrapper (`components/ui/table.tsx:11`)
- ✓ Compose fields stack naturally; detail dialog grids collapse `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- ✗ Mail detail `min-w-1/2` (`mail/page.tsx:248`) is harmless at desktop but pointless at mobile; combined with long unbroken emails + `break-all` it works, yet `min-w` on a modal is a mobile-hostile habit — prefer `sm:min-w-[...]` if width intent matters

---

## Consistency vs Noticeboard Reference (Phase 03)

| Convention | Noticeboard | Phase 04 | Verdict |
|---|---|---|---|
| Loading state | `<DefaultLoader>` shared component | Hand-rolled Card+text (staff), absent (admin/types) | ⚠️ diverged |
| Empty state | `<NoData>` shared component | Hand-rolled text / absent | ⚠️ diverged |
| PaginationFooter import | `@/components/shared/pagination-footer` (9 files) | `@/components/pagination-footer` re-export (2 leave files) vs direct (mail) | ⚠️ two paths |
| Icon-button labeling | — | none anywhere | ✗ regression |
| Page title scale | `text-2xl` | `text-3xl` | ⚠️ split |

The `components/pagination-footer.tsx` one-line re-export should be deleted and its two consumers repointed to `shared/` — one canonical import path.

## Registry Safety

Skipped: `components.json` exists, but UI-SPEC.md lists no third-party registries (all components shadcn-official or hand-built per conventions).

## Files Audited

- `app/(main)/mail/page.tsx`
- `features/mail/column.tsx`, `data-table.tsx`, `outbox-column.tsx`
- `components/user-search-picker.tsx`
- `features/leave/page.tsx`, `admin-page.tsx`, `apply-leave-dialog.tsx`, `leave-details-dialog.tsx`, `leave-table.tsx`, `leave-type.tsx`, `leave-type-dialog.tsx`, `review-leave-dialog.tsx`
- `app/(main)/(manager)/layout.tsx`, `(manager)/leave/page.tsx`, `(manager)/leave-management/page.tsx`
- Supporting: `hooks/use-mail.ts`, `services/mail.api.ts`, `services/leave.api.ts`, `lib/date.ts`, `lib/image-url.ts`, `components/image-upload.tsx` (contract check), `components/pagination-footer.tsx` + `components/shared/pagination-footer.tsx` (duplication check), `components/ui/table.tsx` (responsive check), `features/noticeboard/*` (reference)
