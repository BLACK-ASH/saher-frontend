# Phase 5: Money & Approval — Reimbursement & Payroll - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-26
**Phase:** 05-Money & Approval — Reimbursement & Payroll
**Areas discussed:** Reimbursement page structure, Settlement flow & UX, Payroll nav & layout, Double-submit & money mutation safety

---

## Reimbursement page structure

### Sidebar organization

| Option | Description | Selected |
|--------|-------------|----------|
| Two sidebar entries | "My Bills" (staff) + "Bill Management" (finance/admin) | ✓ |
| One entry with tabs | Single entry with tabs inside | |
| Three separate entries | "My Bills" + "Handle Queue" + "Recycle Bin" | |

**User's choice:** Two sidebar entries

### Staff layout

| Option | Description | Selected |
|--------|-------------|----------|
| Balance card + bills table | Top: net balance card. Bottom: table of own bills | ✓ |
| Balance card + card grid | Top: balance card. Bottom: bill cards | |
| Tabbed: Active \| History \| Recycle | Balance card + tabs separating views | |

**User's choice:** Balance card + bills table

### Finance layout

| Option | Description | Selected |
|--------|-------------|----------|
| Handle queue + recycle bin tabs | Two tabs with search above | ✓ |
| Single table with filter buttons | One table with status filter buttons | |
| Three tabs: Pending \| All Bills \| Recycle | Separate tabs for each view | |

**User's choice:** Handle queue + recycle bin tabs

### Bill detail display

| Option | Description | Selected |
|--------|-------------|----------|
| Dialog overlay | Clicking row opens dialog (Phase 4 pattern) | ✓ |
| Dedicated page /bills/[id] | Full page route for bill detail | |
| Slide-over panel | Side panel slides in from right | |

**User's choice:** Dialog overlay

### Handle individual bills UX

| Option | Description | Selected |
|--------|-------------|----------|
| Row action buttons + dialog | Approve/Reject/Hold buttons → dialog with notes | ✓ |
| Click row → detail → actions | Click row opens detail dialog with action buttons | |
| Inline expand + action | Click row expands inline to show details and actions | |

**User's choice:** Row action buttons + approve dialog

### Bulk bill handling

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-select + floating bar | Checkboxes + floating action bar with bulk actions | ✓ |
| No bulk — one at a time | Skip bulk handling entirely | |
| Select + single bulk dialog | Select multiple, one dialog for notes, sequential calls | |

**User's choice:** Multi-select checkboxes + floating action bar

### Search/filter location

| Option | Description | Selected |
|--------|-------------|----------|
| Search bar above table | Single search input above handle queue table | ✓ |
| Dedicated filter row | Filter row with separate inputs for each field | |
| Search bar + filter dropdown | Search bar plus status filter dropdown | |

**User's choice:** Search bar above handle queue table

### Advance bill creation

| Option | Description | Selected |
|--------|-------------|----------|
| Button + user-search picker | "Create Advance" button → dialog with Phase 4 picker | ✓ |
| Separate "Advances" tab | Third tab in Bill Management | |
| Inline in handle queue | Advances appear in same table as regular bills | |

**User's choice:** Button in Bill Management + user-search picker

### Bill status badges

| Option | Description | Selected |
|--------|-------------|----------|
| Colored badges like Phase 3 | Consistent with noticeboard pattern | ✓ |
| Status dots + text | Small colored dot next to status text | |
| Full row color coding | Entire table row tinted by status | |

**User's choice:** Colored badges like Phase 3 expiry

### Staff create new bills

| Option | Description | Selected |
|--------|-------------|----------|
| Floating button + dialog | "New Bill" button → dialog with form | ✓ |
| Dedicated page | Full page form for bill creation | |
| Inline form | Expandable form above the table | |

**User's choice:** Floating "New Bill" button + dialog

### Balance card content

| Option | Description | Selected |
|--------|-------------|----------|
| Single net amount + breakdown | Net balance with small breakdown | ✓ |
| Two cards: Advance vs Expenses | Separate cards for each | |
| Single amount only | Just the net balance number | |

**User's choice:** Single net amount + breakdown

### Staff edit/withdraw pending bills

| Option | Description | Selected |
|--------|-------------|----------|
| Row action buttons | Edit/Withdraw buttons on pending bill rows | ✓ |
| Edit via bill detail dialog | Staff clicks bill → detail → Edit/Withdraw | |
| Edit page + withdraw button | Dedicated edit page | |

**User's choice:** Row action buttons in table

### Bill report export

| Option | Description | Selected |
|--------|-------------|----------|
| Export button above table | Small "Export" button next to search bar | ✓ |
| Skip export for now | Defer UI button to Phase 6 | |
| Export as separate tab | Third tab with date range picker | |

**User's choice:** Export button above table

### Staff deleted bills visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Staff sees own deleted bills | Active \| Deleted tabs on My Bills page | ✓ |
| Finance-only recycle bin | Only finance sees deleted bills | |
| Undo snackbar only | Quick undo after delete, no persistent bin | |

**User's choice:** Staff can see their own deleted bills

### Audit log display

| Option | Description | Selected |
|--------|-------------|----------|
| Within bill detail dialog | Audit log section inside detail dialog | ✓ |
| Separate audit log page | Dedicated page with filters | |
| Expandable section in table | Click row expands to show audit log | |

**User's choice:** Within bill detail dialog

### Balance card API source

| Option | Description | Selected |
|--------|-------------|----------|
| Backend /balance-enquiry | Direct API call, server is source of truth | ✓ |
| Derive from bills list | Client-side calculation from bills | |
| Both — API primary, list fallback | Defensive approach | |

**User's choice:** Use backend /balance-enquiry endpoint

### Staff edit fields on pending bill

| Option | Description | Selected |
|--------|-------------|----------|
| Amount, description, images | Matches backend userBillUpdateSchema | ✓ |
| All fields including date | Would need backend change | |
| Description only | Most restrictive | |

**User's choice:** Amount, description, images only

### Receipt image display

| Option | Description | Selected |
|--------|-------------|----------|
| Thumbnail grid with lightbox | Small thumbnails, click for full-size overlay | ✓ |
| Full-width stacked images | Each image full-width stacked vertically | |
| Horizontal scrollable strip | Images in horizontal scrollable strip | |

**User's choice:** Thumbnail grid with lightbox

### Image upload in create/edit

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse components/image-upload | Existing dropzone + crop component | ✓ |
| Simple file input | Basic multi-file input without crop | |
| Dropzone only, no crop | react-dropzone without crop step | |

**User's choice:** Reuse components/image-upload

### Settlement recording after acceptance

| Option | Description | Selected |
|--------|-------------|----------|
| Settle button in detail dialog | "Record Settlement" button in bill detail | ✓ |
| Settle button in handle queue row | Row action button on accepted bills | |
| Separate settlement page | Dedicated page for settlement recording | |

**User's choice:** Settle button in bill detail dialog

### Bill search UX

| Option | Description | Selected |
|--------|-------------|----------|
| Real-time search bar | Debounced 300ms, filters instantly | ✓ |
| Search button + modal | Click icon → search modal with fields | |
| Filter chips | Clickable filter chips above table | |

**User's choice:** Real-time search bar (debounced)

### Lifecycle timeline display

| Option | Description | Selected |
|--------|-------------|----------|
| Vertical timeline with nodes | Vertical line with status nodes, timestamps, notes | ✓ |
| Horizontal step indicator | Horizontal steps: Submitted → Handled → Settled | |
| Simple list of events | Chronological list of events as cards | |

**User's choice:** Vertical timeline with status nodes

---

## Settlement flow & UX

### Payment modes

| Option | Description | Selected |
|--------|-------------|----------|
| Cash, UPI, Cheque, Other | Radio buttons matching backend enum | ✓ |
| Dropdown with backend enum | Single dropdown with all options | |
| Icons + labels | Clickable icons for each mode | |

**User's choice:** Cash, UPI, Cheque, Other (radio buttons)

### Auto bill status update after settlement

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — bill becomes settled automatically | Recording settlement marks bill settled | ✓ |
| No — finance must also approve settlement | Two-step process | |
| Depends on settlement status chosen | Finance picks settlement status | |

**User's choice:** Yes — bill becomes 'settled' automatically

### Settlement dialog fields

| Option | Description | Selected |
|--------|-------------|----------|
| Payment mode + description | Radio buttons + description field | ✓ |
| Payment mode + amount + description | Mode, amount (pre-filled), description | |
| Mode + amount + date + description | Full form with all fields | |

**User's choice:** Payment mode + description only

### Settlement status in timeline

| Option | Description | Selected |
|--------|-------------|----------|
| Colored status node | Green for settled, yellow for pending | ✓ |
| Plain text node | Just text without color | |
| Settlement details expandable | Compact by default, detailed on click | |

**User's choice:** Colored status node

---

## Payroll nav & layout

### Sidebar placement

| Option | Description | Selected |
|--------|-------------|----------|
| Separate "Payroll" entry in admin section | Dedicated sidebar entry | ✓ |
| Under "Bill Management" as a tab | Tab inside Bill Management page | |
| Under a "Finance" parent | New "Finance" sidebar parent with sub-items | |

**User's choice:** Separate 'Payroll' entry in admin section

### Page layout

| Option | Description | Selected |
|--------|-------------|----------|
| Paginated table + "Run Now" button | Table with generation trigger | ✓ |
| Table + separate history page | Main table → click employee → history page | |
| Tabbed: All Records \| Per-Employee \| History | Tabs for different views | |

**User's choice:** Paginated table + 'Run Now' button

### Run Now trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Button + confirmation dialog | Click → confirm → POST /cron → toast | ✓ |
| Button → progress → result | No confirmation, just loading state | |
| Scheduled + manual trigger | Show last run time + next scheduled | |

**User's choice:** Button + confirmation dialog

### Installment recording

| Option | Description | Selected |
|--------|-------------|----------|
| Row action → dialog | "Record Payment" → dialog with mode, amount, description | ✓ |
| Click row → history → record | Employee history view with record button | |
| Inline edit in table | Payment amount editable directly in table | |

**User's choice:** Row action 'Record Payment' → dialog

---

## Double-submit & money mutation safety

### Submit gate

| Option | Description | Selected |
|--------|-------------|----------|
| Disable button + loading spinner | Button disabled + spinner when pending | ✓ |
| Full-page loading overlay | Loading overlay covering entire page | |
| Disable button only, no spinner | Just disable the button | |

**User's choice:** Disable button + loading spinner

### Bulk progress

| Option | Description | Selected |
|--------|-------------|----------|
| Progress bar + count | "Processing 3/10..." with progress bar | ✓ |
| Single loading spinner | One spinner for entire operation | |
| No progress — just result toast | Start operation, show result when done | |

**User's choice:** Yes — progress bar + count

### Error UX for failed mutations

| Option | Description | Selected |
|--------|-------------|----------|
| Toast error + keep dialog open | Error toast, dialog stays for retry | ✓ |
| Toast error + close dialog | Error toast, dialog closes | |
| Inline error in dialog | Error message inside the dialog | |

**User's choice:** Toast error + keep dialog open

### Confirm reject/hold

| Option | Description | Selected |
|--------|-------------|----------|
| No — notes field is sufficient | Required notes = implicit confirmation | ✓ |
| Yes — confirmation dialog after notes | Extra "Are you sure?" dialog | |
| Only for bulk operations | Notes for single, confirm for bulk | |

**User's choice:** No — notes field is sufficient

---

## the agent's Discretion

- Exact file names for feature components within `features/reimbursement/` and `features/payroll/`
- Bill management page route structure under `app/(main)/`
- Whether staff and finance share a route group or stay separate
- Sidebar section placement (which group My Bills and Bill Management go under)
- Table column definitions and sorting defaults
- Test scope beyond minimum contract verification
- Whether the balance card uses a grid or inline layout
- Filter button styling (which shadcn variants)

## Deferred Ideas

None — discussion stayed within phase scope.

---

## Execution-Recovery Sign-offs (2026-08-26, /gsd-execute-phase session)

Recorded during phase-5 recovery after plan-checker iteration 1. User decisions via interactive checkpoint:

1. **D-17 amended** (timeline nodes): "Each node shows timestamp, actor name, and notes **wherever the backend records them**" — backend records no handler/actor/time for the Handled step (Quirk 9); never fabricate. Applied to 05-CONTEXT.md.
2. **D-05 ↔ D-30 guard conflict**: user chose **"Ship UI, record caveat"** — staff Restore button ships per locked D-05 even though D-30's `write:preReimbursement` backend guard would 403 pure-staff roles until the backend owner adjusts it. Recorded as an explicit backend deploy dependency in 05-01 Step 0 + threat row T-05-01-07.
3. **Nyquist validation disabled** for this phase (`workflow.nyquist_validation: false` in config.json) — no 05-VALIDATION.md; all tasks carry runnable `<verify>` commands instead.
