# Phase 4: Staff Self-Service — Mail & Leave - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-26
**Phase:** 4-Staff Self-Service — Mail & Leave
**Areas discussed:** Mail layout & navigation, Leave page structure, User-search picker design, Leave proof-doc upload, Update pending leave, Sidebar navigation, Mail compose validation, Reply quoted body format, Leave overlap errors, Outbox multi-recipient display

---

## Mail layout & navigation

### Mail scope

| Option | Description | Selected |
|--------|-------------|----------|
| Audit-fix + gap-fill | Fix code quality (zod schemas, typos, extract picker), add reply, add sanitized view — stay within existing tabbed layout | ✓ |
| Rebuild with improvements | Rebuild the page with better structure, add reply, add zod | |
| Minimal: just reply + picker | Keep existing code mostly as-is, only add reply and picker extraction | |

**User's choice:** Audit-fix + gap-fill
**Notes:** Mail already has substantial existing code (486-line page, service, hook, data table).

### Mail detail view

| Option | Description | Selected |
|--------|-------------|----------|
| Keep as dialog | Clicking a row opens a Dialog overlay — quick, no route change | ✓ |
| Dedicated page route | /mail/[id] with full detail view — shareable URL | |

**User's choice:** Keep as dialog

### Reply UX

| Option | Description | Selected |
|--------|-------------|----------|
| Switch to Compose tab | Reply button switches to Compose tab with To prefilled + quoted body | ✓ |
| Reply inline in dialog | Inline reply area within the detail dialog | |
| Dedicated reply page | /mail/reply/[id] page | |

**User's choice:** Switch to Compose tab

### User-search picker extraction

| Option | Description | Selected |
|--------|-------------|----------|
| Extract to shared component | Move picker to components/user-search-picker.tsx for reuse by Phase 5 | ✓ |
| Keep inline, defer extraction | Keep inline in mail page only | |

**User's choice:** Extract to shared component

---

## Leave page structure

### Leave scope

| Option | Description | Selected |
|--------|-------------|----------|
| Audit-fix + gap-fill | Fix gaps on existing structure, no route changes | ✓ |
| Restructure + gap-fill | Restructure routes plus fill gaps | |
| Minimal fixes only | Just add update-pending and fix proof upload | |

**User's choice:** Audit-fix + gap-fill
**Notes:** Leave has two routes: /leave (staff) and /leave-management (admin), both already functional.

### Leave balances in apply dialog

| Option | Description | Selected |
|--------|-------------|----------|
| Balance cards inside dialog | Show balance cards at top of apply dialog | ✓ |
| Keep dialog simple | Balance on main page only | |

**User's choice:** Balance cards inside dialog

### Proof document handling

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse image-upload | Use existing image-upload component → /api/upload/image | ✓ |
| Simple file dropzone | Build a simpler dropzone for any file type | |
| Defer upload to Phase 5 | Skip file upload for now | |

**User's choice:** Reuse image-upload
**Notes:** Proof is a document ID from uploaded file, not free text.

### Admin review queue filtering

| Option | Description | Selected |
|--------|-------------|----------|
| Status filter buttons | All / Pending / Approved / Rejected button group | ✓ |
| Search + status dropdown | More flexible but more complex | |
| No filter, keep as-is | Admin scrolls through all | |

**User's choice:** Status filter buttons

---

## User-search picker design

### Component design

| Option | Description | Selected |
|--------|-------------|----------|
| Controlled component | value/onChange/label props | ✓ |
| Hook + render props | useUserSearch() returns { input, results, selected, add, remove } | |

**User's choice:** Controlled component

### Select mode

| Option | Description | Selected |
|--------|-------------|----------|
| Configurable via prop | multiple prop (default true) for mail, false for Phase 5 | ✓ |
| Always multi-select | Phase 5 wraps it and limits to one | |
| Two separate components | UserSearchPicker and UserSearchSingle | |

**User's choice:** Configurable via prop

### Search trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Debounced dropdown | Show results as user types (300ms debounce) | ✓ |
| Manual search trigger | User presses Enter or clicks search button | |

**User's choice:** Debounced dropdown

---

## Leave proof-doc upload

### Upload endpoint

| Option | Description | Selected |
|--------|-------------|----------|
| Same /api/upload/image endpoint | Reuse existing upload endpoint | ✓ |
| Separate document endpoint | Different endpoint for non-image files | |
| No upload, manual ID entry | Staff manually provides the file ID | |

**User's choice:** Same /api/upload/image endpoint

---

## Update pending leave

### Edit mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Edit dialog | Click edit opens dialog pre-filled with current values | ✓ |
| Dedicated edit page | /leave/[id]/edit with full form | |
| Inline row editing | Click to edit fields directly in table | |

**User's choice:** Edit dialog

---

## Sidebar navigation

### Nav placement

| Option | Description | Selected |
|--------|-------------|----------|
| Separate top-level items | Mail and Leave as separate items in staff nav | ✓ |
| Grouped under a section | Under a "Communication" or "Self-Service" section | |
| You decide | Let agent decide placement | |

**User's choice:** Separate top-level items

---

## Mail compose validation

### Client-side validation

| Option | Description | Selected |
|--------|-------------|----------|
| Add zod validation | Subject required, body required, to required (min 1) | ✓ |
| No validation, backend handles | Keep as-is | |

**User's choice:** Add zod validation

---

## Reply quoted body format

### Quote style

| Option | Description | Selected |
|--------|-------------|----------|
| Text quote with > prefix | Original body prefixed with '> ' on each line | ✓ |
| HTML blockquote | Show original as <blockquote> with separator | |
| Header only, no body quote | Just "On [date], [name] wrote:" header | |

**User's choice:** Text quote with > prefix

---

## Leave overlap errors

### Error display

| Option | Description | Selected |
|--------|-------------|----------|
| Inline error below dates | Show error message below date fields, form stays open | ✓ |
| Toast error on submit | Toast notification on submit attempt | |
| Disable submit + warning | Disable submit button when overlap detected | |

**User's choice:** Inline error below dates

---

## Outbox multi-recipient display

### Recipient display

| Option | Description | Selected |
|--------|-------------|----------|
| First + count | "John and 2 others" — compact, informative | ✓ |
| All names | Show all recipient names in compact list | |
| First recipient only | Simplest, matches current behavior | |

**User's choice:** First + count

---

## the agent's Discretion

- Exact file names for feature components within `features/mail/` and `features/leave/`
- Whether mail and leave share a route group or stay separate in `app/(main)/`
- Balance card layout inside the apply dialog (grid, inline, compact)
- Filter button styling (which shadcn variants)
- Test scope beyond minimum contract verification
- How the edit dialog differentiates create vs edit mode (prop or separate components)
- Whether the shared user-search-picker goes in `components/` or `components/ui/`

## Deferred Ideas

None — discussion stayed within phase scope.
