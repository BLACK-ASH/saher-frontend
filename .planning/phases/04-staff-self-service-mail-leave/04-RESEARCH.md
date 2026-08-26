# Phase 4: Staff Self-Service — Mail & Leave - Research

**Researched:** 2026-08-26
**Domain:** Internal mail + leave lifecycle
**Confidence:** HIGH (backend contracts verified against source; frontend gaps clearly mapped)

## Summary

Both mail and leave already have partial implementations — service layers, hooks, feature components, and page routes all exist. The work is audit-fix + gap-fill, not build-from-scratch. Key gaps: mail service has no zod schemas (D-21), compose form has no validation (D-06), user-search picker is copy-pasted 3x (D-05), reply is missing (D-04), leave apply dialog proof is a text input (D-12), staff/admin leave tables lack PaginationFooter (D-15), admin review queue has no status filter (D-13). The backend mail endpoints DO return pagination meta — the frontend just isn't using it. The user search endpoint at `GET /api/user/:keyword` returns up to 5 matches.

**Critical backend verification:** Backend mail endpoints accept `page`/`limit` query params and return `{ page, limit, count, total }` meta. Backend leave applications return full arrays (no pagination params in the controller). The `sendMail` controller returns `data: null` — the frontend's `sendMail` service must not rely on response data.

---

## 1. Backend Contract Findings

### Mail Endpoints

| Endpoint | Method | Auth Guard | Request Shape | Response Shape |
|----------|--------|------------|---------------|----------------|
| `/api/mail` | GET | `protectedRoute` (any user) | Query: `{ page?: number (default 1), limit?: number (default 10, max 50) }` | `{ success, message, data: InBoxMailT[], meta: { page, limit, count, total } }` |
| `/api/mail/` | POST | `authorize('write', 'mail')` | Body: `{ to: string[], cc?: string[], bcc?: string[], subject: string, body: string }` | `{ success, message: "Mail sent successfully", data: null }` |
| `/api/mail/outbox` | GET | `protectedRoute` (any user) | Query: `{ page?: number (default 1), limit?: number (default 10, max 50) }` | `{ success, message, data: OutBoxMailT[], meta: { page, limit, count, total } }` |
| `/api/user/:keyword` | GET | `protectedRoute` (any user) | Param: keyword string (regex-safe) | `{ success, message, data: MailUserT[] }` (max 5 results) |

**Mail schema details (from `mail.schema.ts`):**
- `InBoxMailSchema` — does NOT include `bcc` field (hidden from inbox recipients)
- `OutBoxMailSchema` — includes `bcc` field
- `MailUserSchema` = `{ id, name, email, role, image: { id, src, alt } }`
- `sendMailSchema` — `to` min 1, `subject` min 1 + max 255, `body` min 1 (sanitized via DOMPurify)
- Inbox controller does NOT use zod parse on the response (only outbox controller does `z.array(OutBoxMailSchema).parse(normalized)`)
- Inbox controller response: `{ page, limit, count, total: Math.ceil(count/limit) }`

**Important:** `sendMail` controller returns `data: null`. The frontend `sendMail` service currently types the response as `MailT` — this is wrong and will cause a runtime error if the response data is accessed.

### Leave Endpoints

| Endpoint | Method | Auth Guard | Request Shape | Response Shape |
|----------|--------|------------|---------------|----------------|
| `/api/leave/type` | GET | `protectedRoute` (any user) | None | `{ success, message, data: LeaveTypeT[] }` |
| `/api/leave/type` | POST | `authorize('write', 'leaveType')` | Body: `createLeaveTypeSchema` | `{ success, message, data: null }` |
| `/api/leave/type/:id` | PUT | `authorize('update', 'leaveType')` | Body: `updateLeaveTypeSchema` (partial) | `{ success, message, data: LeaveTypeT }` |
| `/api/leave/application/apply` | POST | `authorize('write', 'leave')` | Body: `{ type: string, startDate: Date, endDate: Date, reason: string (5-400 chars), proof?: string }` | `{ success, message, data: null }` |
| `/api/leave/application/update/:id` | PUT | `authorize('update', 'leave')` | Body: partial of above (at least 1 field required) | `{ success, message, data: LeaveT }` |
| `/api/leave/application/review/:id` | PUT | `authorize('update', 'leave')` | Body: `{ status: 'approved'\|'rejected', managerComment?: string (max 400) }` | `{ success, message, data: LeaveT }` |
| `/api/leave/application` | GET | `protectedRoute` (filtered by `req.user.id`) | None (no pagination params in controller) | `{ success, message, data: LeaveT[] \| null }` |
| `/api/leave/application/all` | GET | Controller: role check (`user`/`intern` → 400) | None | `{ success, message, data: LeaveT[] \| null }` |
| `/api/leave/balance` | GET | `protectedRoute` | None | `{ success, message, data: { id, user, year, balance: { [leaveName]: { used, remaining } } } }` |

**Leave schema details (from `leave.schema.ts`):**
- `getLeaveApplicationSchema` = `{ id, user: userSchemaFinal, startDate, endDate, totalDays, reason, type: { name, code }, proof?, status: 'pending'|'approved'|'rejected'|'cancelled', approvedBy?, managerComment? }`
- `leaveTypeSchemaBase` = `{ name, description?, code (uppercase), allocatedDays (1-365), maxCarryForwardDays (0-365), requiresProof, minDaysNotice (0-365), isActive }`
- `createLeaveTypeSchema` adds refine: `maxCarryForwardDays <= allocatedDays`
- `updateLeaveTypeSchema` = partial + same refine
- Backend `createLeaveApplicationSchema` uses `z.coerce.date()` for dates, `reason` min 5 + max 400
- Backend `updateLeaveApplicationSchema` is partial — any subset of fields allowed

**Critical backend note:** Staff application endpoint (`GET /api/leave/application`) returns FULL array, no pagination in controller. Frontend must use client-side pagination. The `getAllLeaveApplicationController` also returns full array.

### Upload Endpoint

| Endpoint | Method | Auth Guard | Request Shape | Response Shape |
|----------|--------|------------|---------------|----------------|
| `/api/upload/image` | POST | `protectedRoute` | FormData: `image` (single file), `name` (alt text) | `{ success, message, file: { id, src, alt } }` |
| `/api/upload/document` | POST | `protectedRoute` | FormData: `document` (single file) | `{ success, message, file: { id, ... } }` |

**Proof doc upload:** D-12 says reuse `components/image-upload.tsx`. The component uploads to `/api/upload/image` and returns `{ id, src, alt }` via `onUploadSuccess`. For leave proof, the `proof` field is a string — likely the file ID or URL. The details dialog renders proof as `<Image src={leave.proof}>` — so `proof` is a URL string, not an ID.

**Conflict:** `image-upload.tsx` calls `onUploadSuccess?.(res.file)` which gives `{ id, src, alt }`. But leave `proof` field is used as a direct image URL in `leave-details-dialog.tsx` line 150 (`src={leave.proof}`). This means `proof` stores the full image URL (`/uploads/...`), not just the file ID. Need to verify how the backend stores the proof — likely `res.file.src` or `res.file.id` maps to the stored path.

---

## 2. Existing Code Audit

### Mail Service (`services/mail.api.ts`)

**Current state:** 4 functions (getSearchUser, getMails, getSentMails, sendMail) + hand-written types.

| Gap | Detail | Decision Ref |
|-----|--------|-------------|
| No zod response schemas | Types are hand-written; `MailUser`, `MailT`, `MailInput` are manual | D-21 |
| `getMails` / `getSentMails` ignore pagination | Return `MailT[]` directly, no meta handling | Backend DOES return meta |
| `sendMail` types response as `MailT` | Backend returns `data: null` on success — this type is wrong | Bug |
| Duplicate toast on error | `if (!res.success) toast.error(res.message)` — `apiFetch` already toasts failures | Code smell |
| User search not reusable | `getSearchUser` is tightly coupled to mail; should be in shared service for D-16..D-19 | D-05 |

### Mail Hook (`hooks/use-mail.ts`)

**Current state:** Single hook returning inbox, sent, send, user queries. No refetch invalidation on send success for inbox.

| Gap | Detail |
|-----|--------|
| `send.onSuccess` only invalidates `["sent"]` | Should also invalidate `["inbox"]` (recipient's inbox changes) |
| `user` query re-fires on every keystroke | No debouncing at hook level (D-18 requires 300ms debounce) |
| No pagination support | `getMails()` and `getSentMails()` called without page/limit |

### Mail Page (`app/(main)/mail/page.tsx`)

**Current state:** 486-line monolith with Inbox/Sent/Compose tabs, detail dialog, and inline compose form.

| Gap | Detail | Decision Ref |
|-----|--------|-------------|
| To/CC/BCC picker copy-pasted 3x | ~60 lines duplicated per field (~180 lines of duplication) | D-05 |
| No form validation on compose | `mailInputSchema` allows empty arrays for `to`, empty strings for `subject`/`body` | D-06 |
| Mail body rendered raw in dialog | `whitespace-pre-wrap` but no HTML escaping — stored body goes through DOMPurify on ingest, so safe-ish | D-08 |
| No reply button | Can't reply to a message from detail dialog | D-04 |
| `MailUser` type re-declared locally | Duplicate of `MailUser` in `services/mail.api.ts` | Code smell |

### Mail Data Table (`features/mail/data-table.tsx`)

**Current state:** TanStack Table with filter, sort, column visibility, refresh, and PaginationFooter.

| Gap | Detail |
|-----|--------|
| Already uses PaginationFooter ✓ | Good — but backed by client-side `getPaginationRowModel()` since backend data isn't paginated yet |
| Filter/sort are client-side | Fine for MVP — mail volumes are low for an internal tool |

### Mail Columns (`features/mail/column.tsx`, `features/mail/outbox-colunm.tsx`)

| Gap | Detail | Decision Ref |
|-----|--------|-------------|
| Filename typo: `outbox-colunm.tsx` | Should be `outbox-column.tsx` | D-20 |
| Outbox "To" column shows only first recipient | No "and N others" suffix for multi-recipient | D-07 |
| `outBoxColumns` accessorKey is `"from"` | Misleading — header says "To" but accessor is "from"; the cell reads `row.original.to[0]` | Code smell |

### Leave Service (`services/leave.api.ts`)

**Current state:** 8 functions + hand-written types + 3 zod schemas (createLeaveType, applyLeave, reviewLeave).

| Gap | Detail | Decision Ref |
|-----|--------|-------------|
| Unused `isActive` import from `@tiptap/core` | Dead import | D-22 |
| No response zod schemas for get endpoints | `getLeaveTypes`, `getLeaveApplications`, `getLeaveBalance`, `getAllLeaveApplications` all use hand-written types | Pattern gap |
| `getLeaveApplications` already uses `normalizeList` | Good — but backend returns full array, so `normalizeList` is wrapping a non-paginated response | Client-side pagination needed |
| `getLeaveBalance` returns `res.data` directly | No error handling if `res.data` is null (404 from backend) | Edge case |

### Leave Hook (`hooks/use-leave.ts`)

**Current state:** Complete hook with all queries/mutations. Uses `all` prop for admin vs staff views.

| Gap | Detail |
|-----|--------|
| `balance` query has `staleTime: 5min` | Reasonable — balance only changes on approved leave |
| `leaveTypes` has `staleTime: 30min` | Reasonable — types rarely change |
| All mutations invalidate `["leave"]` broadly | Works but over-invalidates — could target `["leave", "applications"]` or `["leave", "balance"]` specifically |

### Leave Feature Files

| File | Current State | Gaps |
|------|--------------|------|
| `features/leave/page.tsx` (staff) | Balance cards + applications table + apply dialog. Uses `useSearchParams` for page/limit. | No PaginationFooter on applications table (D-15) |
| `features/leave/admin-page.tsx` | Leave types table + all-applications table with approve/reject/view buttons. | No status filter buttons (D-13), no PaginationFooter (D-15), no leave type CRUD section |
| `features/leave/apply-leave-dailog.tsx` | Dialog with type select, date inputs, reason textarea, proof text input. | Proof should use ImageUpload (D-12), no balance cards in dialog (D-11), no overlap error handling (D-14), filename typo |
| `features/leave/leave-table.tsx` | Staff applications table with status badges + detail dialog. | No edit button for pending leaves (D-10), no PaginationFooter |
| `features/leave/leave-balance-card.tsx` | Card showing used/remaining with progress bar. Reusable. | None — works well |
| `features/leave/leave-status-badge.tsx` | Badge for all 4 statuses. Reusable. | None — works well |
| `features/leave/leave-details-dialog.tsx` | Full detail view with dates, reason, manager comment, proof image. | Proof renders as `<Image src={leave.proof}>` — assumes proof is a URL, not an ID |
| `features/leave/review-leave-dialog.tsx` | Approve/reject radio + comment textarea. | Works well for MVP |
| `features/leave/leave-type-dialog.tsx` | Create/edit leave type form with all fields. | Works well — has useEffect for edit pre-fill |
| `features/leave/leave-type.tsx` | Leave types table with edit button + create dialog. | No delete/activate toggle, but backend doesn't support delete — fine for MVP |

---

## 3. Shared Infrastructure Availability

| Asset | Location | Status | Usage in Phase 4 |
|-------|----------|--------|-------------------|
| PaginationFooter | `components/pagination-footer.tsx` | ✅ Ready | D-15: Add to staff leave table + admin all-applications table |
| normalizeList | `lib/normalize-list.ts` | ✅ Ready | Already used by leave service; needed for mail inbox/outbox |
| IST date utils | `lib/date.ts` | ✅ Ready | Already used by mail detail dialog + leave tables |
| `can()` RBAC | `lib/permissions.ts` | ✅ Ready | Already in nav-list for route gating; can gate compose/review actions |
| ImageUpload | `components/image-upload.tsx` | ✅ Ready | D-12: Proof doc upload in leave apply dialog |
| Field/FieldLabel/FieldError | `components/ui/field.tsx` | ✅ Ready | Used by leave forms; needed for mail compose validation |
| useMe hook | `hooks/use-me.ts` | ✅ Ready | Available for role checks in user-search picker |
| common-zod-schema (`userField`) | `lib/common-zod-schema.ts` | ✅ Ready | Can type user search results with `DefaultUserT` |
| shadcn Popover | `components/ui/popover.tsx` | ✅ Ready | D-18: Dropdown for user-search picker results |

**Not yet available (Phase 3 deliverables still pending):**
- SLICE-CONTRACT.md — Phase 3 hasn't executed yet; this will become available after Phase 3
- Trash tab pattern — Phase 3 will establish this; not needed for Phase 4 (leave has no soft-delete)
- Shared noticeboard components — Not relevant to mail/leave

---

## 4. Integration Points

### Routes (already exist)

| Route | Layout Group | File | Notes |
|-------|-------------|------|-------|
| `/mail` | `(main)` | `app/(main)/mail/page.tsx` | Tabbed Inbox/Sent/Compose. Stays as-is. |
| `/leave` | `(main)/(manager)` | `app/(main)/(manager)/leave/page.tsx` | Staff leave: balance + applications + apply dialog |
| `/leave-management` | `(main)/(manager)` | `app/(main)/(manager)/leave-management/page.tsx` | Admin: leave types + all-applications. Renders `LeaveTypePage` + `AdminLeavePage` |

**Note:** Leave routes are under `(manager)` route group, not `(admin)`. This means any user who can access manager routes can see both staff and admin leave pages. The admin page controller enforces role checks server-side.

### Navigation (`components/sidebar/nav-list.tsx`)

- Mail: Already in `userRoutes` as "Mails" at `/mail` (line 51-54) ✓
- Leave: Already in `userRoutes` as "Leave" at `/leave` (line 55-59) ✓
- Leave Management: Already in `managerRoutes` as "Leave Management" at `/leave-management` (line 84-88) ✓
- All navigation entries are already present. No changes needed.

### Backend Route Mounting (from `app.ts`)

- `app.use('/api/mail', protectedRoute, mailRouter)` — line 93
- `app.use('/api/leave', protectedRoute, leaveRouter)` — line 96
- `app.use('/api/user', protectedRoute, userRouter)` — line 89
- `app.use('/api/upload', protectedRoute, uploadRouter)` — line 94

---

## 5. Risk Areas

### HIGH: `sendMail` response type mismatch
The frontend `sendMail` service types the return as `MailT`, but the backend returns `data: null` on success (line 56 of mail.controller.ts). If any code accesses `res.data` after send, it will be null. The current `onSubmit` in the mail page accesses `res.message` (not `res.data`), so it works today — but the type is wrong and will cause confusion.

### HIGH: Mail inbox/outbox pagination not wired
Backend returns paginated data with meta, but frontend fetches everything client-side. For an internal org tool this is probably fine (low volume), but should be noted as a known limitation.

### HIGH: Leave applications return full arrays (no server pagination)
Both `getLeaveApplications` and `getAllLeaveApplications` return ALL records. `normalizeList` wraps them but the `totalPages` will always be 1 (or match the array length). PaginationFooter will be cosmetic only until backend adds pagination.

### MEDIUM: User search endpoint returns `displayName` but frontend `MailUser` type doesn't include it
Backend `userSearchController` selects `name displayName email image role` (line 60-61 of user.controller.ts). The `MailUser` type in the frontend only has `id, name, email, role, image`. The `displayName` field is returned but unused. The shared `DefaultUserT` from `lib/common-zod-schema.ts` DOES include `displayName`. This should be reconciled.

### MEDIUM: Leave apply dialog proof field mismatch
`apply-leave-dailog.tsx` has proof as `<Input type="text" placeholder="Upload file id">`. D-12 wants it changed to use `ImageUpload`. The `proof` field is a string — the backend accepts any string. The `leave-details-dialog.tsx` renders it as `<Image src={leave.proof}>`. This means `proof` must be a URL (like `/uploads/...`), not just an ID. The `ImageUpload` component's `onUploadSuccess` gives back `{ id, src, alt }` — the `src` field is the URL to store.

### MEDIUM: Leave admin page title says "Pending Leave Requests" but shows ALL applications
The admin page card title is misleading — it shows all statuses, not just pending.

### LOW: No overlap error surfacing in apply dialog
D-14 requires inline overlap error below date fields. The backend `validateLeaveApplication` in `libs/utils/leave.ts` likely throws an error on overlap — this needs to be caught and displayed inline rather than as a toast.

### LOW: Filename typos
- `outbox-colunm.tsx` → `outbox-column.tsx` (D-20)
- `apply-leave-dailog.tsx` → `apply-leave-dialog.tsx` (implicit in D-09)

---

## 6. Recommended Plan Structure (Vertical Slices)

### Slice 1: Code Quality Foundation + Shared User-Search Picker
**Requirements:** D-05, D-20, D-21, D-22
**Deliverables:**
- Fix `outbox-colunm.tsx` filename → `outbox-column.tsx`
- Remove unused `@tiptap/core` import from `services/leave.api.ts`
- Add zod response schemas to `services/mail.api.ts` (mirror backend `InBoxMailSchema`/`OutBoxMailSchema`)
- Fix `sendMail` return type (backend returns `data: null`)
- Extract `components/user-search-picker.tsx` — controlled component per D-16..D-19
- Wire debounced search (300ms) using existing `getSearchUser` or a new `searchUsers` service function

### Slice 2: Mail Compose + Reply + Validation
**Requirements:** MAIL-02, MAIL-04, D-04, D-06, D-08
**Deliverables:**
- Replace inline To/CC/BCC picker in mail page with `UserSearchPicker` component
- Add zod validation to compose form (D-06): `to` min 1, `subject` min 1, `body` min 1
- Add Reply button to mail detail dialog — switches to Compose tab with To prefilled + quoted body (D-04)
- Sanitize mail body rendering in detail dialog (D-08): escape HTML, preserve line breaks
- Wire compose form via react-hook-form + zodResolver + Controller pattern

### Slice 3: Mail Pagination + Inbox/Outbox Fixes
**Requirements:** MAIL-01, MAIL-03
**Deliverables:**
- Wire inbox/outbox services to use pagination params (page/limit)
- Add normalizeList to mail responses
- Update mail hook to pass page/limit params
- Add outbox column "and N others" suffix (D-07)
- Update mail data table to use server-side pagination

### Slice 4: Leave Staff — Balance-in-Dialog + Proof Upload + Edit
**Requirements:** LEAV-01, LEAV-02, LEAV-03, LEAV-04, D-10, D-11, D-12, D-14, D-15
**Deliverables:**
- Add balance cards inside apply dialog (D-11)
- Replace proof text input with ImageUpload component (D-12)
- Add overlap error handling below date fields (D-14)
- Add PaginationFooter to staff applications table (D-15)
- Add edit button for pending applications — reuse apply dialog in edit mode (D-10)
- Add PaginationFooter to admin all-applications table (D-15)

### Slice 5: Leave Admin — Status Filter + Type CRUD
**Requirements:** LEAV-05, LEAV-06, D-13
**Deliverables:**
- Add status filter buttons (All/Pending/Approved/Rejected) above admin applications table (D-13)
- Ensure leave type CRUD works end-to-end (already exists, verify against contract)
- Fix admin page card title to reflect actual content

### Slice 6: Integration + Polish
**Deliverables:**
- Verify all navigation entries work
- Verify mail and leave routes render correctly
- Lint/typecheck gate
- Cross-module smoke test (compose mail, apply leave, review leave)

---

## Appendix: Backend Response Shapes (for zod schemas)

### Mail Response Shapes

```typescript
// Inbox response (per-item — no bcc field)
{
  id: string;
  from: { id: string; name: string; email: string; role: string; image: { id: string; src: string; alt: string } };
  to: Array<{ id: string; name: string; email: string; role: string; image: { id: string; src: string; alt: string } }>;
  cc: Array<{ id: string; name: string; email: string; role: string; image: { id: string; src: string; alt: string } }>;
  subject: string;
  body: string;
  createdAt: Date;
}

// Outbox response (per-item — includes bcc)
{
  id: string;
  from: { id: string; name: string; email: string; role: string; image: { id: string; src: string; alt: string } };
  to: Array<{ id: string; name: string; email: string; role: string; image: { id: string; src: string; alt: string } }>;
  cc: Array<{ id: string; name: string; email: string; role: string; image: { id: string; src: string; alt: string } }>;
  bcc: Array<{ id: string; name: string; email: string; role: string; image: { id: string; src: string; alt: string } }>;
  subject: string;
  body: string;
  createdAt: Date;
}

// Meta (both endpoints)
{ page: number; limit: number; count: number; total: number }

// User search response
{ id: string; displayName: string; name: string; email: string; role: string; image: { id: string; src: string; alt: string } }
```

### Leave Response Shapes

```typescript
// Leave application (per-item)
{
  id: string;
  user: DefaultUserT; // { id, name, displayName, email, role, image }
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  type: { name: string; code: string };
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  proof?: string;
  approvedBy?: string;
  managerComment?: string;
}

// Leave type (per-item)
{
  id: string;
  name: string;
  code: string;
  allocatedDays: number;
  maxCarryForwardDays: number;
  requiresProof: boolean;
  minDaysNotice: number;
  isActive: boolean;
  description?: string;
}

// Leave balance
{
  id: string;
  user: string; // userId
  year: string;
  balance: { [leaveTypeName: string]: { used: number; remaining: number } }
}
```

---

*Phase: 4-Staff Self-Service — Mail & Leave*
*Research completed: 2026-08-26*
