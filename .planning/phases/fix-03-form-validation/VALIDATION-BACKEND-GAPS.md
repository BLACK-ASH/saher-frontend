# Backend Validation Gaps — Phase 3

Backend schemas that lack essential business-rule enforcement. These belong to
the backend repo (out of scope for this frontend phase) but must be tracked and
owned by later phases. Source of truth: `../saher-backend`.

## Backend-only gaps

1. **Bill amount allows non-positive values (BILL-02)**
   - File: `../saher-backend/src/reimbursement/bill/schema.ts`
   - Current: `amount: z.coerce.number()` — NO `.positive()` or `.min(0)`.
   - Direct API call with `amount: -100` is accepted.
   - Suggested fix: add `.positive("Amount must be greater than zero")` to `billSchema.amount`.
   - Owner: fix-04-bill-management (frontend already `.positive()`).

2. **Bill advance allows non-positive values (BILL-02)**
   - File: `../saher-backend/src/reimbursement/bill/schema.ts`
   - Current: `advance: z.coerce.number()` — NO positive constraint.
   - Suggested fix: add `.positive("Advance must be greater than zero")` to `billSchema.advance`.
   - Owner: fix-04-bill-management (frontend already `.positive()`).

3. **Leave type allows empty string**
   - File: `../saher-backend/src/leave/leave.schema.ts`
   - Current: `type: z.string().trim()` in `leaveApplicationSchemaBase` — NO `.min(1)`.
   - An empty-string type would be accepted on direct API.
   - Suggested fix: add `.min(1, "Leave type is required")`.
   - Owner: fix-06-notice-leave (frontend already `.min(1)`).

## Documented-as-intentional (no change)

4. **Notice expiry past-date rule only on create**
   - File: `../saher-backend/src/notice/notice.schema.ts`
   - `updateNoticeSchema = baseNoticeSchema.partial()` — the `expiresAt` future-date refine only fires when the field is present. Edit can keep an old expiry. Correct; intentionally no fix.

5. **Session workshop is optional on backend, required on frontend**
   - File: `../saher-backend/src/events/session/session.schema.ts`
   - `workshop: objectId().optional()` vs frontend `.min(1)`. Frontend is stricter. Documented asymmetry, acceptable — no backend change.

## Attended in this phase (frontend-side)

6. **Attendance correction handle status enum allowed `pending`**
   - Frontend removed `"pending"` from `attendanceCorrectionStatusList`
     (`features/attendance-correction/attendance-correction-view.tsx`) so the
     submit enum now matches backend `['reject', 'on-hold', 'approve']`
     (`attendance/correction/correction.schema.ts`). Records may still read
     `pending` in responses; only the handle/submit enum was tightened.

7. **Attendance correction message max aligned 100 → 300**
   - Frontend `attendanceCorrectionCreateSchema.message` raised to `.max(300)`
     to match backend `.min(3).max(300)`.

## Suggested backend follow-ups (not owned by a file-level phase yet)

8. **Account aadhar/pan/resume as plain strings in admin update**
   - File: `../saher-backend/src/admin/account/schema.ts` (`accountBaseSchema`)
   - These are `objectId(...)` on the backend — enforced server-side. The
     frontend `accountUpdateSchema` (`services/admin.api.ts`) uses `z.string()`
     for them, so a non-24-hex string passes client-side but 400s on backend.
     Prefer aligning the frontend schema to `objectId` in a later profile phase.
