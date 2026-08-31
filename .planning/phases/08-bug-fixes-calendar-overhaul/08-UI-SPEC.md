---
phase: 8
slug: bug-fixes-calendar-overhaul
status: draft
shadcn_initialized: true
preset: radix-nova (zinc base)
created: 2026-08-31
---

# Phase 8 — UI Design Contract

> Visual and interaction contract for Phase 8 bug fixes & calendar overhaul. This is a bug-fix phase — no new design tokens, components, or visual patterns. The contract documents the existing patterns being corrected and the interaction contracts for each fix area.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn |
| Preset | radix-nova, zinc base color |
| Component library | radix-ui (unified package ^1.4.3) |
| Icon library | lucide-react |
| Font (light) | Geist, ui-sans-serif, sans-serif, system-ui |
| Font (dark) | Capriola, ui-sans-serif, sans-serif, system-ui |

All 39 shadcn UI components are already generated. No new components need installation this phase. New artifacts are limited to: `EditBillDialog` (mirrors existing `CreateBillDialog`).

---

## Spacing Scale

Inherited from existing Tailwind v4 config. No changes.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline padding |
| sm | 8px | Compact element spacing |
| md | 16px | Default element spacing |
| lg | 24px | Section padding |
| xl | 32px | Layout gaps |
| 2xl | 48px | Major section breaks |
| 3xl | 64px | Page-level spacing |

Exceptions: None. All fixes use existing layout spacing.

---

## Typography

Inherited from existing theme. No changes.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 400 (regular) | 1.5 |
| Label | 14px | 600 (semibold) | 1.5 |
| Heading | 20px | 600 (semibold) | 1.2 |
| Display | 28px | 600 (semibold) | 1.2 |

---

## Color

All tokens defined in `app/globals.css` as CSS variables (oklch). No changes.

| Role | Token | Usage |
|------|-------|-------|
| Dominant (60%) | `--background` (oklch 0.994) | Page background, surfaces |
| Secondary (30%) | `--card` (oklch 0.994) / `--sidebar` (oklch 0.994) | Cards, sidebar, nav |
| Accent (10%) | `--primary` (oklch 0.452, pink/magenta) | Primary buttons, active nav items, focused links, brand highlights |
| Destructive | `--destructive` (oklch 0.637, red) | Delete/withdraw buttons, error toasts, destructive AlertDialog triggers |

Accent reserved for: Primary CTA buttons, active sidebar nav indicator, form submit buttons, badge highlights. NOT for: background fills, card borders, text color.

---

## Interaction Patterns Per Fix Area

This phase fixes 7 bugs + calendar overhaul. Each area documents the existing interaction contract being corrected.

### 1. Registration Error Messages (BUGF-01)

**What's broken:** 5 fields in `register-schema.ts:67-76` all show "Date Of Birth Is Required." as the error message (copy-paste bug). Shift-2 time label shows "2:00 AM" instead of "2:00 PM".

**Correct interaction contract:**
- Each required field shows its own error message below the field on validation failure
- Error messages use `react-hook-form` `FieldError` component (existing pattern)
- Messages are sentence case, specific to the field

| Field | Correct Error Message |
|-------|----------------------|
| employeeId | Employee ID is required |
| department | Department is required |
| designation | Designation is required |
| salaryStructure | Salary structure is required |
| address | Address is required |

**Time label fix:** `employee-details.tsx:38` — change "2:00 AM" to "2:00 PM".

**Component:** `features/register/register-schema.ts`, `features/register/employee-details.tsx`

### 2. Profile Double-Toast (BUGF-02)

**What's broken:** `profile-info.tsx` functions `handleChangeEmail`, `handleChangePassword`, `handleChangeProfile` show both error AND success toast on failure — no early return after `toast.error()`.

**Correct interaction contract:**
- On error: one `toast.error(message)` fires, function returns immediately
- On success: one `toast.success(message)` fires, query invalidation runs
- Since `apiFetch` throws on non-success, the `!res.success` branch may be unreachable — but the code structure must be correct: `return` after `toast.error()`

**Component:** `features/profile/profile-info.tsx`

### 3. Notice Trash Tab (BUGF-03)

**What's broken:** `notice-trash.tsx` is a placeholder. Backend supports soft-delete/restore/permanent-delete but the trash tab never lists deleted items. Dead code in `hooks/use-notice.ts:41-49`.

**Correct interaction contract:**
- Trash tab shows trashed notices (backend needs `isDeleted=true` query param)
- Each trashed item shows: title, expiry date (IST), deleted-at timestamp
- Restore button triggers `restoreNotice` mutation with AlertDialog confirmation
- Permanent Delete button triggers `permanentRemoveNotice` mutation with AlertDialog confirmation
- After restore: item moves to Active tab; after permanent delete: item disappears
- Uses existing `TrashTabPattern` from Phase 3 (Active | Deleted tabs)
- Empty trash state: `<NoData />` component with "No deleted notices" message

**Existing pattern reference:** Phase 3 noticeboard trash (03-CONTEXT.md), Phase 7 trash enforcement (07-CONTEXT.md D-05)

**Components:** `features/noticeboard/notice-trash.tsx`, `hooks/use-notice.ts`, `services/notice.api.ts`

### 4. Bill Management Routing & Lifecycle (BUGF-04)

**What's broken:** Admin bill management page exists at `app/(main)/reimbursement/management/page.tsx` but has no nav entry. Finance bill table has no-op pagination. Balance card has query key mismatch. Staff bill edit dialog is missing.

**4a. Admin Nav Entry (D-05)**

**Correct interaction contract:**
- "Bill Management" appears in sidebar for admin/finance roles
- Gated on `can(r, "read", "preReimbursement")` (same guard as the existing page)
- Navigates to `/reimbursement/management`
- Uses existing `NavMain` pattern in `components/sidebar/nav-list.tsx`

**4b. Bill Pagination Fix (D-06)**

**Correct interaction contract:**
- `FinanceBillTable` accepts `onPageChange` prop from parent `management/page.tsx`
- `PaginationFooter` wires `onPageChange` to actual page state
- Page changes trigger new data fetch via existing `useReimbursement` hook
- Page resets to 1 on filter/search changes (existing pattern from D-23)

**4c. Balance Card Query Key Fix (D-07)**

**Correct interaction contract:**
- Canonical query key: `["reimbursement", "balance"]`
- `balance-card.tsx` uses `["reimbursement", "balance"]` (already correct)
- `use-reimbursement.ts` `invalidate()` targets `["reimbursement", "balance"]` (fix: was `["balance"]`)
- After any settle/handle mutation, balance card refreshes automatically

**4d. Staff Bill Edit Dialog (D-08)**

**Correct interaction contract:**
- Edit button visible on pending bills only (existing: `status === "pending"`)
- Opens `EditBillDialog` (new component, mirrors `CreateBillDialog`)
- Pre-filled: amount, description, images (existing from bill)
- Date field: read-only (backend `userBillUpdateSchema` excludes date)
- Submit sends `PATCH /rem/:billId` with partial update
- Disabled + "Updating..." while pending (double-submit protection per D-26)
- On success: invalidation-only cache update (D-29), dialog closes, toast success
- On error: dialog stays open with values intact (D-28)

**Components:** `components/sidebar/nav-list.tsx`, `features/reimbursement/finance-bill-table.tsx`, `features/reimbursement/balance-card.tsx`, `features/reimbursement/bill-table.tsx`, new `features/reimbursement/edit-bill-dialog.tsx`

### 5. Leave Validation & Update (BUGF-05)

**What's broken:** Backend rejects leave applications with generic toast. Leave type update has field-name mismatch (`leaveCode` vs `type`) in backend controller.

**5a. Leave Apply Error Surfacing (D-10)**

**Correct interaction contract:**
- Backend validation errors (notice period, proof requirement, overlap) surface as specific toast messages
- Dialog already shows "overlap" inline — keep that
- Notice period errors: toast with backend's specific `message` (e.g., "Minimum N days notice required")
- Proof errors: toast with backend's specific `message` (e.g., "Proof document is required for this leave type")
- No schema changes needed — frontend already sends correct `+05:30` ISO dates

**5b. Leave Update Field Fix (D-11) — Backend**

- Backend controller reads `payload.type` (was `payload.leaveCode`)
- Backend update writes `{ type: newLeaveType._id }` (was `{ leaveCode: ... }`)
- Frontend `apply-leave-dialog.tsx` already sends correct `type` field — no frontend change

**Component:** `features/leave/apply-leave-dialog.tsx` (frontend), `saher-backend/src/leave/leave.controller.ts` (backend)

### 6. Notice Permanent Delete (BUGF-06)

See §3 above (Notice Trash Tab). This is part of the same fix — the trash tab + restore + permanent-delete wiring.

### 7. Calendar Overhaul (BUGF-07, CAL-01, CAL-02)

**What's broken:** Events vanish on refresh (timezone boundary issue). Delete has no confirmation. Edit is commented out. No error handling on drag-drop. No RBAC on backend routes.

**7a. Event Persistence Fix (D-12)**

- Root cause: server-local `new Date(year, month, 1)` month boundary query may miss events at timezone edges
- Fix: normalize to IST boundaries or pin UTC in backend Dockerfile
- Verification: create → refresh round-trip must work in both dev (IST) and production (UTC container)

**7b. Delete Confirmation (D-13)**

**Correct interaction contract:**
- Click delete → AlertDialog opens with: "Delete event? This action cannot be undone."
- Confirm button (destructive variant) → `del.mutate(eventId, { onError })` 
- Cancel button → closes dialog, no action
- On success: event removed from calendar view, toast success
- On error: toast error with backend message, event remains

**7c. Edit Wiring (D-14)**

**Correct interaction contract:**
- Click event → `EventDetailsSheet` opens
- Click Edit in sheet → sheet closes, `AddEventDialog` opens in edit mode
- `AddEventDialog` receives `eventId` prop + `initialData` for pre-fill
- Pre-filled fields: title, type, start, end, description
- Submit sends `PUT /api/calendar/event/:id` with partial update
- On success: calendar refetches, toast success, dialog closes
- On error: dialog stays open (D-28 pattern)

**7d. Drag-Drop & Resize Error Handling (D-15)**

**Correct interaction contract:**
- `eventDrop`: on success → refetch; on error → revert position + toast error
- `eventResize`: on success → refetch; on error → revert size + toast error
- Both mutations use `onError` callback with `toast.error(err.message)`

**7e. Calendar Type Alignment (D-17)**

**Correct interaction contract:**
- `AddEventDialog` type field changes from free-text `<Input>` to `<Select>` dropdown
- Options: `holiday`, `session`, `task`, `meeting`, `calendar-event`
- Backend `createCalendarEventSchema.type` becomes `z.enum([...])` (aligns with response schema)
- Edit mode pre-selects the event's current type

**Components:** `features/calendar/calendar.tsx`, `features/calendar/event-details.tsx`, `features/calendar/add-event-dialog.tsx`

---

## Copywriting Contract

All copy uses existing patterns. No new strings beyond bug-specific error messages.

| Element | Copy |
|---------|------|
| Calendar delete confirmation title | Delete event? |
| Calendar delete confirmation description | This action cannot be undone. The event will be permanently removed. |
| Calendar delete confirm button | Delete |
| Notice permanent delete confirmation title | Permanently delete notice? |
| Notice permanent delete confirmation description | This notice will be permanently removed. This action cannot be undone. |
| Notice permanent delete confirm button | Delete permanently |
| Notice restore confirmation title | Restore notice? |
| Notice restore confirm button | Restore |
| Bill edit dialog title | Edit Bill |
| Bill edit submit button | Update Bill |
| Bill edit pending state | Updating... |
| Empty trash heading | No deleted notices |
| Empty trash body | Deleted notices will appear here. |
| Leave notice period error | (backend message — surfaced as-is) |
| Leave proof required error | (backend message — surfaced as-is) |
| Leave overlap error | (already shown inline in apply dialog) |
| Calendar event error (drag/resize/delete) | (backend message — surfaced via toast.error) |

---

## Component Inventory (This Phase)

No new shadcn components installed. Existing components used:

| Component | File | Use In This Phase |
|-----------|------|-------------------|
| AlertDialog | `components/ui/alert-dialog.tsx` | Calendar delete confirm, notice restore/permanent-delete confirm |
| Dialog | `components/ui/dialog.tsx` | EditBillDialog, AddEventDialog (edit mode) |
| Tabs | `components/ui/tabs.tsx` | Notice trash tabs (Active | Deleted) |
| Input | `components/ui/input.tsx` | Bill edit form fields |
| Select | `components/ui/select.tsx` | Calendar event type dropdown (D-17) |
| Button | `components/ui/button.tsx` | All CTAs, destructive variants |
| Badge | `components/ui/badge.tsx` | Bill status badges (existing) |
| Table | `components/ui/table.tsx` | Finance bill table (existing) |
| PaginationFooter | `components/shared/pagination-footer.tsx` | Bill management pagination fix |

New component (built from existing primitives):
| Component | File | Notes |
|-----------|------|-------|
| EditBillDialog | `features/reimbursement/edit-bill-dialog.tsx` | Mirrors CreateBillDialog; pre-fills amount/description/images; date read-only |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | None new this phase | Not required (no new installs) |

No third-party registries. Zero new packages this phase.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
