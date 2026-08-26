# Phase 5: Money & Approval — Reimbursement & Payroll - Research

**Researched:** 2026-08-26
**Domain:** Financial pipeline frontend — bill lifecycle, settlement, payroll management
**Confidence:** HIGH

## Summary

Phase 5 builds two greenfield modules against verified backend source code. The reimbursement module spans a complete bill lifecycle (create → handle → settle → recycle) with two distinct permission-gated surfaces: staff "My Bills" and finance "Bill Management." The payroll module is admin-only with paginated browsing, installment payments, and a manual generation trigger.

The most critical research finding is **six backend quirks that directly contradict CONTEXT.md assumptions** — including a missing bill restore endpoint (REIM-11 is unachievable without backend change), `GET /bills` returning Settlement records instead of Bills, and the settlement auto-creation on accept with a 15-day expiry window. These must be resolved before planning.

**Primary recommendation:** Build service layer against verified backend contracts exactly, not against CONTEXT.md assumptions. Flag missing restore endpoint as a blocker for REIM-11.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Bill CRUD (create/update/delete) | Client → API | Backend (state mutation) | Frontend sends; backend persists + invalidates cache |
| Balance enquiry | Client → API | Backend (computed) | Backend computes from bill + settlement aggregates |
| Handle queue (approve/reject/hold) | Client → API | Backend (notification) | Frontend triggers; backend mutates + notifies user |
| Settlement recording | Client → API | Backend (audit log) | Frontend sends mode/status; backend writes audit log |
| Export/report | Client → API | Backend (BullMQ worker) | Frontend triggers async job; backend delivers via notification |
| Payroll browsing | Client → API | Backend (computed) | Backend filters by year/month; frontend paginates |
| Payroll generation (cron) | Client → API | Backend (batch insert) | Frontend triggers; backend computes + inserts records |
| Installment payments | Client → API | Backend (accumulation) | Frontend sends amount/mode; backend accumulates priorPaid |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-query | ^5.94.5 | Server state (queries + mutations) | Project standard — every module uses it |
| react-hook-form | ^7.71.1 | Form state + validation | Project standard — all forms use it |
| zod | ^4.3.6 | Schema validation + type inference | Project standard — mirrors backend schemas |
| sonner | existing | Toast notifications | Project standard — all user feedback |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | existing | Icons | Status badges, action buttons, sidebar entries |
| date-fns | ^4.1.0 | Date math (indirect via lib/date.ts) | Balance card date calculations |
| @tanstack/react-table | ^8.21.3 | Data tables with sorting/pagination | Bill tables, payroll tables |

### Alternatives Considered
No new dependencies needed. All existing patterns and libraries suffice.

**Installation:**
No new packages to install for this phase.

## Package Legitimacy Audit

No external packages being installed in this phase.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Two sidebar entries: "My Bills" (staff) + "Bill Management" (finance). Staff sees only My Bills; finance sees both. Clean separation via `can()` RBAC.
- **D-02:** Staff "My Bills" page: net balance card on top + own bills table below with status badges, edit/withdraw actions for pending bills.
- **D-03:** Finance "Bill Management" page: two tabs — "Handle Queue" (pending bills with approve/reject/hold, bulk select, search) and "Recycle Bin" (deleted bills, restore).
- **D-04:** Bill detail shown as dialog overlay (consistent with Phase 4 mail detail pattern). Keeps user in table context.
- **D-05:** Staff "My Bills" also has a second tab: Active | Deleted — staff can see and restore their own soft-deleted bills (matches Phase 3 trash pattern).
- **D-06:** Staff create new bills via floating "New Bill" button → dialog with amount, description, date, receipt image upload (up to 10 via `components/image-upload`).
- **D-07:** Staff edit pending bills via row action buttons (Edit/Withdraw). Edit opens pre-filled dialog with amount, description, images only (date locked after creation — matches backend `userBillUpdateSchema`). Withdraw requires confirmation dialog.
- **D-08:** Status badges: colored badges consistent with Phase 3 expiry pattern — pending=yellow, accepted=green, rejected=red, on-hold=blue, settled=gray. Uses existing Badge component.
- **D-09:** Balance card shows single net amount (advance minus expenses) with small breakdown (total advance, total expenses, settled amount). Calls backend `/balance-enquiry` endpoint — server is source of truth.
- **D-10:** Individual bill handling: row action buttons (Approve/Reject/Hold) → dialog with required notes field (minimum length enforced). Notes field serves as implicit confirmation — no separate confirmation dialog for routine actions.
- **D-11:** Bulk handling: multi-select checkboxes on each row → floating action bar appears when 1+ selected with "Approve All" / "Reject All" buttons. Sequential calls against single-bill endpoint. Progress bar with count ("Processing 3/10...") shown during operation.
- **D-12:** Real-time search bar above handle queue table (debounced 300ms) filtering by description, amount, user name. Client-side filtering for small lists, server-side for paginated results.
- **D-13:** Export button above table triggers GET `/export/report` → downloads file via notification action pattern.
- **D-14:** Audit log shown within bill detail dialog — section showing who did what and when. No separate audit log page.
- **D-15:** "Create Advance" button in Bill Management opens dialog using the user-search picker (from Phase 4) to select a user, then amount/description fields. Edit/Delete via row actions on advances in the queue.
- **D-16:** Bill detail dialog shows: receipt images as thumbnail grid with lightbox (full-size overlay on click), lifecycle timeline, and audit log section.
- **D-17:** Lifecycle timeline: vertical timeline with status nodes — Submitted → (Handled: Approved/Rejected/Hold) → Settled. Each node shows timestamp, actor name, and notes. Uses colored status badges.
- **D-18:** Image upload in create/edit form reuses `components/image-upload` component (dropzone + crop, uploads to `/api/upload/image`). Proven in Phase 4 leave proof upload.
- **D-19:** After bill is accepted, "Record Settlement" button appears in bill detail dialog. Opens small dialog with payment mode (Cash/UPI/Cheque/Other as radio buttons) and description field. Matches backend `handleSettleSchema`.
- **D-20:** Recording settlement automatically marks bill as "settled" — no separate approval step. One action completes the lifecycle.
- **D-21:** Settlement status shown as colored node in the bill timeline — "Settled via UPI" (green) or "Settlement Pending" (yellow).
- **D-22:** Separate "Payroll" sidebar entry in admin section. Dedicated page, not a tab under Bill Management. Admin-only via `can()` check.
- **D-23:** Payroll page: paginated table of all records (employee, date, amount, status, mode) + "Run Now" button at top.
- **D-24:** "Run Now" triggers confirmation dialog → POST `/cron` → toast with result. Simple, explicit.
- **D-25:** Installment payment: "Record Payment" row action → dialog with payment mode, amount, description. Shows paid-vs-total progress bar.
- **D-26:** All money mutations (handle/settle/installment/bank-affecting) gate with disabled button + loading spinner when mutation is pending. Server validates anyway — frontend prevents accidental double-click.
- **D-27:** Bulk operations show progress bar with count ("Processing 3/10...") as each item is handled sequentially. Toast on completion with success/failure summary.
- **D-28:** Failed mutations: toast error with server message + dialog stays open so user can retry without re-entering data. Server state unchanged — safe to retry.
- **D-29:** No optimistic updates on any money mutation — server state always reflects truth after any action. Hook/mutation tests verify this.

### the agent's Discretion
- Exact file names for feature components within `features/reimbursement/` and `features/payroll/`
- Bill management page route structure under `app/(main)/`
- Whether staff and finance share a route group or stay separate
- Sidebar section placement (which group My Bills and Bill Management go under)
- Table column definitions and sorting defaults
- Test scope beyond minimum contract verification
- Whether the balance card uses a grid or inline layout
- Filter button styling (which shadcn variants)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REIM-01 | Staff can submit an expense bill (amount, description, receipt images ≤10 via uploader) | `POST /api/reimbursement/bill` — `userBillCreateSchema`: amount, description, date, images[]. `authorize('write', 'postReimbursement')`. Images are ObjectId refs to Media collection. |
| REIM-02 | Staff can see their advance-vs-expenses net balance enquiry card | `GET /api/reimbursement/balance-enquiry` — returns `{ PocketUse, AdvanceUse, SettledUse, Total }` + optional `Empty: true`. No authorize guard (uses req.user). |
| REIM-03 | Staff can see their own bills with status badges (pending/approved/rejected/held/settled) | `GET /api/reimbursement/mybills?isDeleted=false` — returns Bill[] with status enum `['pending', 'accept', 'reject', 'on-hold']`. No authorize guard (uses req.user). |
| REIM-04 | Staff can edit or withdraw their own pending bills | `PATCH /api/reimbursement/:billId` — `userBillUpdateSchema`: amount, description, images (all partial). `authorize('update', 'postReimbursement')`. Backend only allows edit on `pending` or `on-hold` status. |
| REIM-05 | Finance can work a handle queue: approve/reject/hold each bill with required notes | `POST /api/reimbursement/handle/:billId` — `handleBillSchema`: `{ status: 'accept'|'reject'|'on-hold', reason: string }`. `authorize('write', 'preReimbursement')`. Accept auto-creates Settlement. |
| REIM-06 | Finance can bulk-handle bills (multi-select, sequential calls) | Sequential `POST /api/reimbursement/handle/:billId` calls per selected bill. Frontend manages progress state. |
| REIM-07 | Finance can record how a bill was settled (UPI/bank transfer) | `POST /api/reimbursement/settlement/:settleId` — `handleSettleSchema`: `{ mode, status, description }`. `authorize('write', 'preReimbursement')`. Modes: `['cash', 'upi', 'cheque', '-']`. |
| REIM-08 | Bill detail shows lifecycle timeline (submitted → handled → settled) | Compose from bill status + audit log. Backend has no single "timeline" endpoint — build from bill status + `GET /audit-log`. |
| REIM-09 | Finance can search/filter all bills by description, amount, date, user | `GET /api/reimbursement/?description=&amount=&date=&user=&isDeleted=false&page=&limit=` — `searchBillQuerySchema`. `authorize('read', 'preReimbursement')`. Server-side paginated search. |
| REIM-10 | Finance can create/edit/delete advance bills on behalf of a user | `POST /api/reimbursement/admin/:user` — `adminBillCreatSchema`: advance, date, description. `PATCH /api/reimbursement/admin/:billId` — `adminBillUpdateSchema`: advance, description (partial). `DELETE /api/reimbursement/admin/:billId`. All `authorize('write'/'update'/'delete', 'preReimbursement')`. Uses user-search picker for user selection. |
| REIM-11 | Deleted bills are recoverable via recycle bin + restore | **BLOCKER**: Backend has `GET /recyclebills` but NO restore endpoint. Soft-deleted bills (`isDeleted: true`) have no way to be un-deleted via API. Must flag to user. |
| REIM-12 | Finance can view the bill audit log | `GET /api/reimbursement/audit-log?page=&limit=` — returns AuditLog[] with `{ id, date, description, amount, from, to }`. `authorize('read', 'preReimbursement')`. Paginated, no filtering. |
| PAYR-01 | Admin can browse paginated payroll records across employees | `GET /api/payroll?page=&limit=&year=&month=` — returns Payroll[] filtered by `dateOfCreation` year/month range. `authorize('read', 'payroll')`. Paginated with meta. |
| PAYR-02 | Admin can view per-employee payroll history | `GET /api/payroll/user/:id?page=&limit=` — returns Payroll[] for specific user. `authorize('read', 'payroll')`. Paginated. |
| PAYR-03 | Admin can record installment payments and see paid-vs-total progress | `PUT /api/payroll/:id` — `createPayrollSchema`: `{ mode, paidSalary }`. `authorize('update', 'payroll')`. Backend accumulates priorPaid if status is 'partially-paid'. Progress = `paidSalary / expectedSalary`. |
| PAYR-04 | Admin can trigger payroll generation manually ("run now") | `POST /api/payroll/cron` — no request body. `authorize('write', 'payroll')`. Returns `{ message: 'Payroll calculation', data: null }`. Runs synchronously (not truly async). |
</phase_requirements>

## Backend Contract Map (Verified Against Source)

> All paths verified by reading backend source files directly. Ground truth, not documentation.

### Reimbursement — Mounted at `/api/reimbursement`

| Method | Path | Auth Guard | Request Body/Query | Response Shape |
|--------|------|------------|-------------------|----------------|
| POST | `/bill` | `authorize('write', 'postReimbursement')` | `{ amount, description, date, images: ObjectId[] }` | `{ data: null }` |
| PATCH | `/:billId` | `authorize('update', 'postReimbursement')` | `{ amount?, description?, images?: ObjectId[] }` | `{ data: null }` |
| DELETE | `/:billId` | `authorize('delete', 'postReimbursement')` | — | `{ data: null }` |
| POST | `/admin/:user` | `authorize('write', 'preReimbursement')` | `{ advance, date, description }` | `{ data: null }` |
| PATCH | `/admin/:billId` | `authorize('update', 'preReimbursement')` | `{ advance?, description? }` | `{ data: null }` |
| DELETE | `/admin/:billId` | `authorize('delete', 'preReimbursement')` | — | `{ data: null }` |
| POST | `/handle/:billId` | `authorize('write', 'preReimbursement')` | `{ status: 'accept'\|'reject'\|'on-hold', reason: string }` | `{ data: null }` — accept also creates Settlement |
| POST | `/settlement/:settleId` | `authorize('write', 'preReimbursement')` | `{ mode, status, description }` | `{ data: HandleSettleSchema }` |
| GET | `/mybills` | **None** (uses req.user) | `?isDeleted=false\|true` | `{ data: Bill[] }` — no meta |
| GET | `/recyclebills` | `authorize('read', 'preReimbursement')` | — | `{ data: Bill[] }` — no meta |
| GET | `/audit-log` | `authorize('read', 'preReimbursement')` | `?page=&limit=` | `{ data: AuditLog[], meta }` |
| POST | `/create-log` | `authorize('write', 'preReimbursement')` | `{ id, date, description, amount, from, to }` | — |
| GET | `/balance-enquiry` | **None** (uses req.user) | — | `{ data: { PocketUse, AdvanceUse, SettledUse, Total, Empty? } }` |
| GET | `/export/report` | `authorize('read', 'preReimbursement')` | `?user=&status=&from=&to=&format='pdf'\|'xlsx'` | `{ data: { jobId, format, count } }` or processing message |
| GET | `/bills` | `authorize('write', 'preReimbursement')` | `?page=&limit=` | `{ data: Settlement[], meta }` — **NOTE: returns Settlements, not Bills** |
| GET | `/` | `authorize('read', 'preReimbursement')` | `?description=&amount=&date=&user=&isDeleted=&page=&limit=` | `{ data: Bill[], meta }` — **requires ≥1 search param** |
| GET | `/:billId` | `authorize('read', 'preReimbursement')` | — | `{ data: Settlement }` — **NOTE: queries Settlement collection** |
| GET | `/:id` | `authorize('read', 'preReimbursement')` | `?page=&limit=` | `{ data: Settlement[], meta }` — settlements by user ID |

### Payroll — Mounted at `/api/payroll`

| Method | Path | Auth Guard | Request Body/Query | Response Shape |
|--------|------|------------|-------------------|----------------|
| POST | `/cron` | `authorize('write', 'payroll')` | — (empty body) | `{ data: null, message: 'Payroll calculation' }` |
| POST | `/approve/:id` | `authorize('update', 'payroll')` | — (empty body) | `{ data: Payroll }` — sets status to 'approved' |
| PUT | `/:id` | `authorize('update', 'payroll')` | `{ mode, paidSalary }` | `{ data: null }` — accumulates installment |
| GET | `/` | `authorize('read', 'payroll')` | `?page=&limit=&year=&month=` | `{ data: Payroll[], meta }` — filtered by year/month |
| GET | `/user/:id` | `authorize('read', 'payroll')` | `?page=&limit=` | `{ data: Payroll[], meta }` — per-employee |
| GET | `/:id` | `authorize('read', 'payroll')` | — | `{ data: Payroll[] }` — **NOTE: returns array, not single** |

## Backend Quirks & Gotchas

### Quirk 1: `GET /bills` Returns Settlements, Not Bills
**What:** The `getAllBillsController` queries the `Settlement` collection and returns `getSettleBillResponseSchema` shapes. The endpoint name is misleading.
**Impact:** Finance "Handle Queue" cannot use `GET /bills` — it needs pending bills, not settlements. Use `GET /?isDeleted=false` with a status filter (or `GET /mybills` for staff). The `/bills` endpoint is for viewing settlement records.
**Workaround:** The search endpoint `GET /?status=pending` can retrieve pending bills. For the handle queue, use `GET /?isDeleted=false` and filter client-side, or rely on `GET /mybills?isDeleted=false` which returns Bill shapes.

### Quirk 2: No Bill Restore Endpoint
**What:** Backend has `DELETE /:billId` (sets `isDeleted: true`) and `GET /recyclebills` (lists deleted bills), but **no PATCH/POST endpoint to restore** (`isDeleted: false`).
**Impact:** REIM-11 (recoverable deleted bills) and D-05 (staff Active/Deleted tabs) are **unachievable** without backend changes.
**Resolution needed:** Ask user whether to (a) implement backend restore endpoint, (b) descope REIM-11, or (c) leave UI shell with restore button that calls a non-existent endpoint (will fail).

### Quirk 3: Settlement Auto-Created on Accept
**What:** `handleBillController` auto-creates a Settlement record when status transitions to `accept`. The settlement has `mode: '-'`, `amount: bill.advance - bill.amount`, and a 15-day `expiredAt`.
**Impact:** Finance does NOT explicitly create settlements — they are created implicitly when a bill is accepted. The "Record Settlement" button (D-19) calls `POST /settlement/:settleId` to update an **existing** settlement, not create a new one.
**Frontend implication:** After accepting a bill, the UI must fetch the newly created settlement ID from the bill detail (which queries the Settlement collection via `GET /:billId`). The settlement's `id` is needed for the "Record Settlement" action.

### Quirk 4: `handleBillSchema` Uses `reason`, Not `notes`
**What:** The backend schema field is `reason: z.string()`. CONTEXT.md D-10 calls it "notes."
**Impact:** UI label should be "Notes" but the API field is `reason`. Schema must map correctly.

### Quirk 5: Balance Enquiry Returns Computed String
**What:** `Total` field is a pre-formatted string: `"1200 Amount to Received"` or `"500 Amount to Paid"`. Not a number.
**Impact:** Frontend must parse or display as-is. Cannot do math on `Total`. Use `PocketUse`, `AdvanceUse`, `SettledUse` (all numbers) for breakdown.

### Quirk 6: `GET /:id` Returns Payroll Array, Not Single
**What:** `getPayrollByPayrollIdController` uses `payrollResponseSchema.parse(normalized)` which is `z.array(...)`.
**Impact:** Even single-record queries return `Payroll[]`. Frontend must handle `data[0]`.

### Quirk 7: Payroll Generation Runs Synchronously
**What:** `POST /cron` processes all accounts in a single request — calculates attendance, leave deductions, inserts Payroll records. No async/queue.
**Impact:** Can be slow for large orgs. "Run Now" toast should show loading state. Backend returns `{ data: null }` on success — no record count.

### Quirk 8: Payroll Update Accumulates `paidSalary`
**What:** `PUT /:id` reads `employee.paidSalary` from DB, adds new `paidSalary` from body, sets total as `employee.paidSalary`. Prior value is preserved only when `status === 'partially-paid'`.
**Impact:** Frontend should send the **incremental** amount, not cumulative. The "paid-vs-total" progress bar should display `employee.paidSalary / employee.expectedSalary` from the GET response.

### Quirk 9: `POST /create-log` Is a Separate Endpoint
**What:** Audit log entries are created via `POST /create-log`, not automatically by bill handling.
**Impact:** Frontend may need to explicitly create audit log entries after settlement. Check if settlement controller calls `auditLog()` — YES it does (`handle-settle.controller.ts:94`). But bill handling (`handle-bill.controller.ts`) does NOT create audit logs. Only settlement completion creates them.

### Quirk 10: `GET /` Requires ≥1 Search Parameter
**What:** `searchBillController` throws `ApiError(400, 'Please provide search parameter.')` if no query params are provided.
**Impact:** Cannot use `GET /` as a "list all bills" endpoint. For the handle queue (all pending bills), use `GET /?status=pending&isDeleted=false` or similar combination.

## RBAC Permission Model (Verified Against Source)

**Two separate permission resources** for reimbursement:

| Resource | Used By | Who Has What |
|----------|---------|--------------|
| `postReimbursement` | User CRUD (create/update/delete own bills) | admin: read+write+update+delete; manager: read+write+update+delete; user: write+update+delete |
| `preReimbursement` | Admin/finance operations (handle, settle, search, audit, advance bills) | admin: read+write+update+delete; manager: read+write+update+delete; user: update only |

**Payroll:**

| Resource | Who Has What |
|----------|--------------|
| `payroll` | admin: read+write+update; manager: none; user: none |

**Key observations:**
- `user:preReimbursement:update` exists in the permission matrix — staff CAN access settlement-related update endpoints. This seems unintended but is the backend reality.
- `mybills` and `balance-enquiry` have NO `authorize()` middleware — they use `req.user.id` directly. Any authenticated user can call them.
- `recyclebills`, `audit-log`, `export/report`, and `GET /` all require `preReimbursement:read` — finance/admin only.

## Response Shape Reference

### Bill Response (from `getBillResponseSchema`)
```typescript
{
  id: string;           // bill _id
  user: string;         // user ObjectId (NOT populated)
  image?: string;       // optional single image
  amount: number;       // staff-entered expense amount
  advance: number;      // admin-entered advance (0 for user-created bills)
  date: Date;           // bill date
  description: string;  // bill description
  status: 'pending' | 'accept' | 'reject' | 'on-hold';
  reason?: string;      // handle reason/notes
  isDeleted: boolean;   // soft-delete flag
}
```

### Settlement Response (from `getSettleBillResponseSchema`)
```typescript
{
  id: string;           // settlement _id
  bill: string;         // bill ObjectId
  user: string;         // user ObjectId
  amount: number;       // advance - amount (net settlement)
  mode: 'cash' | 'upi' | 'cheque' | '-';
  date: Date;           // creation date
  manager: string;      // admin/manager ObjectId
  status: 'pending' | 'settle' | 'expired' | 'on-hold';
  expiredAt: Date;      // 15 days from creation
  settleDate?: Date;    // when settlement was completed
}
```

### Payroll Response (from `payrollResponseSchema`)
```typescript
{
  id: string;
  user: string;              // user ObjectId
  dateOfCreation: Date;
  dateOfPayment?: Date;
  mode: 'cash' | 'cheque' | 'upi' | '-';
  baseSalary: number;
  expectedSalary: number;    // after deductions
  paidSalary?: number;       // cumulative amount paid
  bonus: number;
  deduction: string[];       // human-readable deduction descriptions
  status: 'paid' | 'unpaid' | 'partially-paid' | 'approved';
}
```

### Balance Enquiry Response
```typescript
{
  PocketUse: number;     // sum of accepted bill amounts
  AdvanceUse: number;    // sum of accepted bill advances
  SettledUse: number;    // sum of settled settlement amounts
  Total: string;         // e.g., "1200 Amount to Received" or "500 Amount to Paid"
  Empty?: true;          // present only when no bills exist
}
```

### Audit Log Response (from `createLogResponseSchema`)
```typescript
{
  id: string;
  date: string;          // ISO date string
  description: string;
  amount: number;
  from: string;          // sender name (e.g., "saher" or employee displayName)
  to: string;            // receiver name
}
```

## Status Enum Mapping

| Domain | Backend Value | Frontend Badge | Color (D-08) |
|--------|--------------|----------------|--------------|
| Bill | `pending` | Pending | yellow |
| Bill | `accept` | Accepted | green |
| Bill | `reject` | Rejected | red |
| Bill | `on-hold` | On Hold | blue |
| Settlement | `pending` | Settlement Pending | yellow |
| Settlement | `settle` | Settled | gray |
| Settlement | `expired` | Expired | red |
| Settlement | `on-hold` | On Hold | blue |
| Payroll | `paid` | Paid | green |
| Payroll | `unpaid` | Unpaid | yellow |
| Payroll | `partially-paid` | Partial | blue |
| Payroll | `approved` | Approved | green |

## Codebase Patterns to Follow

### Service Layer Pattern (from `services/notice.api.ts`)
- Zod schema mirrors backend exactly, exported with inferred type
- One async function per endpoint using `apiFetch<T>()`
- Returns `res.data` for single items, `normalizeList(res)` for paginated lists

### Hook Pattern (from `hooks/use-notice.ts`)
- Single hook per module (e.g., `useReimbursement`, `usePayroll`)
- `useQuery` for lists/detail, `useMutation` for writes
- All mutations invalidate parent query key on success
- Returns flat object bag

### Trash Tab Pattern (from `app/(main)/noticeboard/page.tsx`)
- `<Tabs defaultValue="active">` with "Active" and "Trash" triggers
- Active tab: main content
- Trash tab: `<TrashTabPattern>` or custom deleted bills list

### Pagination Pattern
- `normalizeList(res)` from `lib/normalize-list.ts` handles both `total` and `totalPages` field names
- `PaginationFooter` from `components/shared/pagination-footer.tsx`

### Export/Download Pattern
- Backend queues BullMQ job, returns `{ jobId, format, count }`
- Download arrives as notification with `action.type === "download"` and `action.url` pointing to file
- Frontend shows toast "check notifications for download" after triggering export
- Notification box (`features/notification/notification-box.tsx`) renders action button

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bill restore | Custom restore UI | Flag as blocker — no backend endpoint exists | Would silently fail; need backend support first |
| Balance calculation | Client-side math from bills | `GET /balance-enquiry` | Server computes accurate aggregates including settlements |
| Settlement creation | Auto-create on accept | Backend `handleBillController` auto-creates | Settlement is created server-side when bill is accepted |
| Audit log entries | Client-side tracking | Backend `auditLog()` utility + `GET /audit-log` | Audit logs are written by backend during settlement |
| Export download | Direct file download | Notification action pattern | Backend queues async job; file arrives via notification |
| Pagination math | Custom page calculation | `normalizeList()` + `PaginationFooter` | Handles both `total` and `totalPages` field names |

## Common Pitfalls

### Pitfall 1: Confusing Bill vs Settlement Endpoints
**What goes wrong:** Using `GET /bills` expecting Bill shapes but getting Settlement shapes.
**Why it happens:** Endpoint naming is misleading — `getAllBillsController` queries Settlement collection.
**How to avoid:** For bill data, use `GET /mybills` (staff) or `GET /?status=pending&isDeleted=false` (finance handle queue). Reserve `GET /bills` for viewing settlement records.

### Pitfall 2: Settlement ID Not Available on Fresh Accept
**What goes wrong:** After accepting a bill, trying to call `POST /settlement/:settleId` but not knowing the settlement ID.
**Why it happens:** Settlement is created asynchronously in the handle controller; the response is `{ data: null }`.
**How to avoid:** After accepting a bill, re-fetch bill detail via `GET /:billId` which returns the Settlement record (the controller queries Settlement collection by bill ID). Extract settlement `id` from the response.

### Pitfall 3: Search Endpoint Requires Parameters
**What goes wrong:** Calling `GET /?isDeleted=false` with no other params — backend throws 400.
**Why it happens:** `searchBillController` requires at least one of: description, amount, date, user.
**How to avoid:** Always include at least `description=` (empty string) or use `GET /mybills?isDeleted=false` for staff view. For finance handle queue, use a meaningful search or the `GET /bills` endpoint (which returns settlements with pagination).

### Pitfall 4: Payroll `/:id` Returns Array
**What goes wrong:** Treating `data` as a single object when it's actually `Payroll[]`.
**Why it happens:** Backend uses `payrollResponseSchema` which is `z.array(...)` even for single-record queries.
**How to avoid:** Always treat `data` as array and access `data[0]` for single-record payroll endpoints.

### Pitfall 5: `user` Fields Are IDs, Not Populated Objects
**What goes wrong:** Trying to render `bill.user.name` when `user` is just a string ID.
**Why it happens:** Backend uses `normalizeDoc()` which doesn't populate ObjectId references.
**How to avoid:** For display names, either (a) cross-reference from the `useMe()` cache or user list, or (b) accept that bill tables show user IDs and resolve names client-side. The `user-search-picker` API returns `{ id, name, email }` which can be cached.

### Pitfall 6: Balance `Total` Is a String, Not Number
**What goes wrong:** Trying to do math on `Total` or format it as currency.
**Why it happens:** Backend pre-formats: `"1200 Amount to Received"`.
**How to avoid:** Use `PocketUse`, `AdvanceUse`, `SettledUse` (all numbers) for breakdown. Display `Total` as-is for the summary line.

### Pitfall 7: Export Is Async — No Immediate Download
**What goes wrong:** Expecting `GET /export/report` to return a file URL.
**Why it happens:** Backend queues BullMQ job. Response is either `{ data: null }` (processing), `{ data: null }` (already completed, check notifications), or `{ data: { jobId, format, count } }`.
**How to avoid:** Show toast "Report generation started — check notifications for download." The download link arrives via the notification system with `action.type === "download"`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Bill restore endpoint does not exist in backend | Quirk 2 / REIM-11 | If backend has restore endpoint not in routes file, REIM-11 is achievable without changes |
| A2 | `GET /bills` returns Settlement records (not Bills) | Quirk 1 | If this is a bug in backend and should return Bills, handle queue implementation changes |
| A3 | Payroll `POST /cron` runs synchronously (not async) | Quirk 7 | If it's actually async, "Run Now" feedback pattern changes |
| A4 | The `user` field in bill/settlement responses is always a string ID (never populated) | Pitfall 5 | If backend populates in some cases, display logic may need adjustment |
| A5 | Backend `POST /create-log` is never called automatically — only via explicit API call | Quirk 9 | If handle-bill also creates audit logs, timeline data source changes |

**If this table is empty:** Not applicable — 5 assumptions flagged for validation.

## Open Questions

1. **Bill Restore Endpoint Missing (REIM-11 blocker)**
   - What we know: Backend has `DELETE /:billId` (soft-delete) and `GET /recyclebills` (list deleted), but no restore endpoint.
   - What's unclear: Whether backend team will add restore endpoint, or if this requirement should be descoped.
   - Recommendation: Flag to user immediately. Options: (a) backend adds `PATCH /:billId/restore` matching noticeboard pattern, (b) descope REIM-11, (c) leave restore button in UI that calls non-existent endpoint.

2. **User Name Resolution in Bill Tables**
   - What we know: Bill/settlement responses contain `user: string` (ObjectId), not populated user objects.
   - What's unclear: How to display user names in finance tables without N+1 API calls.
   - Recommendation: Cache user list from `GET /api/admin/users` (admin endpoint) or `GET /api/user/:keyword` (search endpoint). Build a `useUserMap()` hook that maps IDs to names.

3. **Settlement Availability After Accept**
   - What we know: Accepting a bill auto-creates a settlement. The settlement ID is needed for "Record Settlement."
   - What's unclear: Whether the bill detail endpoint (`GET /:billId`) reliably returns the settlement with its `id`.
   - Recommendation: After accepting, re-fetch bill detail. The controller queries `Settlement.findById(billId)` — this returns the settlement document with `_id`. Verify the response schema includes this field (it does: `getSettleBillResponseSchema` has `id: z.string()`).

4. **Export Notification Pattern**
   - What we know: Backend queues BullMQ job and returns processing/complete message. Download arrives via notification.
   - What's unclear: The exact notification action shape for download (need to verify `notification-box.tsx` renders download buttons).
   - Recommendation: Check `features/notification/notification-box.tsx` for action button rendering logic. If not implemented, this is a Phase 7 (AUDT-04) concern — not blocking Phase 5.

5. **`GET /bills` vs `GET /` for Handle Queue**
   - What we know: `GET /bills` returns paginated Settlements. `GET /?status=pending&isDeleted=false` should return pending Bills.
   - What's unclear: Whether the search endpoint reliably supports `status` as a query parameter (it's not in `searchBillQuerySchema`).
   - Recommendation: The `searchBillQuerySchema` does NOT include `status` — only `description`, `amount`, `user`, `date`, `isDeleted`. For the handle queue, either use `GET /mybills?isDeleted=false` and filter client-side for pending, or use client-side filtering on the full non-deleted list. This is a design decision for the planner.

## Sources

### Primary (HIGH confidence)
- `../saher-backend/src/reimbursement/reimbursement.routes.ts` — All reimbursement endpoint paths, methods, and auth guards
- `../saher-backend/src/reimbursement/bill/schema.ts` — Bill input schemas (userBillCreateSchema, userBillUpdateSchema, adminBillCreatSchema, adminBillUpdateSchema)
- `../saher-backend/src/reimbursement/settlement/schema.ts` — Settlement input schemas (handleBillSchema, handleSettleSchema)
- `../saher-backend/src/reimbursement/get-bill/get-bill.schema.ts` — Response schemas (getBillResponseSchema, getSettleBillResponseSchema, searchBillQuerySchema)
- `../saher-backend/src/payroll/payroll.routes.ts` — All payroll endpoint paths, methods, and auth guards
- `../saher-backend/src/payroll/schema.ts` — Payroll input/response schemas
- `../saher-backend/src/database/bill.model.ts` — Bill entity shape, billStatus enum
- `../saher-backend/src/database/settlement.model.ts` — Settlement entity shape, settleStatus and modes enums
- `../saher-backend/src/database/payroll.model.ts` — Payroll entity shape, salaryStatus and salaryMode enums
- `../saher-backend/src/database/audit-log.model.ts` — AuditLog entity shape
- `../saher-backend/src/reimbursement/settlement/handle-bill.controller.ts` — Settlement auto-creation logic on accept
- `../saher-backend/src/reimbursement/settlement/handle-settle.controller.ts` — Settlement completion logic
- `../saher-backend/src/reimbursement/balance-enquiry/user-balance-enquiry.controller.ts` — Balance computation logic
- `../saher-backend/src/reimbursement/export/bill-report.ts` — Export/report async queue logic
- `../saher-backend/src/payroll/payroll-management.cron.ts` — Payroll generation cron logic
- `../saher-backend/src/payroll/update-payroll.controller.ts` — Installment payment accumulation logic
- `../saher-backend/src/reimbursement/get-bill/my-bills.controller.ts` — My bills endpoint (no auth guard)
- `../saher-backend/src/reimbursement/get-bill/search-bill.controller.ts` — Search and settlement-by-user endpoints
- `../saher-backend/src/reimbursement/get-bill/recycle-bill.controller.ts` — Recycle bin endpoint
- `../saher-backend/src/reimbursement/get-bill/get-all-bills.controller.ts` — "All bills" (actually settlements)
- `../saher-backend/src/reimbursement/get-bill/bill-by-id.controller.ts` — Bill by ID (actually settlement by ID)

### Secondary (MEDIUM confidence)
- `lib/permissions.ts` — Permission matrix verified against backend `role-permission.ts`
- `components/user-search-picker.tsx` — Existing component for advance bill user selection
- `lib/normalize-list.ts` — Pagination normalization utility
- `services/notice.api.ts` — Reference service pattern for new modules
- `hooks/use-notice.ts` — Reference hook pattern for new modules
- `app/(main)/noticeboard/page.tsx` — Reference trash tab pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all existing project patterns
- Architecture: HIGH — backend contracts verified against source code
- Pitfalls: HIGH — 10 quirks identified from actual controller logic, not documentation

**Research date:** 2026-08-26
**Valid until:** 2026-09-26 (backend contracts are stable; no expected API changes)
