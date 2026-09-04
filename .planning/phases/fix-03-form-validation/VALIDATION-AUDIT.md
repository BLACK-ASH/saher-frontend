# Validation Audit — Phase 3

Audit of every major frontend zod form schema against its backend equivalent
(`../saher-backend`). `> st`, `<` lt, `==` equal. GAPS entries list where the
two sides diverge or a business rule is weakly enforced.

## Per-Form Audit

### Bill Create (userBillCreateSchema)
- Frontend: services/reimbursement.api.ts
- Backend: ../saher-backend/src/reimbursement/bill/schema.ts (`billSchema` pick)
- GAPS:
  - Backend `amount: z.coerce.number()` has NO `.positive()` — a direct API call with `amount: -100` is accepted. Backend-only gap (BILL-02), frontend already `.positive()`.
- OK:
  - Frontend `amount` has `.positive("Amount must be greater than zero")` — stricter than backend, good.
  - Description bounds match (min 5 / max 50).
  - Images min(1) on both sides; frontend additionally caps max(10) (UI rule, D-06).
  - Date: frontend `z.string()` vs backend `z.coerce.date()` — input layer keeps string, backend coerces; acceptable.

### Bill Update (userBillUpdateSchema)
- Frontend: services/reimbursement.api.ts
- Backend: ../saher-backend/src/reimbursement/bill/schema.ts (`userBillUpdateSchema`)
- GAPS:
  - Backend `amount` still `z.coerce.number()` without `.positive()` (BILL-02 inherits to update too).
- OK:
  - Frontend update `amount` has `.positive()`.
  - Description bounds match; date correctly excluded (D-07 date-lock).

### Bill Create Admin / Advance (adminBillCreateSchema / adminBillUpdateSchema)
- Frontend: services/reimbursement.api.ts
- Backend: ../saher-backend/src/reimbursement/bill/schema.ts (`adminBillCreatSchema` / `adminBillUpdateSchema`)
- GAPS:
  - Backend `advance: z.coerce.number()` has NO `.positive()` — negative advance accepted on direct API.
- OK:
  - Frontend create+update `advance` have `.positive("Advance must be greater than zero")` (4× `.positive` total in reimbursement.api.ts).
  - Description bounds match.

### Leave Apply (applyLeaveSchema)
- Frontend: services/leave.api.ts
- Backend: ../saher-backend/src/leave/leave.schema.ts (`leaveApplicationSchemaBase`)
- GAPS:
  - Backend `type: z.string().trim()` has NO `.min(1)` — empty type accepted on direct API (MEDIUM backend gap; frontend already `.min(1)`).
  - `proof` is a plain `z.string().optional()` on both sides — LEAVE-01 cross-cutting concern (proof should eventually reference a Media doc). Tracked for Phase 6, not fixed here.
- OK:
  - Reason bounds match (min 5 / max 400).
  - endDate >= startDate refine present on both.
  - startDate/endDate required on both.

### Leave Type (createLeaveTypeSchema)
- Frontend: services/leave.api.ts
- Backend: ../saher-backend/src/leave/leave.schema.ts (`leaveTypeSchemaBase`)
- GAPS:
  - Frontend `name`/`code` lack `.max()` and (on code) the `.toUpperCase()` + regex transform the backend applies (backend: name min(2).max(50), code min(2).max(10) uppercased `[A-Z0-9_]+`).
  - Frontend `allocatedDays`/`maxCarryForwardDays`/`minDaysNotice` lack `.int()`/`.max()`; backend enforces int + max(365).
  - carry-forward <= allocated refine present on both. Backend is the stricter gate — these are MEDIUM but backend-enforced, so non-blocking.
- OK:
  - carry-forward refine aligns; min(2) on name matches.

### Notice Create (createNoticeSchema)
- Frontend: services/notice.api.ts
- Backend: ../saher-backend/src/notice/notice.schema.ts (`baseNoticeSchema`)
- GAPS: (none)
- OK: title/description `.min(1)` both sides; expiresAt optional on both; backend additionally refines future-date on create — frontend leaves that to backend, acceptable.

### Session Create (sessionCreateSchema)
- Frontend: features/program/session/session-editor.tsx
- Backend: ../saher-backend/src/events/session/session.schema.ts (`createSessionSchema`)
- GAPS:
  - Frontend has no `endTime > startTime` refine — only `<input min={startTime}>` hints. Backend refine catches it (LOW; acceptable, plan keeps string min(1) as-is).
  - Frontend `date`/`startTime` are `z.string().min(1)` with no future-date check; backend refines `> new Date()`. The onSubmit already surfaces the backend 400 inline (`form.setError("date", ...)` at line 103). LOW.
  - Frontend requires `workshop` (`.min(1)`); backend `workshop: objectId().optional()` — frontend stricter (documented asymmetry, plan item 5). LOW.
  - Frontend `speaker: z.array(z.any())` — no objectId/email constraint; backend requires objectId array min(1). LOW (backend enforces).
- OK:
  - title/description required both sides; description min(5) frontend > backend min(1) (stricter, fine).

### Workshop Create (addWorkshops)
- Frontend: services/workshop.api.ts (no zod schema — raw JSON.stringify)
- Backend: ../saher-backend/src/events/workshop/workshop.schema.ts
- GAPS:
  - No client-side validation at all — relies entirely on backend `title/description .min(1)` (LOW; simple CRUD).
- OK: backend enforces min(1) on both fields.

### Program Create (addProgram)
- Frontend: services/program.api.ts (no zod schema — raw JSON.stringify)
- Backend: ../saher-backend/src/events/program/program.schema.ts
- GAPS:
  - No client-side validation — relies entirely on backend `title/description .min(1)` (LOW).
- OK: backend enforces min(1); participant-ids array requires min(1) on backend.

### Attendance Correction Create (attendanceCorrectionCreateSchema)
- Frontend: features/attendance/attendance-correction.tsx
- Backend: ../saher-backend/src/attendance/correction/correction.schema.ts (`attendanceCorrectionSchema`)
- GAPS:
  - **Message max mismatch: frontend `.max(100)` vs backend `.max(300)`.** A 200-char message passes backend but is blocked by the frontend — HIGH (VALIDATION-02). Fix: align frontend max to 300.
  - `message` min: frontend 10, backend 3 — frontend stricter, acceptable.
- OK:
  - inTime/outTime required; proof optional both sides; proof stores Media ObjectId after Phase 2.

### Attendance Correction Handle (attendanceCorrectionHandleSchema)
- Frontend: features/attendance-correction/attendance-correction-view.tsx
- Backend: ../saher-backend/src/attendance/correction/correction.schema.ts (`attendanceCorrectionHandleSchema`)
- GAPS:
  - **Frontend `status` enum includes `"pending"`** (`['reject','pending','on-hold','approve']`); backend only allows `['reject','on-hold','approve']`. A pending value 400s — HIGH (T-03-02). Fix: remove `"pending"` from the frontend enum/list.
  - Frontend `reason` max(300) matches backend; frontend adds an `isAdmin` wrapper field (stripped by backend parse — harmless).
- OK: reason max(300) aligns.

### User Registration (registerFormSchema)
- Frontend: features/register/register-schema.ts
- Backend: ../saher-backend/src/admin/account/schema.ts (`accountRegisterSchema`)
- GAPS: (none material)
- OK:
  - user name min(2) + start-letter refine; email `z.email`; image objectId; role enum — match backend `userSchema`.
  - account fields match `accountBaseSchema` incl. phone regex + part-time/shift refine.
  - bank matches `bankSchema` exactly (IFSC regex, mobile regex).
  - aadhar/pan/resume are `objectId` on both sides.

### Admin Bank Details (bankDetailSchema)
- Frontend: features/register/register-schema.ts (reused in features/admin/bank-details.tsx + services/admin.api.ts)
- Backend: ../saher-backend/src/admin/bank/schema.ts (`bankSchema`)
- GAPS: (none)
- OK: IFSC regex (`^[a-zA-Z]{4}0[a-zA-Z0-9]{6}$` + uppercase), mobile regex, required fields all match backend.

### Admin Account Edit (accountUpdateSchema)
- Frontend: services/admin.api.ts
- Backend: ../saher-backend/src/admin/account/schema.ts (`accountBaseSchema` partial) + bank/schema.ts
- GAPS:
  - Frontend `aadhar`/`pan`/`resume` are `z.string()` here (register uses `objectId`); backend `accountBaseSchema` requires `objectId(...)` for these. A non-24-hex string passes the frontend but 400s on backend (MEDIUM; backend-enforced, so non-blocking, but inconsistent with register schema).
- OK:
  - `.partial().strict()` matches backend; part-time/shift refine present; phone regex matches.

## Summary of Gaps

| Form | Gap | Severity | Fix Location |
|------|-----|----------|-------------|
| Bill Create/Update | backend amount allows non-positive (no `.positive()`) | Severity: HIGH | Backend (Phase 4 / BILL-02) |
| Advance Bill | backend advance allows non-positive | Severity: HIGH | Backend (Phase 4 / BILL-02) |
| Attendance Correction Create | message max 100 vs backend 300 | Severity: HIGH | Frontend now — align to 300 |
| Attendance Correction Handle | frontend enum allows `pending`, backend rejects | Severity: HIGH | Frontend now — drop `pending` |
| Leave Apply | backend `type` allows empty string | Severity: MEDIUM | Backend (documented) |
| Leave Type | frontend misses max/int bounds + code transform | Severity: MEDIUM | Backend-enforced; tighten frontend later |
| Admin Account Edit | aadhar/pan/resume `z.string` vs backend objectId | Severity: MEDIUM | Frontend (align to objectId) |
| Session Create | no endTime>startTime / future-date client refine | Severity: LOW | Backend-enforced; acceptable |
| Session Create | workshop required frontend, optional backend | Severity: LOW | Documented asymmetry |
| Workshop/Program Create | no client-side zod validation | Severity: LOW | CRUD; backend-enforced |
| Leave proof | plain string, not Media reference | LOW (LEAVE-01) | Phase 6 |
