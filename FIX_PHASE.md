# SAHER Internals — Fix & Stabilization Phase

> **Document:** `FIX_PHASE.md`
> **Project:** SAHER Internals
> **Purpose:** Stabilize existing functionality, fix identified regressions, and prevent further breakage during automated development.
> **Status:** Active
> **Priority:** Critical → High → Medium
> **Rule:** Fix the root cause. Do not mask symptoms.

---

# 1. Mission

SAHER Internals has experienced regressions after automated development work.

This phase exists to:

1. Fix all currently identified bugs.
2. Preserve existing working functionality.
3. Correct inconsistent backend/frontend data contracts.
4. Establish consistent validation and soft-delete behavior.
5. Fix authentication and authorization vulnerabilities.
6. Complete missing frontend functionality.
7. Perform regression testing after fixes.

The objective is **stabilization**, not refactoring.

---

# 2. Critical Agent Rules

These rules apply to **every task in this document**.

## 2.1 Do not blindly modify code

Before changing anything:

1. Locate the relevant frontend implementation.
2. Locate the API call.
3. Locate the backend route/controller.
4. Locate the service/business logic.
5. Locate the schema/model.
6. Determine where the actual failure originates.
7. Fix the root cause.

Do not assume that a bug is frontend-only or backend-only.

---

## 2.2 Do not refactor unrelated code

Do NOT:

* rename unrelated files
* rename existing routes unnecessarily
* restructure the project
* replace libraries
* rewrite working modules
* introduce a new architecture
* replace existing authentication
* replace React Query
* replace React Hook Form
* replace Zod
* replace shadcn/ui
* replace MongoDB/Mongoose
* change API conventions without necessity

A task should result in the **smallest safe change necessary**.

---

## 2.3 Preserve existing behavior

Before modifying a shared component, service, middleware, schema, or utility:

> Determine every feature that depends on it.

A fix for one module must not break another module.

---

## 2.4 Backend is the source of truth

Frontend validation is for user experience.

Backend validation is mandatory for correctness and security.

Never rely on frontend validation alone.

---

## 2.5 Do not hide errors

Do not fix a problem by:

```text
catch error → ignore error → show success
```

or:

```text
API fails → hide UI error
```

Errors must be handled explicitly.

---

## 2.6 Do not weaken security

Never solve an authentication/authorization issue by:

* removing authorization middleware
* allowing invalid tokens
* bypassing email verification
* trusting frontend role/status
* accepting invalid user IDs
* disabling backend validation

---

## 2.7 Existing database data must be considered

Before changing a schema or response structure:

* inspect existing documents
* consider old records
* handle missing fields safely
* avoid breaking existing records
* avoid destructive migrations

If migration is genuinely required, document it before implementing it.

---

# 3. Required Development Workflow

Every task must follow this workflow.

```text
1. Inspect
      ↓
2. Reproduce
      ↓
3. Identify root cause
      ↓
4. Inspect dependencies
      ↓
5. Plan minimal fix
      ↓
6. Implement
      ↓
7. Typecheck
      ↓
8. Lint
      ↓
9. Run relevant tests
      ↓
10. Verify affected feature
      ↓
11. Verify related features
      ↓
12. Report changes
```

Do not mark a task complete merely because:

```text
npm/pnpm build
```

succeeds.

A successful build does not prove that the feature works.

---

# 4. Completion Standard

A task is considered complete only when:

* [ ] Root cause identified
* [ ] Minimal fix implemented
* [ ] Existing architecture preserved
* [ ] Backend validation verified
* [ ] Frontend behavior verified
* [ ] Typecheck passes
* [ ] Lint passes where applicable
* [ ] Relevant tests pass
* [ ] Related functionality manually/reliably verified
* [ ] No unrelated files were unnecessarily changed
* [ ] No existing feature was intentionally weakened
* [ ] Changes are documented in the final agent report

---

# 5. Phase Overview

| Phase   | Area                           | Priority | Dependencies             |
| ------- | ------------------------------ | -------: | ------------------------ |
| Phase 0 | Authentication & Authorization | CRITICAL | None                     |
| Phase 1 | Soft Delete                    | CRITICAL | Phase 0                  |
| Phase 2 | Image/File Preview             |     HIGH | None                     |
| Phase 3 | Global Form Validation         |     HIGH | Phase 2                  |
| Phase 4 | Bill Management                |     HIGH | Phase 3                  |
| Phase 5 | User Registration & Profile    |     HIGH | Phase 0, 3               |
| Phase 6 | Notice & Leave                 |     HIGH | Phase 2, 3               |
| Phase 7 | Attendance Correction          |     HIGH | Phase 3                  |
| Phase 8 | Notification UI                |   MEDIUM | Backend notification API |
| Phase 9 | Full Regression Testing        | CRITICAL | All previous phases      |

---

# PHASE 0 — Authentication & Authorization

**Priority:** CRITICAL

Authentication is the foundation of the application.

Do not proceed to final regression testing until this phase is stable.

---

## AUTH-01 — Email Verification During Login

### Problem

The application currently requires email verification during login.

Newly created users are unverified.

Expected behavior:

```text
User created
    ↓
emailVerified = false
    ↓
Verification email sent
    ↓
User verifies email
    ↓
emailVerified = true
    ↓
User can log in
```

### Required behavior

New user:

```text
emailVerified = false
```

Unverified user attempting login:

```text
Credentials valid
       ↓
emailVerified = false
       ↓
Reject login
       ↓
Allow/request verification email resend
```

Verified user:

```text
Credentials valid
       ↓
emailVerified = true
       ↓
Issue tokens
```

### Inspect

* User schema/model
* User creation service
* Registration controller
* Admin user creation flow
* Email verification implementation
* Login controller/service
* Password authentication
* Access-token generation
* Refresh-token generation
* Verification token storage
* Verification endpoint
* Resend-verification endpoint

### Acceptance criteria

* [ ] Newly created user starts unverified.
* [ ] User creation does not automatically verify email.
* [ ] Verification email/link works.
* [ ] Verification changes the user's verification state.
* [ ] Unverified users cannot obtain a valid application session.
* [ ] Verified users can log in normally.
* [ ] Verification can be resent where supported.
* [ ] Existing verified users continue to work.

---

# AUTH-02 — User Revocation

**Priority:** CRITICAL / SECURITY

### Problem

After revocation:

* user can still use the application
* user can potentially refresh/regenerate a token

This is not acceptable.

### Expected flow

```text
Active user
    ↓
Admin revokes user
    ↓
User marked revoked/inactive
    ↓
Existing sessions invalidated
    ↓
Existing access token rejected
    ↓
Refresh token rejected
    ↓
New login rejected
    ↓
New tokens cannot be generated
```

### Inspect

Because SAHER uses JWT + Redis sessions, inspect:

* access-token middleware
* refresh-token endpoint
* refresh-token rotation
* Redis session lookup
* Redis session invalidation
* login service
* authorization middleware
* user status
* role checks
* logout/session cleanup

### Important

Do not solve this by simply changing the frontend UI.

The backend must reject revoked users.

### Acceptance criteria

* [ ] Revoked user cannot access protected APIs.
* [ ] Existing sessions are invalidated.
* [ ] Existing access tokens are rejected according to the application's revocation mechanism.
* [ ] Refresh tokens cannot generate new access tokens.
* [ ] Revoked users cannot log in.
* [ ] Revoked users cannot create a new session.
* [ ] Revocation cannot be bypassed by refresh-token rotation.
* [ ] Active users continue working.
* [ ] Reactivation, if supported, works correctly.

---

# PHASE 1 — Soft Delete & Resource Lifecycle

**Priority:** CRITICAL

Affected resources:

* Program
* Session
* Workshop

---

## DELETE-01 — Program Soft Delete

### Problem

A deleted program currently appears in both:

```text
Active Programs
Deleted Programs
```

### Required behavior

Deletion must be soft deletion.

```text
Program
   ↓
Delete
   ↓
deletedAt != null
   ↓
Excluded from active query
   ↓
Included in deleted query
```

### Acceptance criteria

* [ ] Program is never physically deleted.
* [ ] Deleted program disappears from active list.
* [ ] Deleted program appears in deleted list.
* [ ] Active query excludes deleted records.
* [ ] Deleted query includes deleted records.
* [ ] Existing relationships/data remain intact.
* [ ] Restore works if restore functionality exists.

---

## DELETE-02 — Session Soft Delete

Apply the exact same lifecycle to sessions.

* [ ] No hard deletion.
* [ ] Active query excludes deleted sessions.
* [ ] Deleted query includes deleted sessions.
* [ ] Existing data remains intact.
* [ ] Restore works if supported.

---

## DELETE-03 — Workshop Soft Delete

Apply the same lifecycle to workshops.

* [ ] No hard deletion.
* [ ] Active query excludes deleted workshops.
* [ ] Deleted query includes deleted workshops.
* [ ] Existing data remains intact.
* [ ] Restore works if supported.

---

## DELETE-04 — Query Consistency

Do not implement soft deletion only in the frontend.

Verify:

```text
Schema
 ↓
Service/repository
 ↓
Controller
 ↓
API
 ↓
React Query
 ↓
Frontend
```

Normal list endpoints must not accidentally return deleted records.

---

# PHASE 2 — Image/File Preview

**Priority:** HIGH

---

## FILE-01 — ObjectId vs Preview URL

### Problem

Backend stores/uses an ObjectId for uploaded files/images.

Frontend cannot directly use the ObjectId as an image source.

Example backend reference:

```text
ObjectId("...")
```

Frontend requires:

```text
https://.../image.jpg
```

### Required architecture

Keep the database reference as an ObjectId.

Expose a usable URL in API responses.

Preferred conceptual response:

```json
{
  "image": {
    "id": "...",
    "url": "..."
  }
}
```

The exact response structure must follow the existing project conventions.

### Do NOT

Do not convert database relationships from:

```text
ObjectId
```

to:

```text
String URL
```

merely to solve frontend rendering.

### Inspect

* File/image schema
* Upload service
* File lookup
* API serializers/transformers
* Static file serving
* Existing upload endpoints
* Frontend image components
* Forms containing image/file fields

### Acceptance criteria

* [ ] Existing uploaded images can be previewed.
* [ ] Frontend receives a usable image URL.
* [ ] ObjectId remains available as backend reference where required.
* [ ] New uploads can be previewed.
* [ ] Missing images do not crash the UI.
* [ ] All affected modules use the same convention.
* [ ] No duplicate image URL logic is unnecessarily created.

---

# PHASE 3 — Global Form Validation

**Priority:** HIGH

SAHER uses Zod + React Hook Form.

Continue using the existing validation architecture.

---

## VALIDATION-01 — Form Validation Audit

Audit all major forms.

At minimum:

* User registration
* User editing
* Profile
* Bill
* Leave
* Attendance correction
* Program
* Session
* Workshop
* Notice
* Any other create/update form discovered during audit

### Validate

* required fields
* string types
* number types
* minimum/maximum values
* dates
* enums
* file fields
* conditional fields
* nullable/optional fields
* string lengths

---

## VALIDATION-02 — Backend Validation

Every important business rule must also be validated server-side.

Example:

```text
amount > 0
```

must be enforced on the backend even if the frontend already prevents negative values.

### Acceptance criteria

* [ ] Forms show field-level errors.
* [ ] Invalid data cannot be submitted.
* [ ] Backend rejects invalid data.
* [ ] Backend errors are correctly displayed.
* [ ] Numeric fields use correct types.
* [ ] Date fields use correct types.
* [ ] File fields use the correct contract.
* [ ] No validation is silently bypassed.

---

# PHASE 4 — Bill Management

**Priority:** HIGH

---

## BILL-01 — Bill Page Actions

### Current problems

* Bill management is not working.
* Bill page actions do not work.
* View does not work.
* Withdraw does not work.

### Investigate complete flow

```text
UI action
 ↓
React Query
 ↓
API request
 ↓
Route
 ↓
Controller
 ↓
Service
 ↓
Database
```

### Acceptance criteria

* [ ] Bill list loads.
* [ ] Bill view works.
* [ ] Bill details display correctly.
* [ ] Bill withdrawal works.
* [ ] Appropriate authorization is enforced.
* [ ] Success feedback works.
* [ ] Error feedback works.
* [ ] React Query cache is correctly invalidated/refetched.

---

## BILL-02 — Negative Bill Amount

### Problem

Negative bill amounts are accepted.

Invalid:

```text
-100
-500
-1
```

Expected business rule:

```text
amount > 0
```

### Acceptance criteria

* [ ] Frontend rejects negative amounts.
* [ ] Backend rejects negative amounts.
* [ ] Zero is rejected if the business rule requires a positive amount.
* [ ] Direct API requests cannot bypass validation.
* [ ] Existing valid bills remain unaffected.

---

# PHASE 5 — User Registration & Profile

**Priority:** HIGH

---

## USER-01 — Bank Name Field

### Problem

Bank name is receiving/storing a number.

Example:

```text
Bank Name → number
```

### Investigate

Trace the entire data flow:

```text
Input
 ↓
React Hook Form
 ↓
Zod
 ↓
Request payload
 ↓
Controller
 ↓
Service
 ↓
Mongoose
```

Also check for incorrect field mapping such as:

```text
bankName: accountNumber
```

### Acceptance criteria

* [ ] Bank name is a string.
* [ ] Bank account number is stored in its correct field.
* [ ] Correct value reaches backend.
* [ ] Correct value is persisted.
* [ ] Edit form displays correct values.
* [ ] Reloading the user shows correct data.

---

## USER-02 — Profile View

### Problem

User cannot view profile.

### Inspect

* profile route
* current-user API
* authentication middleware
* user lookup
* authorization
* response shape
* React Query hook
* frontend property names
* image/avatar handling

### Acceptance criteria

* [ ] Profile page loads.
* [ ] User information displays.
* [ ] Role displays where appropriate.
* [ ] Relevant account information displays.
* [ ] Profile image displays if available.
* [ ] Refresh does not break profile.
* [ ] Unauthorized users cannot access another user's private profile data.

---

# PHASE 6 — Notice & Leave

**Priority:** HIGH

---

## NOTICE-01 — Notice Delete

### Problem

Notice deletion does not work.

### Investigate

* delete button
* mutation
* API endpoint
* controller
* service
* authorization
* database update
* React Query invalidation

### Important

If Notice follows the application's soft-delete policy, use soft deletion.

Do not introduce hard deletion merely to make the button work.

### Acceptance criteria

* [ ] Delete action works.
* [ ] Correct API request is made.
* [ ] Authorization is enforced.
* [ ] Notice disappears from active list.
* [ ] Data remains if soft delete is required.
* [ ] UI updates after deletion.
* [ ] Errors are shown properly.

---

## LEAVE-01 — Proof Field Type Error

### Current error

```text
Type String at path proof
```

### Investigate

Determine the actual expected contract:

```text
Frontend payload
        ↓
API
        ↓
Controller
        ↓
Service
        ↓
Mongoose schema
```

Also check whether this is related to the shared image/file reference problem from Phase 2.

Do not create a separate incompatible file representation for Leave.

### Acceptance criteria

* [ ] Leave proof can be uploaded/selected as intended.
* [ ] Correct reference is sent to backend.
* [ ] Correct value is stored.
* [ ] Existing proof records remain compatible.
* [ ] Proof can be previewed where applicable.

---

## LEAVE-02 — Incorrect Allotted Leave Date/Balance

### Problem

Reported discrepancy:

```text
Allotted = 12
Added = 24
```

The source of the incorrect value must be identified.

### Investigate

* leave allocation logic
* existing leave balance
* leave addition logic
* leave deduction logic
* approval flow
* date filtering
* year/month filtering
* frontend calculations
* backend calculations

### Important

Do not simply change the displayed number.

Find the calculation producing the incorrect result.

### Acceptance criteria

* [ ] Allotted value is correct.
* [ ] Added value is correct.
* [ ] Leave deductions are correct.
* [ ] Existing balances are not accidentally doubled.
* [ ] Year/date filtering works correctly.
* [ ] Frontend displays backend values correctly.

---

# PHASE 7 — Attendance Correction

**Priority:** HIGH

---

## ATTENDANCE-01 — Correction Request Submission

### Problem

Attendance correction request cannot be submitted.

### Investigate

```text
Correction form
 ↓
Validation
 ↓
Payload
 ↓
API
 ↓
Controller
 ↓
Attendance lookup
 ↓
Correction request creation
 ↓
Database
```

Check:

* attendance ID
* user ID
* date
* IN time
* OUT time
* reason
* validation
* authorization
* duplicate requests
* date/time serialization

### Acceptance criteria

* [ ] Correction form opens.
* [ ] Existing attendance loads correctly.
* [ ] Required fields validate.
* [ ] Correction request submits.
* [ ] Backend persists request.
* [ ] Success feedback is displayed.
* [ ] Invalid requests are rejected.
* [ ] Duplicate handling follows existing business rules.
* [ ] Manager/admin workflow remains functional.

---

# PHASE 8 — Notification UI

**Priority:** MEDIUM

---

## NOTIFICATION-01 — Notification Frontend

### Problem

Notification frontend UI is missing.

First inspect whether backend notification functionality already exists.

Do not create a second notification backend if one already exists.

### Expected minimum UI

```text
Notification Bell
       ↓
Unread Count
       ↓
Notification List
       ↓
Notification Item
       ↓
Read / Unread state
```

### UI requirements

Use the existing:

* shadcn/ui
* Tailwind
* icons
* layout
* typography
* design conventions

Do not create an unrelated visual system.

### Acceptance criteria

* [ ] Notification UI exists.
* [ ] Notifications load from backend.
* [ ] Unread count works if supported.
* [ ] Read/unread state works if supported.
* [ ] Empty state exists.
* [ ] Loading state exists.
* [ ] Error state exists.
* [ ] UI works on the existing application layout.
* [ ] No unrelated layout is broken.

---

# PHASE 9 — Full Regression Testing

**Priority:** CRITICAL

This phase begins only after the previous phases are complete.

---

## REG-01 — Authentication

Test:

* [ ] New user creation
* [ ] Unverified user login
* [ ] Email verification
* [ ] Verified user login
* [ ] Resend verification
* [ ] Logout
* [ ] Access token
* [ ] Refresh token
* [ ] Token rotation
* [ ] User revocation
* [ ] Existing session after revocation
* [ ] Refresh after revocation
* [ ] Login after revocation
* [ ] User reactivation if supported

---

## REG-02 — Program

* [ ] Create
* [ ] View
* [ ] Update
* [ ] List active
* [ ] Soft delete
* [ ] List deleted
* [ ] Restore if supported

---

## REG-03 — Session

* [ ] Create
* [ ] View
* [ ] Update
* [ ] List active
* [ ] Soft delete
* [ ] List deleted
* [ ] Restore if supported

---

## REG-04 — Workshop

* [ ] Create
* [ ] View
* [ ] Update
* [ ] List active
* [ ] Soft delete
* [ ] List deleted
* [ ] Restore if supported

---

## REG-05 — Users

* [ ] Create
* [ ] Edit
* [ ] Bank details
* [ ] Profile
* [ ] Email verification
* [ ] Role
* [ ] Revoke
* [ ] Reactivate if supported

---

## REG-06 — Bills

* [ ] List
* [ ] Create
* [ ] View
* [ ] Update if supported
* [ ] Withdraw
* [ ] Negative amount rejected
* [ ] Invalid amount rejected
* [ ] Authorization

---

## REG-07 — Leave

* [ ] Apply
* [ ] Proof
* [ ] Leave balance
* [ ] Allocation
* [ ] Approval
* [ ] Rejection
* [ ] Correct dates
* [ ] Correct calculations

---

## REG-08 — Attendance

* [ ] IN
* [ ] OUT
* [ ] Attendance listing
* [ ] Correction request
* [ ] Correction approval
* [ ] Correction rejection
* [ ] Date/time handling

---

## REG-09 — Notice

* [ ] Create
* [ ] View
* [ ] Update
* [ ] Delete/soft delete
* [ ] Active/deleted behavior if applicable

---

## REG-10 — Notifications

* [ ] Fetch
* [ ] Display
* [ ] Unread count
* [ ] Read/unread
* [ ] Empty state
* [ ] Error state

---

# 6. Cross-Cutting Regression Checklist

Before declaring stabilization complete, verify:

## Authentication

* [ ] Protected routes remain protected.
* [ ] Roles still work.
* [ ] Revoked users cannot bypass authorization.
* [ ] Refresh-token flow still works.
* [ ] Redis sessions behave correctly.

## API

* [ ] Existing API routes remain compatible unless intentionally changed.
* [ ] Error responses remain consistent.
* [ ] Validation errors are meaningful.
* [ ] No endpoint accidentally exposes private data.

## Database

* [ ] No unintended hard deletes.
* [ ] Existing documents remain readable.
* [ ] ObjectId relationships remain intact.
* [ ] No duplicate records introduced.
* [ ] No accidental balance duplication.

## Frontend

* [ ] Existing navigation works.
* [ ] Existing layouts work.
* [ ] Loading states work.
* [ ] Empty states work.
* [ ] Error states work.
* [ ] React Query cache invalidation works.
* [ ] No broken forms.
* [ ] No console errors introduced.

---

# 7. Agent Reporting Format

After every phase, provide a report using this structure:

```text
## Phase Completed

Phase: <phase name>

### Tasks Completed

- AUTH-01
- AUTH-02

### Root Causes

1. ...
2. ...

### Changes Made

1. ...
2. ...

### Files Modified

- path/to/file
- path/to/file

### Tests Performed

- pnpm ...
- ...
  
### Results

- Typecheck: PASS/FAIL
- Lint: PASS/FAIL
- Tests: PASS/FAIL
- Build: PASS/FAIL

### Regression Checks

- Feature A: PASS
- Feature B: PASS
- Feature C: PASS

### Known Issues

- ...

### Recommended Next Phase

<phase>
```

---

# 8. Git Safety Rules

Before starting a phase:

```bash
git status
```

The working tree state must be understood before modifications.

After completing a task:

```bash
git diff --stat
git diff
```

Review the actual changes.

Do not automatically revert pre-existing user changes.

Do not overwrite unrelated work.

If the working tree contains changes that appear unrelated to the current task:

> Stop and report them before modifying those files.

---

# 9. Stop Conditions

OpenCode must **STOP and report instead of guessing** when:

* the expected API does not exist
* the database schema contradicts the intended behavior
* a migration appears necessary
* authentication behavior is ambiguous
* a security decision is unclear
* a business rule cannot be determined
* existing data appears inconsistent
* fixing one module requires a major architectural change
* a shared component appears to be responsible for multiple unrelated regressions
* the requested behavior conflicts with existing documented behavior

Do not invent business rules.

---

# 10. Priority Rules

When multiple issues are discovered during a task:

### Fix immediately if:

* security vulnerability
* data corruption
* authentication bypass
* authorization bypass
* destructive database behavior

### Do not expand scope if:

* unrelated UI cleanup is discovered
* unrelated refactoring opportunity exists
* naming could be improved
* another module could theoretically be redesigned

Create a separate task instead.

---

# 11. Final Definition of Done

SAHER Internals is considered stabilized only when:

* [ ] All CRITICAL tasks are complete.
* [ ] All HIGH priority tasks are complete.
* [ ] Medium priority notification UI is complete or explicitly deferred.
* [ ] Authentication works correctly.
* [ ] Revocation works correctly.
* [ ] Soft deletion works consistently.
* [ ] Image/file previews work.
* [ ] Forms validate correctly.
* [ ] Bill management works.
* [ ] User registration works.
* [ ] Profile works.
* [ ] Notice deletion works.
* [ ] Leave proof works.
* [ ] Leave calculations are correct.
* [ ] Attendance correction works.
* [ ] Notification UI works.
* [ ] Full regression testing passes.
* [ ] No known critical/security regressions remain.

---

# 12. Execution Order

Execute phases in this order:

```text
PHASE 0
Authentication & Authorization
        ↓
PHASE 1
Soft Delete
        ↓
PHASE 2
Image/File Preview
        ↓
PHASE 3
Global Validation
        ↓
PHASE 4
Bill Management
        ↓
PHASE 5
User Registration & Profile
        ↓
PHASE 6
Notice & Leave
        ↓
PHASE 7
Attendance Correction
        ↓
PHASE 8
Notification UI
        ↓
PHASE 9
Full Regression
```

**Do not skip Phase 0.**

**Do not perform Phase 9 until all applicable previous phases are complete.**

---

# 13. Final Instruction to OpenCode

> You are working on an existing production-oriented codebase. Your objective is stabilization, not redesign.
>
> Inspect before modifying. Identify the root cause before implementing a fix. Make the smallest safe change. Preserve existing architecture and working functionality. Do not refactor unrelated code. Do not invent business rules. Do not weaken security or validation. Backend validation is mandatory even when frontend validation exists.
>
> Work phase-by-phase from this document. Do not silently skip failed tasks. If a requirement is ambiguous, stop and report the ambiguity. If a change has broader architectural implications, stop and explain them before proceeding.
>
> After every phase, run the relevant typecheck, lint, tests, and build where applicable. Verify the actual feature behavior rather than relying only on compilation.
>
> Before declaring the entire stabilization phase complete, perform the full regression checklist.
>
> **A passing build does not mean a passing feature.**
>
> **A fixed frontend does not mean a fixed system.**
>
> **Do not mark a task complete until the complete request/data flow has been verified.**
