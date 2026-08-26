# Phase 3: Noticeboard Pilot - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-26
**Phase:** 3-Noticeboard Pilot
**Areas discussed:** Notice feed & detail layout, Admin create/edit form, Trash tabs pattern, Slice Contract docs

---

## Notice feed & detail layout

### Feed display

| Option | Description | Selected |
|--------|-------------|----------|
| Card grid (Recommended) | Each notice as a card with title, excerpt, date, expiry badge — responsive grid, reuses existing Card component patterns | ✓ |
| List view | Single-column vertical list with title, date, expiry — simpler, compact, good for many notices | |
| You decide | Let the agent decide based on what fits the existing app style best | |

**User's choice:** Card grid (Recommended)
**Notes:** None

### Detail view

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated page (Recommended) | Full page at /noticeboard/[id] showing title, full body, created/author info, expiry — simple and clean | ✓ |
| Dialog overlay | Modal dialog opening from the card — keeps user in context but constrains space for long content | |
| You decide | Let the agent decide | |

**User's choice:** Dedicated page (Recommended)
**Notes:** None

### Body content type

| Option | Description | Selected |
|--------|-------------|----------|
| Rich text (Tiptap) | Admins write formatted text with bold, lists, links — Tiptap editor already exists in the codebase | |
| Plain text | Just a plain textarea — simpler, no formatting, no XSS risk | |
| You decide | Let the agent decide based on what the backend accepts | |

**User's choice:** Initially selected Rich text, then revised to Plain text after backend contract check revealed `description` is stored as plain string.
**Notes:** Backend stores `description` as `String` type in Mongoose schema. No HTML/rich text support.

### Expiry visual treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Status badge (Recommended) | Colored badge on each card: green (active), yellow (expiring soon <3 days), red (expired) — consistent with status badge patterns elsewhere | ✓ |
| Date text only | Just show the expiry date in text, let users parse it themselves | |
| You decide | Let the agent decide | |

**User's choice:** Status badge (Recommended)
**Notes:** None

---

## Admin create/edit form

### Form container

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated pages (Recommended) | Full page at /noticeboard/new and /noticeboard/[id]/edit — clean, plenty of space for rich text editor | ✓ |
| Dialog/slide-over | Slide-over panel or dialog triggered from the feed — keeps user in context, less page navigation | |
| You decide | Let the agent decide | |

**User's choice:** Dedicated pages (Recommended)
**Notes:** None

### Form fields

| Option | Description | Selected |
|--------|-------------|----------|
| Title + Body + Expiry (Recommended) | Title (text input), Body (Tiptap rich text editor), Expiry date (date picker, default 7 days from now) | |
| Add category field | Title + Body + Expiry + Category/tag for organizing notices | |
| You decide | Let the agent decide based on what the backend schema supports | |

**User's choice:** "check from backend what it required" — deferred to backend contract check.
**Notes:** Backend requires: `title: string (required)`, `description: string (required)`, `expiresAt: Date (optional)`. No category field exists.

### Body format (post-backend check)

| Option | Description | Selected |
|--------|-------------|----------|
| Plain text (Recommended) | Backend stores plain string. Use textarea for admin form, render as plain text with line breaks preserved. Matches backend reality. | ✓ |
| Rich text (Tiptap) | Store rich text HTML in the description string. Backend accepts any string, so it works — but adds XSS risk and complexity | |
| You decide | Let the agent decide | |

**User's choice:** Plain text (Recommended)
**Notes:** Backend stores `description` as plain `String` type.

### Expiry default

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-fill 7 days (Recommended) | Pre-fill expiry date picker with 7 days from now — matches backend default, user can adjust | ✓ |
| No default | Let user manually set expiry, no default — gives full control but more effort | |
| You decide | Let the agent decide | |

**User's choice:** Pre-fill 7 days (Recommended)
**Notes:** Backend adds 1 day to provided expiresAt in controller (line 17).

### Save redirect

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect to feed (Recommended) | After save, redirect to the noticeboard feed showing the new/updated notice — standard CRUD flow | ✓ |
| Redirect to detail | After save, redirect to the notice detail page — shows the result immediately | |
| You decide | Let the agent decide | |

**User's choice:** Redirect to feed (Recommended)
**Notes:** None

### Validation display

| Option | Description | Selected |
|--------|-------------|----------|
| Inline field errors (Recommended) | Standard react-hook-form + zod pattern: field-level errors below each input, consistent with login/register forms | ✓ |
| Toast summary | Toast notification with validation summary — less disruptive but harder to fix | |
| You decide | Let the agent decide | |

**User's choice:** Inline field errors (Recommended)
**Notes:** None

### Form reuse

| Option | Description | Selected |
|--------|-------------|----------|
| Shared form (Recommended) | One NoticeForm component used for both create and edit — less code, consistent UX, standard pattern | ✓ |
| Separate forms | Separate create and edit forms — more code but allows different fields per mode | |
| You decide | Let the agent decide | |

**User's choice:** Shared form (Recommended)
**Notes:** None

---

## Trash tabs pattern

### Trash toggle

| Option | Description | Selected |
|--------|-------------|----------|
| Tabs (Recommended) | Two tabs at the top of the noticeboard: 'Active' and 'Trash' — clicking switches the list. Simple, familiar pattern. | ✓ |
| Button toggle | A button/group that toggles between active and deleted views — more compact but less discoverable | |
| You decide | Let the agent decide | |

**User's choice:** Tabs (Recommended)
**Notes:** None

### Trash actions

| Option | Description | Selected |
|--------|-------------|----------|
| Row actions (Recommended) | Restore and Permanent Delete buttons on each trash row — with confirmation dialog for permanent delete only | ✓ |
| Bulk actions | Restore button on row, Permanent Delete via a bulk-select + action bar at the top | |
| You decide | Let the agent decide | |

**User's choice:** Row actions (Recommended)
**Notes:** None

### Trash list display

| Option | Description | Selected |
|--------|-------------|----------|
| Same cards (Recommended) | Same card grid as active notices — consistent visual pattern, just with different actions | ✓ |
| Simple list | Simpler list/table view in trash — just title, deleted date, restore/delete buttons | |
| You decide | Let the agent decide | |

**User's choice:** Same cards (Recommended)
**Notes:** None

### Permanent delete confirmation

| Option | Description | Selected |
|--------|-------------|----------|
| Confirm dialog (Recommended) | Dialog with notice title shown, 'Are you sure?' message, Cancel/Confirm buttons — standard confirmation pattern | ✓ |
| Inline confirm | Inline confirmation: button turns red with 'Confirm?' text, click again to confirm | |
| You decide | Let the agent decide | |

**User's choice:** Confirm dialog (Recommended)
**Notes:** None

---

## Slice Contract docs

### Contract scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full slice guide (Recommended) | Document the full pattern: services → hooks → features → trash → pagination — everything a new module needs to follow | ✓ |
| Code comments only | Just code comments in the noticeboard files explaining the pattern — lightweight, always in sync with code | |
| You decide | Let the agent decide | |

**User's choice:** Full slice guide (Recommended)
**Notes:** None

### Doc location

| Option | Description | Selected |
|--------|-------------|----------|
| .planning/codebase/ (Recommended) | SLICE-CONTRACT.md in .planning/codebase/ alongside ARCHITECTURE.md and CONVENTIONS.md — central reference | ✓ |
| In the feature dir | README.md in features/noticeboard/ — lives with the reference implementation | |
| You decide | Let the agent decide | |

**User's choice:** .planning/codebase/ (Recommended)
**Notes:** None

### Contract format

| Option | Description | Selected |
|--------|-------------|----------|
| Step-by-step recipe (Recommended) | Step-by-step guide: '1. Define schema in services/, 2. Create hook in hooks/, 3. Build feature components...' with code examples from noticeboard | ✓ |
| Architecture overview | Architecture overview: explains the layers, their responsibilities, and how they connect — more conceptual | |
| You decide | Let the agent decide | |

**User's choice:** Step-by-step recipe (Recommended)
**Notes:** None

### Contract layers

| Option | Description | Selected |
|--------|-------------|----------|
| All layers (Recommended) | Services, hooks, features, forms, trash pattern, pagination, RBAC gating, IST dates — the complete module recipe | ✓ |
| Data + feature only | Just the data layer (services + hooks) and feature structure — skip trash/pagination since those are shared components | |
| You decide | Let the agent decide | |

**User's choice:** All layers (Recommended)
**Notes:** None

### Contract code style

| Option | Description | Selected |
|--------|-------------|----------|
| Reference noticeboard code (Recommended) | Point to actual noticeboard files as the living example — e.g., 'See services/notice.api.ts for schema pattern' | ✓ |
| Inline code snippets | Include inline code snippets directly in the document — self-contained but risks going stale | |
| You decide | Let the agent decide | |

**User's choice:** Reference noticeboard code (Recommended)
**Notes:** None

---

## the agent's Discretion

- Exact file names for feature components within `features/noticeboard/`
- Card component variant (shadow, border, etc.) — match existing app style
- Expiry badge color的具体 shades — use tailwind status colors
- Route layout structure under `app/(main)/`
- Whether noticeboard page goes under admin route group or main route group
- Navigation entry placement in sidebar
- Test scope beyond minimum contract verification

## Deferred Ideas

None — discussion stayed within phase scope.
