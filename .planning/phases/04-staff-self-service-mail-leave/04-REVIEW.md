---
phase: 04-staff-self-service-mail-leave
reviewed: 2026-08-26T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - app/(main)/mail/page.tsx
  - components/user-search-picker.tsx
  - features/leave/admin-page.tsx
  - features/leave/apply-leave-dialog.tsx
  - features/leave/leave-details-dialog.tsx
  - features/leave/leave-table.tsx
  - features/leave/leave-type-dialog.tsx
  - features/leave/page.tsx
  - features/mail/column.tsx
  - features/mail/data-table.tsx
  - features/mail/outbox-column.tsx
  - features/program/session/session-editor.tsx
  - hooks/use-mail.ts
  - services/leave.api.ts
  - services/mail.api.ts
findings:
  critical: 2
  warning: 9
  info: 9
  total: 20
fixed:
  critical: 2
  warning: 4
  info: 0
  total: 6
fixed_report: 04-REVIEW-FIX.md
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-08-26
**Depth:** standard (with backend contract checks against `../saher-backend`)
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Mail and leave modules were reviewed against project conventions (AGENTS.md) and the live backend contracts (`src/mail/*`, `src/leave/*`, `src/upload/image/*`, `src/user/*`). Two blockers found, both cross-layer contract breaks that ship broken user flows:

1. **Leave proof upload crashes at runtime** — `components/image-upload.tsx` reads `res.file`, but `apiFetch` returns the envelope `{ success, message, data }` and the upload controller puts the payload in `data`. The callback receives `undefined` and the dialog's `(file) => field.onChange(file.src)` throws a TypeError. Even if the field were read correctly, the backend returns `{ url }`, not `{ src }`.
2. **Editing a leave application silently drops type changes** — the dialog sends `{ type: <code> }`, but the backend update controller only reads `payload.leaveCode` and resolves types by `_id`. The user's type selection is validated client-side, sent, accepted by the server schema — and ignored.

Also pervasive: duplicate success/error toasts from the service layer fighting `apiFetch`'s built-in toasting (with unreachable `!res.success` branches), client/server validation drift (reason min 3 vs min 5), mail pagination that can never leave page 1, and raw date-only strings sent without the mandated `+05:30` offset.

XSS posture of HTML mail bodies is sound: bodies are rendered as React text nodes (auto-escaped), never via `dangerouslySetInnerHTML`. No `console.log`, `toISOString()`, or date-fns usage in any reviewed file — all formatting routes through `lib/date.ts`.

## Critical Issues

### CR-01: Leave proof upload always throws — reads nonexistent `res.file` off the apiFetch envelope

**Severity:** BLOCKER
**Files:** `components/image-upload.tsx:115-124`, `features/leave/apply-leave-dialog.tsx:252-256`
**Issue:** `uploadImageController` (`../saher-backend/src/upload/image/image.controller.ts:83-95`) returns the uploaded media inside `data: { id, fileName, url, size, ... }`. But image-upload does:

```ts
const res = await apiFetch("/api/upload/image", { method: "POST", body: formData });
if (res?.success) {
  // @ts-expect-error - this will be present
  onUploadSuccess?.(res.file);   // res.file is undefined — envelope has no `file` key
```

The `@ts-expect-error` suppressed exactly the error that predicted this bug. The dialog's callback then executes `file.src` on `undefined`:

```ts
onUploadSuccess={(file) => field.onChange(file.src)}   // TypeError: Cannot read properties of undefined
```

The throw happens inside the async `canvas.toBlob` callback with no catch → unhandled rejection, no toast, proof never set. Every "attach proof" action in Apply/Edit Leave is dead. If the type requires proof, the submit then fails server-side ("Proof is required for …"). Note the second latent mismatch: even `res.data` has shape `{ url }`, not `{ src }`.
**Fix:**

```ts
// components/image-upload.tsx
if (res?.success) {
  onUploadSuccess?.(res.data); // typed as the controller payload; drop the ts-expect-error
}

// features/leave/apply-leave-dialog.tsx
onUploadSuccess={(file) => field.onChange(file.url)}
```

### CR-02: Editing a leave application silently ignores the selected leave type

**Severity:** BLOCKER
**Files:** `features/leave/apply-leave-dialog.tsx:104-123`, `services/leave.api.ts:168-176,243-259`
**Issue:** The edit path submits the whole form including `type` (the leave-type *code*, e.g. `"CL"`) to `PUT /api/leave/application/update/:id`. The backend controller (`../saher-backend/src/leave/leave.controller.ts:185-194,207-223`) only recognizes `payload.leaveCode`, resolves it via `LeaveType.findOne({ _id: ... })`, and builds `$set` exclusively from `startDate | endDate | leaveCode | reason | proof`. `payload.type` passes zod validation (the update schema still declares `type`) and is then discarded. Result: a staff member who changes "Casual Leave" → "Emergency Leave" while editing gets a success toast, but the application keeps the old leave type — wrong balances are eventually decremented on approval. Data-integrity bug via contract drift.
**Fix (frontend side, matching the backend contract):**

```ts
// apply-leave-dialog.tsx onSubmit, edit branch
updateApplication.mutate(
  { id: leave.id, data: { ...values, leaveCode: values.type } },
  { onSuccess: ..., onError: handleError },
);
```

…and remove `type` from the update payload (or rename the field end-to-end). Backend should also stop accepting-and-ignoring `type` in `updateLeaveApplicationSchema`.

## Warnings

### WR-01: Service layer double-toasts and carries unreachable failure branches

**Severity:** WARNING
**File:** `services/leave.api.ts:192-193,203-204,221-222,237-238,255-256,273-274,292-293,312-313,326-327`
**Issue:** `apiFetch` already toasts every failure and **throws** on `!success` (`lib/api-wrapper.ts:122-123`), so every `if (!res.success) toast.error(res.message)` in this file is dead code. Meanwhile every `else toast.success(...)` stacks a *second* success toast on top of the ones dialogs show themselves (`apply-leave-dialog.tsx:112,127`, `review-leave-dialog.tsx:60`, `leave-type-dialog.tsx:92,101`) — users get two toasts per successful action. Error paths double-toast too: `handleError` (`apply-leave-dialog.tsx:94-102`) re-toasts what `apiFetch` already toasted. Also violates the convention that `services/*.api.ts` stay pure fetch+types with no UI concerns.
**Fix:** Delete all toast calls from `services/leave.api.ts`; keep the single success toast in each dialog's `onSuccess` and drop `toast.error` from `handleError`'s generic branch (keep only the inline overlap-error routing).

### WR-02: Client/server validation drift on apply-leave form

**Severity:** WARNING
**File:** `services/leave.api.ts:36-46` vs `../saher-backend/src/leave/leave.schema.ts:11-15,20-26`
**Issue:** Frontend `applyLeaveSchema` allows `reason` ≥ 3 chars and has no `endDate >= startDate` refine; backend requires reason ≥ 5 chars and rejects inverted ranges. A 3–4 character reason or end-before-start range sails through client validation and fails only at the server, producing a late, generic toast instead of inline `FieldError`s.
**Fix:**

```ts
export const applyLeaveSchema = z
  .object({
    type: z.string().min(1, "Please select leave type"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z.string().trim().min(5, "Reason must contain at least 5 characters"),
    proof: z.string().optional(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "End date cannot be before start date",
    path: ["endDate"],
  });
```

(ISO `YYYY-MM-DD` strings compare correctly lexicographically.)

### WR-03: Date-only values submitted without the mandated `+05:30` offset

**Severity:** WARNING
**Files:** `features/leave/apply-leave-dialog.tsx:104-138`, `services/leave.api.ts:168-174`; unused helper `lib/date.ts:123-125`
**Issue:** Project constraint: "All date logic must be IST-aware; send `+05:30` offsets." The apply/edit forms send raw `<input type="date">` values (`"2026-08-26"`, offset-less) straight into the payload. The backend currently coerces them with `z.coerce.date()` → UTC midnight, which happens to work, but the semantics now depend on the server's timezone handling instead of the documented convention — and `lib/date.dateInputToIso()` exists precisely for this and is not used.
**Fix:** In the submit handler convert before mutating:
`startDate: dateInputToIso(values.startDate), endDate: dateInputToIso(values.endDate)` (and relax `ApplyLeaveType`→payload typing accordingly).

### WR-04: Mail pagination can never advance past page 1 — older mail is unreachable

**Severity:** WARNING
**Files:** `hooks/use-mail.ts:15-28`, `app/(main)/mail/page.tsx:63`, `features/mail/data-table.tsx:167-173`
**Issue:** `useMail` hard-defaults `page = 1` and the mail page never passes page state, so `GET /api/mail?page=1&limit=10` returns only the newest 10 mails forever. `MailDataTable` then layers TanStack *client-side* pagination over those same 10 rows, so `table.getPageCount()` is always ≤ 1 and the `PaginationFooter` shows one inert page. Inbox/Sent beyond 10 items cannot be displayed by any user interaction.
**Fix:** Lift `page` into component state per tab, pass it to `useMail({ page, limit })`, drive `onPageChange` from the footer to that state (server-side paging), and drop `getPaginationRowModel` from `MailDataTable` — one pagger, not two half-wired ones.

### WR-05: Mail body display double-escapes — readers see literal `&lt;` / `&amp;` entities

**Severity:** WARNING
**File:** `app/(main)/mail/page.tsx:52-58,340-342`
**Issue:** React already escapes text children. Pre-escaping with `escapeHtml` means a body containing `<`, `>`, `&`, or quotes renders as visible entity soup (`AT&amp;T`, `a &lt; b`). XSS-safe either way, but the reader mangles ordinary text.
**Fix:** Render the body directly — `{selectedMail?.body ?? ""}` — inside the existing `whitespace-pre-wrap` div, and delete `escapeHtml`. Keep the reply-quote builder as-is (plain text).

### WR-06: User-search keyword interpolated into URL without encoding

**Severity:** WARNING
**File:** `services/mail.api.ts:43-48`
**Issue:** `` apiFetch<MailUser[]>("/api/user/" + keyword) `` — a keyword containing `?`, `#`, `%`, or other reserved characters corrupts the URL (`#` truncates the path entirely, `?` leaks the rest into query params), breaking search for ordinary inputs like `a?b` or pasted emails with encoded chars. The backend route is `GET /api/user/:keyword` (`src/user/user.routes.ts:15`).
**Fix:** `` `/api/user/${encodeURIComponent(keyword)}` ``

### WR-07: Session editor drags the full inbox + sent queries along just to reuse speaker search

**Severity:** WARNING
**File:** `features/program/session/session-editor.tsx:47`
**Issue:** `useMail({ keyword: userKeyWord })` unconditionally fires `GET /api/mail` and `GET /api/mail/outbox` the moment the editor mounts (both queries have no `enabled` guard) — two unrelated list fetches per session-edit open, purely because the `user` search query shares the hook. It also couples the program domain to the mail domain's data layer.
**Fix:** Extract the user-search query into its own tiny hook (or use `UserSearchPicker` directly for speakers) so `useMail` stays about mail.

### WR-08: Hand-written leave types contradict the zod-inferred ones sitting next to them

**Severity:** WARNING
**File:** `services/leave.api.ts:112-176` (vs schemas at 66-106)
**Issue:** The file defines `leaveApplicationSchema`/`leaveBalanceSchema`/`createLeaveTypeSchema` (convention: derive types via `z.infer`) and then *also* parallel hand-written `LeaveT`, `LeaveBalanceT`, `CreateLeaveTypePayload`, which the whole feature actually consumes. They already diverge: `LeaveT.startDate`/`endDate` are typed `Date` but arrive as ISO strings over the wire (today masked by `formatIstDate` accepting both); `LeaveBalanceT.balance` hardcodes `casual/paternity/emergency` keys while the backend keys balance by arbitrary leave-type *name* (`leave.controller.ts:395`). This drifts further every edit.
**Fix:** Delete the hand-written duplicates and export `type LeaveT = z.infer<typeof leaveApplicationSchema>` etc.; render balance cards generically from `Object.entries` (already done) so the fake literal keys disappear.

### WR-09: Leave list pagination wiring is dead weight — backend ignores `page`/`limit`

**Severity:** WARNING
**Files:** `services/leave.api.ts:279-315`, `features/leave/page.tsx:82-89`, `features/leave/admin-page.tsx:208-218`; backend `src/leave/leave.controller.ts:296-349`
**Issue:** Both frontend list functions append `?page=&limit=`, and both pages wire `PaginationFooter` + `router.push` page state — but `getLeaveApplicationController` / `getAllLeaveApplicationController` run unbounded `find().populate().lean()` with no skip/limit/meta. `normalizeList` therefore computes `totalPages = 1` and the footers never render; the URL-param pagination plumbing is inert code, and admins load the entire applications table. Contract check finding: either implement server paging (backend) or strip the params/footer plumbing (frontend) — today both halves pretend.
**Fix (minimal frontend-honest version):** drop `page`/`limit` params and the pagination props until the backend ships meta; flag the unbounded query to the backend owners.

## Info

### IN-01: Unguarded `users[0]` in outbox column

**File:** `features/mail/outbox-column.tsx:14-22`
**Issue:** `const user = users[0]` then `user.name` — `outboxMailSchema` permits an empty `to` array; one legacy/corrupt row crashes the whole Sent tab render.
**Fix:** Early-return a placeholder cell when `!user`.

### IN-02: Picker timers never cleaned up on unmount

**File:** `components/user-search-picker.tsx:33-34,47-65`
**Issue:** `debounceRef`/`blurRef` timeouts are cleared on re-input but not on unmount → late `setDebouncedKeyword`/`setOpen` after unmount and a stray query. Minor, but one `useEffect(() => () => { clearTimeout(...) }, [])` closes it.
**Fix:** Add unmount cleanup effect.

### IN-03: Two parallel user-search implementations

**Files:** `components/user-search-picker.tsx:36-40`, `hooks/use-mail.ts:30-34`
**Issue:** Identical `getSearchUser` query duplicated inline in the picker (`["users", debouncedKeyword]`) and in the hook (`["users", keyword]`, plus a `keyword as string` cast). Keys line up today, but behavior (enabled thresholds, staleTime) can drift silently since they share cache space.
**Fix:** One shared hook consumed by both (see WR-07).

### IN-04: Compose form schema validates recipients as `z.array(z.any())`

**File:** `app/(main)/mail/page.tsx:44-50`
**Issue:** `to/cc/bcc` accept anything; the `MailUser` casts happen later in `onSubmit`. Reuse `mailUserSchema` (`services/mail.api.ts:5-11`) for real validation and honest types: `z.array(mailUserSchema).min(1, ...)`.
**Fix:** Swap the three `z.any()` arrays for `z.array(mailUserSchema)`.

### IN-05: Reply prefill leaves stale Cc/Bcc from previous compose

**File:** `app/(main)/mail/page.tsx:344-364`
**Issue:** Reply sets `to`/`subject`/`body` but not `cc`/`bcc`, so leftovers from an abandoned compose ride along on the reply.
**Fix:** `form.setValue("cc", []); form.setValue("bcc", []);` alongside the existing `setValue("to", ...)`.

### IN-06: Inconsistent PaginationFooter import paths (shim vs direct)

**Files:** `components/pagination-footer.tsx:1`, `features/leave/leave-table.tsx:23`, `features/leave/admin-page.tsx:20` vs `features/mail/data-table.tsx:34`
**Issue:** Leave files import a one-line re-export shim; mail imports `@/components/shared/pagination-footer` directly. Same component, two import idioms.
**Fix:** Import the shared path everywhere and delete the shim.

### IN-07: Session-editor nits (touched file)

**File:** `features/program/session/session-editor.tsx:59,86`
**Issue:** (a) `description` defaults to literal placeholder HTML `"<p>Enter Session Description</p>"` which ships as real content if the user never touches the editor — use `""` and let Tiptap's own placeholder show it. (b) `(res as { message: string }).message` cast where the mutation result already carries `message` — type the mutation instead.
**Fix:** Change the default; drop the cast once `add`'s success type includes `message`.

### IN-08: Reject icon opens the same approve-defaulted review dialog

**File:** `features/leave/admin-page.tsx:177-195`
**Issue:** Both ✓ and ✗ buttons call `setReviewLeave(leave)`; the dialog's status radio defaults to `"approved"`, so the reject affordance leads with Approve preselected — one Enter away from a mis-approval.
**Fix:** Seed `status` from which button opened the dialog (e.g. pass an initial status prop, defaulting the radio accordingly).

### IN-09: `mailUserSchema.image` marked required while every consumer optional-chains it

**File:** `services/mail.api.ts:10` (consumers: `column.tsx:20`, `outbox-column.tsx:21`, `app/(main)/mail/page.tsx:245-320`)
**Issue:** Schema says `image: z.object({...})` (required) but all rendering does `user.image?.src` — and the backend aggregates actually *drop* recipients whose image lookup comes up empty (`$unwind` without `preserveNullAndEmptyArrays`, `src/libs/utils/mail.ts:100,140`; outbox sender unwind at `mail.controller.ts:96-97` can drop whole mails). Make optionality explicit on both sides.
**Fix:** `image: z.object({...}).nullable().optional()` in the schema; separately flag the backend unwinds — senders/recipients without avatars vanish from inbox/outbox results today.

---

_Reviewed: 2026-08-26_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
