# SAHER Frontend

Frontend for **SAHER** — an organization management platform. Staff clock in, apply
for leave, raise and settle reimbursement bills, review payroll, and communicate
through noticeboard and mail; admins and managers register users, administer
attendance corrections, programs, and accounts.

The app is a **client-side rendered** Next.js SPA. Every request goes to the
backend through a same-origin reverse proxy under `/api/*` and is wrapped by a
single fetch layer that handles auth-refresh and error toasts.

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19), Tailwind CSS v4, shadcn/ui
- **Data:** TanStack Query (server state) with `services/*.api.ts` (zod-validated
  fetch functions) and `hooks/use-*.ts` (query/mutation wrappers)
- **Forms:** react-hook-form + zod schemas
- **UI extras:** @fullcalendar (calendar), recharts (charts), Tiptap (rich text),
  sonner (toasts), next-themes (dark mode)

## Getting Started

Prerequisites: Node.js 24, pnpm, and the SAHER backend running so `/api/*` is
reachable at the same origin.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

| Command        | Purpose                                   |
|----------------|-------------------------------------------|
| `pnpm dev`     | Dev server                                |
| `pnpm build`   | Production build (type-checks)            |
| `pnpm start`   | Serve the production build                |
| `pnpm lint`    | ESLint                                    |
| `pnpm typecheck` | TypeScript `--noEmit`                  |
| `pnpm test`    | Vitest unit/component suite (MSW-mocked)  |

Environment variable: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — web-push VAPID public key
used for browser push notifications.

## Roles & Permissions

There are four roles. The sidebar and UI enforce visibility; **every endpoint is
independently enforced by the backend** — the frontend matrix is UX-only.

| Role     | Access summary                                      |
|----------|-----------------------------------------------------|
| `intern` | Read events only. No attendance, leave, bills, notice, or mail actions. |
| `user`   | Daily driver: attendance, corrections, own bills, leave, noticeboard posts, mail, program events, profile. |
| `manager`| Everything a user gets plus operations: users, banks, holidays, attendance correction handling, bill management, leave review, payroll read, notifications. |
| `admin`  | Everything plus payroll write, KYC registration, account editing, role changes, deletion/restore, leave types. |

## Functionality

### 1. Authentication & Account Security

Public flows (all OTP/email-verification based, backend-enforced):

- **Login** (`/login`) — email + password, anti-enumeration (unknown email and
  wrong password return the same 401). Guards regenerate expired tokens when
  unused.
- **Register** (`/register`, admin only) — full KYC onboarding in a multi-step
  wizard: basic details → employee details → bank details → document uploads
  (aadhaar, PAN, resume) → preview. Validates IFSC/normalizes +91 numbers.
- **Forgot password** — request the reset link, confirm with the token, set a
  new password.
- **Verify email**, **Change email**, **Change password** — request + confirm
  flows using emailed one-time confirmation tokens.
- **Active sessions** — list and revoke logged-in sessions for the current user.

### 2. Home & Profile

- **Home** (`/`) — landing for the logged-in user with shortcuts.
- **Profile** (`/profile`) — view/edit personal info, email verification status,
  change email/password entry points.
- Theme toggle (dark/light) and sidebar user menu (logout) are global.

### 3. Attendance

User (`/attendance`):

- **Check-in / check-out** — one tap each; server records IST timestamps.
  Prevents double check-out (flagged via `AttendanceStatus`). A **week-off**
  control marks a non-working day, and **overtime check-in** starts an overtime
  slot that must later be approved by an admin.
- **Status card + today's record** (`GET /api/attendance/me`), monthly history,
  charts, and a compare view against other users.
- Work hours are computed from in/out times and clamped at `>= 0`.

Admin (`/attendance/all`):

- **All Attendance** — paginated table over every user's records with filters,
  plus an **employee attendance sheet** view.
- **Range / month attendance** across users.
- **Export report** of attendance data.

Holidays (`calendar` module, admin/manager):

- Manage company holidays — create, edit, delete (`/api/attendance/holiday`).
  Holidays are shown on the calendar and considered when computing attendance.

Auto-check-in and auto-check-out (23:30 IST) scheduler runs in the backend
worker; the UI reflects its results on refresh.

### 4. Attendance Corrections

- Users can **submit a correction request** for their own attendance (missing or
  wrong in/out times) with a reason.
- Managers/admins see the request queue (`/attendance-correction`), inspect the
  original vs requested times, and **approve or reject** each request; an
  approved correction updates the attendance record.
- Admins can also directly edit/mark attendance for any user.

### 5. Calendar, Events & Holidays

- Full-featured monthly calendar (`/calendar`) — day/time/week/list views,
  powered by FullCalendar.
- **Add / edit / delete events** (program sessions, holidays, and ad-hoc
  org events); event details panel, clicking a day opens the creation dialog.

### 6. Program (events module)

Programs, sessions and workshops are the events org manages, with participant
management:

- **Programs** (`/program`) — list all, create/edit/delete (soft delete with
  restore), view program detail. A program has sessions and workshops.
- **Sessions** — create/edit sessions under a program, mark session attendance,
  review attendance, revoke a session.
- **Workshops** — create/edit workshops under a program, manage workshop
  sessions.
- **Participants** — add/update participants to a program, list all
  participants across programs, view per-program participant detail, restore
  deleted participants.
- Soft-deleted programs/sessions/workshops/participants can be restored.

### 7. Leave

- **Leave types** (admin) — create, edit, delete leave categories (Sick, Casual,
  etc.) with per-year entitlement.
- **Leave balance** — per-type entitlement with lived balances; balances are
  synthesized for active leave types even before a balance record exists.
- **Apply for leave** (`/leave`) — pick a type, dates, and attach supporting
  proof; editing an application is allowed while pending. Balance is checked and
  prevents over-application.
- **Leave management** (`/leave-management`) — managers/admins review
  applications, approve or reject with a note; user sees the updated status and
  remaining balance.
- Status badges and an apply dialog per type; balance cards show used/remaining.

### 8. Reimbursement (Bills)

**My Bills** (`/reimbursement/my-bills`):

- Users **create expense bills** with category, amount, date, description, and
  supporting images (drag-drop upload).
- **Edit / withdraw (delete)** own bills while pending; deleted bills go to a
  personal recycle bin and can be **restored**.
- Row shows `amount`, and admin-created **advance bills** show their advance
  amount (amount `||` advance fallback), formatted in ₹ (`en-IN`).
- A **balance enquiry** card reflects approved bill amounts.

**Bill Management** (`/reimbursement/management`, manager/admin):

- Finance view of all bills with a bulk action bar (apply a status to many bills
  at once) and a **bill detail dialog** with a full **lifecycle timeline**
  (created → handled → settled audit trail).
- **Handle bills** — accept, reject, or put on hold with a reason; handles the
  `advance` vs `amount` split for advance bills.
- **Settle a bill** — record settlement for an accepted bill.
- **Recycle bin** — restore or permanently remove deleted bills.
- Admin can **create an advance bill** for a user (money advanced against a
  future expense).

Endpoints: `/api/reimbursement/bill`, `/api/reimbursement/{id}`,
`/api/reimbursement/{id}/restore`, `/api/reimbursement/admin/{userId}`,
`/api/reimbursement/handle/{billId}`, `/api/reimbursement/settlement/{id}`,
`/api/reimbursement/balance-enquiry`, `/api/reimbursement/recyclebills`.

### 9. Payroll

- **Payroll table** (admin) — generated payslips per user and month.
- **Record payment** — log a payment against a payslip (mode: cash / cheque /
  UPI, date, amount).
- **Payroll history dialog** — see prior payments and the payment state of a
  slip (unpaid / partially-paid / paid / approved).
- Deductions and leave-based adjustments are reflected in expected vs paid
  amounts.
- Monthly payroll generation is driven by the backend cron
  (`/api/payroll/cron`).

### 10. Users & Directory

- **Users list** (`/users`, manager/admin) — searchable, sortable data table of
  all staff with role badges.
- **User detail** (`/users/{id}`) — full profile incl. documents; **Account
  edit** lets admins update the user's bank details and re-upload
  aadhaar/PAN/resume; **Change role** promotes/demotes a user between
  intern/user/manager/admin (takes effect for that user immediately; their open
  tabs revalidate on next request).
- **Deactivate / delete / restore** users; deleted users stop being able to log
  in and disappear from lists but their data remains restorable.
- Names resolve globally via a user map seeded from both the picker and the
  directory queries.

### 11. Noticeboard

- **Feed** (`/noticeboard`) — pinned/expiring-aware notice cards with expiry
  badges; click through to a **detail** page.
- **Create / edit / delete notices** (rich text editor via Tiptap) — staff can
  manage their own posts; managers/admins manage all.
- **Notice trash** — restore soft-deleted notices; expired notices are
  automatically flagged.

### 12. Mail

- **Inbox** — mails addressed to you (manager/admin).
- **Compose / send** (`/mail`) — search users by keyword, write a message
  (rich text), send; a **sent / outbox** view lists your sent mail with status.
- Backend wraps mail delivery; failures surface as toast errors.

### 13. Notifications & Push

- **Bell + notification box** — list notifications with read/unread state and
  mark-as-seen (`/api/notification`, `/api/notification/un-seen`).
- **Push notifications** — browser subscription via
  `navigator.serviceWorker` + web-push (VAPID); the backend can push updates
  (payroll confirmations, corrections, system reports).

### 14. Dashboard (manager/admin)

- **Today's attendance table** — who clocked in/out today with status.
- **Range attendance table** — attendance across a date range with summaries.
- **Attendance grid** — per-user calendar-style attendance grid with hover
  detail cells and per-day summary.
- **Admin overview cards** — org-level health metrics.

## API Surface

All endpoints are relative-URL fetched through `lib/api-wrapper.ts` (handles the
`ApiResponse<T>` envelope `{ success, message, data }`, cookie credentials,
single-flight token refresh on 401, and error toasts). Path base is `/api`.

| Module | Endpoints |
|--------|-----------|
| Auth | `/auth/sessions`, `/verify-email/request|confirm`, `/change-email/request|confirm`, `/change-password/request|confirm`, `/forgot-password/request|confirm` |
| Attendance | `/attendance/me`, `/attendance/check-in`, `/attendance/check-out`, `/attendance/weekoff`, `/attendance/overtime/check-in`, `/attendance/holiday`, `/attendance/correction[...]` |
| Program | `/events/programs[...]`, `/events/sessions[...]`, `/events/workshops[...]`, `/events/participants[...]` |
| Leave | `/leave/type`, `/leave/balance`, `/leave/application/apply|update|review` |
| Reimbursement | `/reimbursement/bill`, `/reimbursement/{id}[/restore]`, `/reimbursement/admin/{id}`, `/reimbursement/handle/{billId}`, `/reimbursement/settlement/{id}`, `/reimbursement/balance-enquiry`, `/reimbursement/recyclebills` |
| Payroll | `/payroll/cron` (generation), payslip/payment sub-routes |
| Admin | `/admin/account`, `/admin/user`, `/admin/{billId}`, user roles, bank routes |
| Notice | `/notice` |
| Mail | `/mail`, `/user/{keyword}` (user search) |
| Notification | `/notification`, `/notification/un-seen` |