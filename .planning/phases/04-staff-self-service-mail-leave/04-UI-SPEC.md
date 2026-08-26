# Phase 4: Staff Self-Service — Mail & Leave — UI Spec

**Date:** 2026-08-26
**Status:** Draft
**Feeds into:** 04-PLAN.md (task planning references this directly)

---

## 1. Component Inventory

### New Components

| Component | Location | Purpose | State |
|-----------|----------|---------|-------|
| `UserSearchPicker` | `components/user-search-picker.tsx` | Debounced user search with chips, multi/single select | **new** |

### Modified Components

| Component | Location | Purpose | Changes |
|-----------|----------|---------|---------|
| `MailPage` | `app/(main)/mail/page.tsx` | Mail tabbed page (Inbox/Sent/Compose) | Replace 3x inline pickers with `UserSearchPicker`; add reply button to dialog; add zod validation; sanitize body view |
| `MailDataTable` | `features/mail/data-table.tsx` | TanStack Table for mail rows | Wire server-side pagination via page/limit query params |
| `outBoxColumns` | `features/mail/outbox-colunm.tsx` → `outbox-column.tsx` | Outbox table columns | Fix filename; add "and N others" multi-recipient suffix; fix `accessorKey` |
| `LeavePage` | `features/leave/page.tsx` | Staff leave page | Pass `meta` to `LeaveTable`; wire edit dialog state |
| `LeaveTable` | `features/leave/leave-table.tsx` | Staff applications table | Add edit button for `pending` status; add `PaginationFooter` |
| `ApplyLeaveDialog` | `features/leave/apply-leave-dailog.tsx` → `apply-leave-dialog.tsx` | Staff apply/edit leave dialog | Add balance cards at top; replace proof text input with `ImageUpload`; add overlap error display; support edit mode (pre-fill from existing leave) |
| `AdminLeavePage` | `features/leave/admin-page.tsx` | Admin leave management page | Add status filter buttons above table; add `PaginationFooter`; fix card title |
| `LeaveDetailsDialog` | `features/leave/leave-details-dialog.tsx` | Leave detail view | Add edit button for `pending` status (staff only) |

### Reused As-Is

| Component | Location | Purpose |
|-----------|----------|---------|
| `LeaveBalanceCard` | `features/leave/leave-balance-card.tsx` | Balance card with progress bar — reused inside apply dialog |
| `LeaveStatusBadge` | `features/leave/leave-status-badge.tsx` | Status badge for all 4 statuses |
| `LeaveTypePage` | `features/leave/leave-type.tsx` | Leave types table + create/edit dialog — works as-is |
| `LeaveTypeDialog` | `features/leave/leave-type-dialog.tsx` | Leave type create/edit form — works as-is |
| `ReviewLeaveDialog` | `features/leave/review-leave-dialog.tsx` | Admin review form — works as-is |
| `ImageUpload` | `components/image-upload.tsx` | Dropzone + crop upload widget — reused for proof upload |
| `PaginationFooter` | `components/pagination-footer.tsx` | Pagination controls — reused for leave tables |

### Service/Hook Layer (modified, not UI)

| File | Changes |
|------|---------|
| `services/mail.api.ts` | Add zod response schemas; fix `sendMail` return type; add `page`/`limit` params to inbox/outbox; fix duplicate toast |
| `services/leave.api.ts` | Remove unused `@tiptap/core` import; add response zod schemas |
| `hooks/use-mail.ts` | Add pagination params to inbox/sent queries; invalidate `["inbox"]` on send success; debounce user search |
| `hooks/use-leave.ts` | Already complete — no changes needed |

---

## 2. Layout Specifications

### 2a. Mail Page (`/mail`)

**Wireframe:**

```
+-----------------------------------------------+
| [Inbox] [Sent] [Compose]                      |  <- TabsList
+-----------------------------------------------+
|                                                |
|  Tab: Inbox/Sent                               |
|  +-------------------------------------------+ |
|  | Filter: [___________]  [Refresh] [Cols]   | |  <- MailDataTable toolbar
|  +-------------------------------------------+ |
|  | From/To  | Subject   | Body (truncated)   | |  <- Table rows (clickable)
|  | Avatar   | Bold      | First 100 chars    | |
|  | ...      | ...       | ...                | |
|  +-------------------------------------------+ |
|  | Page 1 of N  [<<] [<] [>] [>>]           | |  <- PaginationFooter
|  +-------------------------------------------+ |
|                                                |
|  Tab: Compose                                  |
|  +-------------------------------------------+ |
|  | To:  [chips] [UserSearchPicker input]     | |
|  | Cc:  [chips] [UserSearchPicker input]     | |
|  | Bcc: [chips] [UserSearchPicker input]     | |
|  | Subject: [input]                          | |
|  | Body: [textarea, 7 rows]                  | |
|  |                [Send icon] Send            | |
|  +-------------------------------------------+ |
|                                                |
|  Dialog (on row click):                        |
|  +-------------------------------------------+ |
|  | Subject                          [X]      | |
|  | From: Avatar + Name + Email               | |
|  | To: grid of Avatars                       | |
|  | Cc: grid of Avatars (if present)          | |
|  | Bcc: grid of Avatars (if present)         | |
|  | Date: IST formatted                       | |
|  | ----------------------------------------  | |
|  | Body (sanitized, whitespace-pre-wrap)     | |
|  |                                           | |
|  | [Reply]  <- NEW: switches to Compose      | |
|  +-------------------------------------------+ |
+-----------------------------------------------+
```

**Responsive:** At mobile widths, TabsList wraps if needed. Table becomes horizontally scrollable. Dialog uses `min-w-1/2` (existing behavior). Compose form fields stack vertically (already do).

**Component hierarchy:**

```
<section className="p-4 container mx-auto">
  <Tabs defaultValue="inbox">
    <TabsList> ... </TabsList>
    <TabsContent value="inbox">
      <MailDataTable columns={mailColumns} data={inData} ... />
    </TabsContent>
    <TabsContent value="sent">
      <MailDataTable columns={outBoxColumns} data={seData} ... />
    </TabsContent>
    <TabsContent value="compose">
      <form> <FieldGroup>
        <Controller name="to"> <UserSearchPicker /> </Controller>
        <Controller name="cc"> <UserSearchPicker /> </Controller>
        <Controller name="bcc"> <UserSearchPicker /> </Controller>
        <Controller name="subject"> <Input /> </Controller>
        <Controller name="body"> <InputGroupTextarea /> </Controller>
        <Button>Send</Button>
      </FieldGroup> </form>
    </TabsContent>
  </Tabs>
  <Dialog> ... </Dialog>
</section>
```

### 2b. Staff Leave Page (`/leave`)

**Wireframe:**

```
+-----------------------------------------------+
| Leave Management                     [Apply]   |  <- Header + button
| Apply for leave and monitor your balance.     |
+-----------------------------------------------+
| Leave Balance                                 |
| Remaining leave available for each category.  |
| +----------+ +----------+ +----------+        |
| | Casual   | | Patern.  | | Emergency|        |  <- LeaveBalanceCard grid
| | [progress| | [progress| | [progress|        |     sm:grid-cols-2 xl:grid-cols-4
| | Used/Rem]| | Used/Rem]| | Used/Rem]|        |
| +----------+ +----------+ +----------+        |
+-----------------------------------------------+
| My Leave Applications                         |
| History of all leave requests.                |
| +-------------------------------------------+ |
| | Leave | Duration | Days | Status | Proof  | |  <- LeaveTable
| | Type  | dates    | num  | badge  | icon   | |
| | reason|          |      |        |        | |
| | ...   |          |      |        |[Eye][x]| |  <- Edit button (NEW, pending only)
| +-------------------------------------------+ |
|                  Page 1 of N  [<<][<][>][>>]   |  <- PaginationFooter (NEW)
+-----------------------------------------------+
```

**Responsive:** Balance card grid collapses to 2-col on sm, 1-col below that. Table scrolls horizontally on mobile.

**Component hierarchy:**

```
<div className="container space-y-8 py-8">
  <div>  <- Header row (flex, md:items-center md:justify-between)
    <div>  <- Title + subtitle
    <Button onClick={setDialogOpen(true)}>Plus Apply Leave</Button>
  </div>
  <section className="space-y-4">  <- Balance
    <div>  <- Title + subtitle
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Object.entries(balance).map => <LeaveBalanceCard />}
    </div>
  </section>
  <section className="space-y-4">  <- Applications
    <div>  <- Title + subtitle
    <LeaveTable data={items} loading={isLoading} />
  </section>
  <ApplyLeaveDialog open={dialogOpen} onOpenChange={setDialogOpen} />
</div>
```

### 2c. Staff Leave Apply/Edit Dialog

**Wireframe (apply mode):**

```
+-------------------------------------------+
| Apply For Leave                      [X]  |
+-------------------------------------------+
| +----------+ +----------+ +----------+    |
| | Casual   | | Patern.  | | Emergency|    |  <- Compact balance cards (NEW)
| | 10 Left  | | 5 Left   | | 3 Left   |    |     Horizontal scroll on mobile
| +----------+ +----------+ +----------+    |
+-------------------------------------------+
| Leave Type                                |
| [Select: Casual Leave v]                  |
|                                           |
| Start Date       End Date                 |
| [date input]     [date input]             |
|                                           |
| <inline error if overlap>                 |  <- NEW: overlap error
|                                           |
| Reason                                    |
| [textarea, 5 rows]                        |
|                                           |
| Proof Document (optional)                 |
| - - - - - - - - - - - - - - - - - - - -  |
|    Upload Image (dropzone)                |  <- NEW: ImageUpload replaces text input
| - - - - - - - - - - - - - - - - - - - -  |
|                                           |
| [Apply Leave] <- full-width button        |
+-------------------------------------------+
```

**Edit mode differences:**
- Title: "Edit Leave Application"
- Button text: "Update Application"
- All fields pre-filled from existing leave data
- Only available when `leave.status === "pending"`

**Component hierarchy:**

```
<Dialog className="max-w-xl">
  <DialogHeader> <DialogTitle /> </DialogHeader>
  <form className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-3">  <- Compact balance cards
      {balance => <CompactBalanceCard title={name} remaining={remaining} />}
    </div>
    <Controller name="type"> <Select> </Controller>
    <div className="grid gap-4 md:grid-cols-2">  <- Date fields
      <Controller name="startDate"> <Input type="date" />
      <Controller name="endDate"> <Input type="date" />
    </div>
    <div className="text-sm text-destructive">  <- Overlap error (conditional)
    <Controller name="reason"> <Textarea />
    <Controller name="proof"> <ImageUpload />  <- replaces <Input type="text">
    <Button type="submit" disabled={mutation.isPending}>
  </form>
</Dialog>
```

### 2d. Admin Leave Management Page (`/leave-management`)

**Wireframe:**

```
+-----------------------------------------------+
| Leave Approval                                 |
| Review and manage employee leave requests.     |
+-----------------------------------------------+
| [All] [Pending] [Approved] [Rejected]          |  <- Filter buttons (NEW)
+-----------------------------------------------+
| +-------------------------------------------+ |
| | Employee | Type | Duration | Status | Act  | |  <- Applications table
| | Avatar   |      | dates    | badge  |      | |
| | Name     |      |          |        | [eye]| |
| | Email    |      |          |        | [v][x]| | pending only
| +-------------------------------------------+ |
|                   Page 1 of N  [<<][<][>][>>]  |  <- PaginationFooter (NEW)
+-----------------------------------------------+
| (Leave Type section renders above this --      |
|  LeaveTypePage is a separate component)        |
+-----------------------------------------------+
```

**Note:** The admin page renders `LeaveTypePage` (types table) + `AdminLeavePage` (applications table) together. The filter buttons go above the applications table only. The types table stays above the applications section.

**Responsive:** Table scrolls horizontally. Filter buttons wrap on mobile.

---

## 3. Interaction Contracts

### 3a. Mail — Row Click -> Detail Dialog

| Property | Value |
|----------|-------|
| **Trigger** | Click any cell in Inbox or Sent table row |
| **Behavior** | Opens Dialog with full mail detail (from, to, cc, bcc, date, body) |
| **Edge cases** | Empty inbox/sent -> "No results." row in table. Missing `cc`/`bcc` -> sections hidden (not rendered). |

### 3b. Mail — Reply Button

| Property | Value |
|----------|-------|
| **Trigger** | Click "Reply" button in mail detail dialog |
| **Behavior** | 1. Close detail dialog. 2. Switch tabs to "compose". 3. Pre-fill `to` field with `[{from}]` of selected mail (as UserSearchPicker chips). 4. Pre-fill `body` with quoted original: each line prefixed with `> `, prepended with `\n\nOn {date}, {from.name} wrote:\n`. 5. Pre-fill `subject` with `Re: {original subject}` (if not already prefixed). |
| **Edge cases** | Original `from` not in search results -> chips are pre-set programmatically (bypass search). Multiple rapid clicks -> only last reply takes effect (form resets each time). |

### 3c. Mail — Send

| Property | Value |
|----------|-------|
| **Trigger** | Click "Send" button (or form submit) |
| **Behavior** | Validate form (zod). If valid, call `sendMail` mutation. On success: toast "Mail sent successfully", reset form, switch to "Sent" tab. On error: toast with server message (from `apiFetch`). |
| **Edge cases** | Empty `to` -> zod error "At least one recipient required". Empty subject/body -> zod errors. `send` mutation isPending -> button shows "Sending..." and is disabled. |

### 3d. Mail — UserSearchPicker Interaction

| Property | Value |
|----------|-------|
| **Trigger** | Type in search input |
| **Behavior** | 1. Input value updates immediately. 2. After 300ms debounce, fire `GET /api/user/{keyword}`. 3. If keyword is empty string, hide dropdown. 4. Show dropdown below input with matching users (max 5 from backend). 5. Each result row: avatar + name + email. 6. Click result -> add as chip to selected list, clear input, hide dropdown. 7. Click chip x -> remove from selected list. |
| **Edge cases** | No results -> "No users found" message in dropdown. Search error -> "Search failed" message in dropdown. Already-selected user in results -> skip in list (avoid confusion). Loading state -> "Searching..." text. |

### 3e. Mail — Pagination

| Property | Value |
|----------|-------|
| **Trigger** | Click page controls in `PaginationFooter` |
| **Behavior** | Update page query param. Re-fetch inbox/sent with new page/limit. Table re-renders with new data. |
| **Edge cases** | Backend returns `data: null` -> treat as empty array. Meta missing -> PaginationFooter shows "1 of 1" with disabled controls. |

### 3f. Leave — Apply Leave

| Property | Value |
|----------|-------|
| **Trigger** | Click "Apply Leave" button (opens dialog), then fill form and click "Apply Leave" submit button |
| **Behavior** | Validate form. On submit: call `applyLeave` mutation. On success: toast "Leave applied successfully", close dialog, invalidate `["leave"]` queries. |
| **Edge cases** | Overlap with existing leave -> server returns error -> display inline below date fields, form stays open. Empty required fields -> zod errors shown via `FieldError`. `apply.isPending` -> button shows "Submitting..." and is disabled. |

### 3g. Leave — Edit Pending Application

| Property | Value |
|----------|-------|
| **Trigger** | Click pencil/edit icon on a pending leave row (staff table), or edit button in detail dialog |
| **Behavior** | 1. Open `ApplyLeaveDialog` in edit mode. 2. Pre-fill all fields from existing `LeaveT` data (type code, dates, reason, proof URL). 3. Show compact balance cards at top. 4. On submit: call `updateApplication` mutation with `{ id, data: { type, startDate, endDate, reason, proof } }`. On success: toast "Leave updated successfully", close dialog. |
| **Edge cases** | Only visible when `leave.status === "pending"`. Edit button hidden for approved/rejected/cancelled. |

### 3h. Leave — Admin Status Filter

| Property | Value |
|----------|-------|
| **Trigger** | Click filter button (All / Pending / Approved / Rejected) |
| **Behavior** | Client-side filter of the full applications array. No API re-fetch — backend returns all records, frontend filters by `leave.status`. Active button has filled/highlighted variant. |
| **Edge cases** | "All" selected -> no filter. No applications match filter -> empty table with "No leave applications found." message. |

### 3i. Leave — Admin Review

| Property | Value |
|----------|-------|
| **Trigger** | Click check (approve) or X (reject) icon on pending row |
| **Behavior** | Open `ReviewLeaveDialog` pre-populated with the leave details. Admin selects approve/reject radio, optionally adds comment, clicks "Submit Decision". |
| **Edge cases** | Both check and X buttons open the same dialog — the radio defaults to "approved", so clicking X should default to "rejected" (set initial value based on which button was clicked). |

### 3j. Leave — Overlap Error Display

| Property | Value |
|----------|-------|
| **Trigger** | Server returns overlap error on apply/update |
| **Behavior** | Parse error message from response. Display as red text below the date fields: `<p className="text-sm text-destructive">{overlapError}</p>`. Form stays open. User adjusts dates and retries. |
| **Edge cases** | Non-overlap errors -> standard toast (existing behavior). Network errors -> toast. |

---

## 4. Form Specifications

### 4a. Mail Compose Form

| Field | Type | Validation | Default |
|-------|------|------------|---------|
| `to` | `UserSearchPicker` (multi) | `z.array(z.any()).min(1, "At least one recipient required")` | `[]` |
| `cc` | `UserSearchPicker` (multi) | `z.array(z.any())` (optional) | `[]` |
| `bcc` | `UserSearchPicker` (multi) | `z.array(z.any())` (optional) | `[]` |
| `subject` | `<Input>` (text) | `z.string().min(1, "Subject is required")` | `""` |
| `body` | `<InputGroupTextarea>` (7 rows) | `z.string().min(1, "Body is required")` | `""` |

**Submit:** `sendMail({ to: ids[], cc: ids[], bcc: ids[], subject, body })`. Maps `MailUser[] -> string[]` (extracts `.id`) before sending.

**Error display:** `FieldError` component below each field (via `fieldState.error`). Pattern: `<Controller> -> <Field> -> <FieldLabel> + control + <FieldError>`.

**Reply mode pre-fill:**
- `to`: `[{ id, name, email, role, image }]` — single-item array with original sender
- `subject`: `"Re: {original subject}"` (prefix if not already)
- `body`: `\n\nOn {formattedDate}, {senderName} wrote:\n> {originalBody lines joined with > }`

### 4b. Leave Apply/Edit Form

| Field | Type | Validation | Default (apply) | Default (edit) |
|-------|------|------------|-----------------|----------------|
| `type` | `<Select>` from leave types | `z.string().min(1, "Please select leave type")` | `""` | `leave.type.code` |
| `startDate` | `<Input type="date">` | `z.string().min(1, "Start date is required")` | `""` | `formatIstDate(leave.startDate)` -> ISO string |
| `endDate` | `<Input type="date">` | `z.string().min(1, "End date is required")` | `""` | `formatIstDate(leave.endDate)` -> ISO string |
| `reason` | `<Textarea>` (5 rows) | `z.string().min(3, "Reason must contain at least 3 characters")` | `""` | `leave.reason` |
| `proof` | `<ImageUpload>` | `z.string().optional()` | `undefined` | `leave.proof` (URL string) |

**Submit (apply):** `applyLeave({ type, startDate, endDate, reason, proof? })`.
**Submit (edit):** `updateLeaveApplication({ id, data: { type, startDate, endDate, reason, proof? } })`.

**Error display:** Standard `FieldError` pattern. Overlap error displayed inline below date grid as `<p className="text-sm text-destructive">{error.message}</p>`.

**Proof upload flow:**
1. `ImageUpload` component renders dropzone
2. User drops image -> crop dialog opens
3. User crops -> uploads to `/api/upload/image`
4. `onUploadSuccess` fires with `{ id, src, alt }`
5. Store `res.file.src` (the URL) in the `proof` field
6. Show preview of uploaded image in place of dropzone

**Edit mode differentiation:** `ApplyLeaveDialog` accepts optional `leave?: LeaveT` prop. When present -> edit mode (title, button text, pre-fill). When absent -> apply mode.

### 4c. Leave Review Form (admin — no changes needed, documenting for reference)

| Field | Type | Validation | Default |
|-------|------|------------|---------|
| `status` | `<RadioGroup>` (approved/rejected) | `z.enum(["approved", "rejected"])` | `"approved"` |
| `managerComment` | `<Textarea>` (4 rows) | `z.string().optional()` | `""` |

**Submit:** `reviewLeaveApplication({ id, data: { status, managerComment? } })`.

### 4d. Leave Type Create/Edit Form (no changes needed, documenting for reference)

| Field | Type | Validation |
|-------|------|------------|
| `name` | `<Input>` | `z.string().min(2)` |
| `code` | `<Input>` (disabled on edit) | `z.string().min(2)` |
| `allocatedDays` | `<Input type="number">` | `z.number().min(0)` |
| `maxCarryForwardDays` | `<Input type="number">` | `z.number().min(0)` |
| `requiresProof` | `<Checkbox>` | `z.boolean()` |
| `minDaysNotice` | `<Input type="number">` | `z.number().min(0)` |
| `isActive` | `<Checkbox>` | `z.boolean()` |
| `description` | `<Textarea>` | `z.string().optional()` |

Cross-field: `maxCarryForwardDays <= allocatedDays` enforced via `.refine()`.

---

## 5. Data Display Patterns

### 5a. Mail Inbox Table

**Columns (from `mailColumns`):**

| Header | Accessor | Cell Renderer |
|--------|----------|---------------|
| From | `from` | Avatar (32x32, rounded-lg) + Name (font-bold) + Email (text) |
| Subject | `subject` | Bold text |
| Body | `body` | Truncated to 100 chars (`body.slice(0, 100)`) |

**Sort:** Client-side on all columns (TanStack `getSortedRowModel`).
**Filter:** Client-side on `subject` column (text input in toolbar).
**Pagination:** Client-side via `getPaginationRowModel()`. 10 rows per page (default). `PaginationFooter` renders page controls.
**Empty state:** "No results." centered in table body.
**Row click:** Opens detail dialog.

### 5b. Mail Outbox Table

**Columns (from `outBoxColumns` — file to be renamed `outbox-column.tsx`):**

| Header | Accessor | Cell Renderer |
|--------|----------|---------------|
| To | `to` | First recipient Avatar + Name + Email. If `to.length > 1`: append "and {N-1} others" as muted text below name. |
| Subject | `subject` | Bold text |
| Body | `body` | Truncated to 100 chars |

**Fix:** Change `accessorKey: "from"` to `accessorKey: "to"` (header says "To", data comes from `row.original.to`).

**Multi-recipient display (D-07):**

```tsx
<p className="font-bold">{user.name}</p>
<p>{user.email}</p>
{row.original.to.length > 1 && (
  <p className="text-xs text-muted-foreground">
    and {row.original.to.length - 1} other{row.original.to.length > 2 ? "s" : ""}
  </p>
)}
```

### 5c. Staff Leave Applications Table

**Columns:**

| Header | Accessor | Cell Renderer |
|--------|----------|---------------|
| Leave | `type.name` | Type name (font-medium) + reason below (text-xs, muted) |
| Duration | `startDate` + `endDate` | `<CalendarRange>` icon + IST-formatted date range |
| Days | `totalDays` | Plain number |
| Status | `status` | `<LeaveStatusBadge status={status} />` |
| Proof | `proof` | `<FileCheck>` icon if present, `-` if not |
| Action | - | `<Eye>` icon (view). If `status === "pending"`: also `<Pencil>` icon (edit). |

**Sort:** Not implemented (simple table, not TanStack).
**Pagination:** `PaginationFooter` below table — page/limit controlled via `useSearchParams`.
**Empty state:** "No leave applications found." centered in Card.
**Loading state:** "Loading leave applications..." centered in Card.

### 5d. Admin Leave Applications Table

**Columns:**

| Header | Accessor | Cell Renderer |
|--------|----------|---------------|
| Employee | `user` | Avatar (44x44) + displayName (font-medium) + email (text-xs, muted) |
| Type | `type.name` | Plain text |
| Duration | `startDate` + `endDate` | IST-formatted date range |
| Status | `status` | `<LeaveStatusBadge status={status} />` |
| Action | - | `<Eye>` (view). If `status === "pending"`: `<Check>` (approve) + `<X>` (reject). |

**Sort:** Not implemented.
**Pagination:** `PaginationFooter` below table. Client-side pagination of full array.
**Filter:** Status filter buttons above table (All / Pending / Approved / Rejected). Client-side filtering.
**Empty state:** "No leave applications found." when filter yields no results.

### 5e. Leave Types Table (no changes)

**Columns:** Name, Code, Days, Carry Forward, Proof (Required/No), Status (Active/Disabled), Edit button.

### 5f. Mail Detail Dialog

**Layout:**
- Title: subject text
- From: Avatar (32x32) + name (bold) + email
- To: Grid of Avatars (responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- Cc: Same grid pattern (conditional, only if cc.length > 0)
- Bcc: Same grid pattern (conditional, only if bcc.length > 0). **Fix:** Label should say "Bcc", not "CC" (current bug at line 447).
- Date: `<strong>Date:</strong> {formatIstDateTime(createdAt)}`
- Separator
- Body: `whitespace-pre-wrap break-all overflow-x-hidden overflow-y-auto` — sanitized (escape HTML entities, preserve line breaks)
- Reply button (new)

**Sanitized body (D-08):** Since the backend already runs DOMPurify on ingest, the stored body is safe. However, for defense-in-depth, escape any residual HTML entities before rendering. Use a simple helper:

```ts
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
```

Then render: `<div className="whitespace-pre-wrap break-all">{escapeHtml(selectedMail.body)}</div>`

---

## 6. Shared Component Spec — UserSearchPicker

### Location

`components/user-search-picker.tsx`

### Props Interface

```ts
type UserSearchPickerProps = {
  value: MailUser[];              // currently selected users
  onChange: (users: MailUser[]) => void;  // callback when selection changes
  label?: string;                 // field label (e.g., "To", "Cc")
  placeholder?: string;           // input placeholder (default: "Search users...")
  multiple?: boolean;             // multi-select (default: true)
  disabled?: boolean;             // disable the input
};
```

### Visual Behavior

**Default state (no input):**

```
+-------------------------------------------+
| To                                        |  <- label
| [chip: Name (email) x] [chip: ...]       |  <- selected chips
| +---------------------------------------+ |
| | Search users...                       | |  <- input field
| +---------------------------------------+ |
+-------------------------------------------+
```

**Search state (typing):**

```
+-------------------------------------------+
| To                                        |
| [chip: Name (email) x]                    |
| +---------------------------------------+ |
| | John                                  | |  <- input
| +---------------------------------------+ |
| +---------------------------------------+ |
| | John Doe    john@example.com          | |  <- dropdown result
| | Johnny S.   johnny@example.com        | |
| +---------------------------------------+ |
+-------------------------------------------+
```

**States:**

| State | Behavior |
|-------|----------|
| **Empty** (no input, no selection) | Input visible, no chips, no dropdown |
| **Typing** (input has text) | After 300ms debounce, fire search. Show "Searching..." if loading. |
| **Results** (search returned) | Dropdown below input with up to 5 results. Each: Avatar (24x24) + name + email. Click -> add chip, clear input, hide dropdown. |
| **Selected** (has chips) | Chips rendered above input. Each chip: `rounded-full bg-muted px-2 py-1 text-sm` with name + (email) + X button. |
| **Error** (search failed) | Dropdown shows "Search failed. Try again." |
| **No results** | Dropdown shows "No users found." |
| **single mode** (`multiple=false`) | No chips. Selected user displayed as text in input field. Dropdown replaces text on next search. |

### Implementation Notes

- **Debounce:** Use `lodash.debounce` or a simple `setTimeout` + `useRef` pattern (300ms). Do NOT fire on every keystroke.
- **Search endpoint:** `GET /api/user/{keyword}` returns up to 5 `MailUser` objects. Already exists in `services/mail.api.ts` as `getSearchUser`.
- **Already-selected filtering:** Filter out users from results whose `id` matches any in `value` array.
- **Keyboard:** Escape closes dropdown. Arrow keys navigate results. Enter selects highlighted result.
- **Click outside:** Close dropdown on blur (with small delay to allow click on result to register).

---

## 7. Visual Constants

### Badge / Status Color Mappings

Already defined in `LeaveStatusBadge` — do NOT change these:

| Status | Badge Variant | Icon | Color |
|--------|--------------|------|-------|
| `approved` | `default` | `CheckCircle2` | Primary/green |
| `pending` | `secondary` | `Clock3` | Muted/gray |
| `rejected` | `destructive` | `XCircle` | Red |
| `cancelled` | `outline` | `Ban` | Border/gray |

### Icon Usage Map

| Action | Icon | File | Context |
|--------|------|------|---------|
| Send mail | `Send` | `lucide-react` | Compose form submit button |
| Remove chip | `X` | `lucide-react` | UserSearchPicker chip remove, compose form |
| Reply | `Reply` | `lucide-react` | Mail detail dialog |
| View detail | `Eye` | `lucide-react` | Leave tables (staff + admin) |
| Edit pending | `Pencil` | `lucide-react` | Staff leave table + detail dialog |
| Approve | `Check` | `lucide-react` | Admin leave table (pending only) |
| Reject | `X` | `lucide-react` | Admin leave table (pending only) |
| Refresh data | `RotateCw` | `lucide-react` | MailDataTable toolbar |
| Column visibility | `ChevronDown` | `lucide-react` | MailDataTable dropdown trigger |
| Date range | `CalendarRange` | `lucide-react` | Staff leave table duration column |
| Proof attached | `FileCheck` | `lucide-react` | Staff leave table proof column |
| Add/create | `Plus` | `lucide-react` | Leave page "Apply Leave" button, leave type "Add" button |
| User avatar fallback | `User` | `lucide-react` | Admin leave table employee column |
| Leave type edit | `Pencil` | `lucide-react` | Leave types table |
| Search | `Search` | `lucide-react` | UserSearchPicker (optional, if adding icon to input) |

### Spacing & Typography

- **Page container:** `container mx-auto` or `container space-y-8 py-8` (existing patterns)
- **Section spacing:** `space-y-4` or `space-y-6` between sections
- **Card padding:** `CardContent className="p-0"` for tables inside cards (existing pattern)
- **Table header font:** `TableHead` default (text-muted-foreground, text-sm)
- **Bold text in tables:** `className="font-bold"` for subjects, names
- **Muted text:** `className="text-muted-foreground"` for subtitles, emails, secondary info
- **Small muted text:** `className="text-xs text-muted-foreground"` for dates, secondary lines
- **Dialog width:** `max-w-xl` (apply dialog), `min-w-1/2` (mail detail), `max-w-lg` (review dialog), `max-w-3xl` (leave detail)
- **Button loading text:** `"{action}..."` pattern — e.g., "Submitting...", "Sending...", "Updating..."

### Chip Styling (UserSearchPicker)

Matches existing mail page chip pattern at `app/(main)/mail/page.tsx:159`:

```
className="flex items-center gap-2 rounded-full bg-muted px-2 py-1 text-sm"
```

### Filter Button Styling (Admin Status Filter)

Use `Button` with variant switching:
- Active filter: `variant="default"` (filled)
- Inactive filters: `variant="outline"` (bordered)

Layout: `className="flex flex-wrap gap-2"` — horizontal row, wraps on mobile.

### Compact Balance Cards (Apply Dialog)

Compact version of `LeaveBalanceCard` — show only title + remaining count, no progress bar:

```
+----------+
| Casual   |  <- capitalize title (text-sm font-medium)
| 10 Left  |  <- remaining count (Badge variant="secondary")
+----------+
```

Layout: `className="grid gap-3 sm:grid-cols-3"` — 3 columns on sm+, stacked on mobile.
Each card: `className="rounded-lg border p-3"` with title and remaining badge.

---

*Phase: 4-Staff Self-Service — Mail & Leave*
*UI spec created: 2026-08-26*
