---
phase: 03-noticeboard-pilot
reviewed: 2026-08-26T04:45:19Z
depth: standard
files_reviewed: 28
files_reviewed_list:
  - app/(main)/(admin)/layout.tsx
  - app/(main)/(admin)/noticeboard/[id]/edit/page.tsx
  - app/(main)/(admin)/noticeboard/new/page.tsx
  - app/(main)/(manager)/layout.tsx
  - app/(main)/noticeboard/[id]/page.tsx
  - app/(main)/noticeboard/page.tsx
  - components/data-table.tsx
  - components/pagination-footer.tsx
  - components/shared/pagination-footer.tsx
  - components/shared/trash-tab-pattern.tsx
  - components/sidebar/nav-list.tsx
  - features/attendance/attendance-correction-requests.tsx
  - features/attendance/attendance-table.tsx
  - features/attendance-correction/corrections/data-table.tsx
  - features/dashboard/attendance-grid/attendance-dashboard.tsx
  - features/dashboard/range-attendance-table.tsx
  - features/dashboard/today-attendance-table.tsx
  - features/mail/data-table.tsx
  - features/noticeboard/notice-card.tsx
  - features/noticeboard/notice-detail.tsx
  - features/noticeboard/notice-edit.tsx
  - features/noticeboard/notice-expiry-badge.tsx
  - features/noticeboard/notice-feed.tsx
  - features/noticeboard/notice-form.tsx
  - features/noticeboard/notice-trash.tsx
  - features/users/data-table.tsx
  - hooks/use-notice.ts
  - services/notice.api.ts
findings:
  critical: 2
  warning: 4
  info: 6
  total: 12
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-08-26T04:45:19Z
**Depth:** standard
**Files Reviewed:** 28
**Status:** issues_found

## Summary

Reviewed the noticeboard slice (service, hook, feed/detail/edit/trash, admin CRUD pages), the promoted `PaginationFooter`, the new `TrashTabPattern` / `components/data-table.tsx`, and the 10 retrofit files. Retrofit diffs are import swaps only (~2 lines each); findings in those files are flagged as pre-existing.

Two blockers: (1) the noticeboard create/edit routes sit under the `(admin)` segment guarded by `user:write` — the one permission the only notice-authorizing role (`"user"`) lacks — so the staff feed's "New Notice" button leads straight to `/forbidden`, while roles who *can* open the route get rejected by the backend on submit; (2) `notice-form.tsx` converts expiry dates via UTC (`toISOString().split("T")[0]`), so every edit round-trip silently shifts a stored IST-midnight expiry back one day when saved — verified against the backend controller, which stores PUT payloads verbatim.

Cross-checked and cleared (no action): permissions matrix is an accurate mirror of `../saher-backend/src/permission/role-permission.ts`; badge variants `outline-success`/`outline-warn` exist; `apiFetch` envelope usage in `notice.api.ts` is correct (`res.data` array); `PaginationFooter` handles `totalPages = 0/NaN` safely ("1 of --", buttons disabled); `getExpiryStatus` boundaries match D-03; nav-list hook ordering is correct; render-phase page clamp in `notice-feed.tsx` is the sanctioned React "adjust state during rendering" pattern and is properly guarded.

## Critical Issues

### CR-01: Noticeboard create/edit routes gated by wrong permission — authoring flow broken for every role

**Files:** `app/(main)/(admin)/noticeboard/new/page.tsx:5-13`, `app/(main)/(admin)/noticeboard/[id]/edit/page.tsx:1-10`, `app/(main)/(admin)/layout.tsx:14`, `features/noticeboard/notice-feed.tsx:65-70`, `lib/permissions.ts:112-127`
**Issue:** The feed renders "New Notice" only when `can(role, "write", "notice")` is true — which per the matrix (an accurate backend mirror) is true **only for role `"user"`** (`lib/permissions.ts:118`). But the route lives under `(admin)/`, whose layout gates on `can(r, "write", "user")` — which `"user"` does **not** have. Result: a user clicks "New Notice" → `RoleGuard` redirects to `/forbidden` (`components/role-guard.tsx:20`). Conversely, admin/manager *can* open `/noticeboard/new` (they hold `user:write`) but lack `notice:write`, so the backend rejects their POST/PUT. No role can complete a create or edit end-to-end. Same inversion applies to delete buttons: visible only to `"user"` (`notice-feed.tsx:32`).
**Fix:** Gate the two noticeboard authoring routes by the resource they actually touch, not by their parent folder:

```tsx
// app/(main)/(admin)/noticeboard/new/page.tsx (or move both routes out of (admin))
"use client";
import RoleGuard from "@/components/role-guard";
import { can } from "@/lib/permissions";

export default function NewNoticePage() {
  return (
    <RoleGuard allow={(r) => can(r, "write", "notice")}>
      {/* existing page body */}
    </RoleGuard>
  );
}
```

(For `[id]/edit` use `can(r, "update", "notice")`. Note `RoleGuard`'s `allow` callback requires a client boundary — same pattern as the layouts fixed in commit acd1fa9.)

### CR-02: Edit form shifts expiry back one day via UTC conversion; violates IST constraint

**File:** `features/noticeboard/notice-form.tsx:35-41`
**Issue:** `defaultExpiry` uses `new Date(initialData.expiresAt).toISOString().split("T")[0]`. All expiries are stored as IST midnight (`dateInputToIso` → `…T00:00:00+05:30`); rendered as UTC that is the **previous calendar day**. Verified against the backend: `addNotice` adds +1 day to POSTed dates, but `editNotice` (`../saher-backend/src/notice/notice.controller.ts:36-56`) stores the PUT payload verbatim. So: create with Sep 2 → stored Sep 3 IST midnight → edit form shows "Sep 2" → saving untouched sends Sep 2 → expiry regresses a full day (badges flip to "expiring/expired" early). The create-mode default (`d.toISOString().split("T")[0]`, lines 37–41) has the same UTC skew between 00:00–05:30 IST. This also breaches the project constraint "All date logic must be IST-aware".
**Fix:** Use the existing IST helper instead of UTC math:

```tsx
import { dateToIstDateOnly } from "@/lib/date";

const defaultExpiry = initialData
  ? dateToIstDateOnly(new Date(initialData.expiresAt))
  : dateToIstDateOnly(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
```

## Warnings

### WR-01: Detail query resolves `undefined` → errored query; duplicate caching strategy for the same endpoint

**File:** `hooks/use-notice.ts:26-30`
**Issue:** The detail `queryFn` returns `(await getNotices()).find(...)` — `undefined` when the id doesn't match (deleted/expired/bad URL). TanStack Query v5 throws on undefined queryFn data (confirmed in `@tanstack/query-core@5.100.9`, `query.js:295`: "Query data cannot be undefined"), so the query enters error state instead of clean empty data. Additionally it refetches the entire list under a separate key `["notices","detail",id]` on every edit-page visit, while `notice-detail.tsx:22-24` resolves the same way inline from the shared `["notices","active"]` cache — two divergent strategies, double traffic.
**Fix:** Delete the detail query and reuse the active list, as `NoticeDetail` already does:

```ts
// notice-edit.tsx
const { notices } = useNotices();
const n = notices.data?.find((x) => x._id === noticeId);
if (notices.isLoading) return <DefaultLoader className="min-h-[50vh]" />;
if (!n) return <NoData … />;
```

One fetch, one cache entry, no undefined-queryFn hazard.

### WR-02: No UI path to edit any notice — edit route is dead code without CR-01's fix

**Files:** `features/noticeboard/notice-card.tsx:33-65`, `features/noticeboard/notice-detail.tsx:41-64`
**Issue:** Neither the card nor the detail view offers an Edit affordance, even for roles holding `notice:update`. `/noticeboard/[id]/edit` is reachable only by typing the URL. The phase's "admin CRUD" deliverable is missing its update entry point.
**Fix:** On `NoticeDetail` (or card footer), conditionally render:

```tsx
{can(user?.role ?? "intern", "update", "notice") && (
  <Button onClick={() => router.push(`/noticeboard/${notice._id}/edit`)}>Edit</Button>
)}
```

### WR-03: Status-mark actions leave range view stale and reject unhandled (pre-existing, touched files)

**Files:** `features/dashboard/range-attendance-table.tsx:117-133`, `features/dashboard/today-attendance-table.tsx:81-97`
**Issue:** (a) `submitHandler` invalidates only `["attendance","today","list"]`; the range table's own key `["attendance","range",…]` (and the dashboard grid's `["attendance", …]`) never refresh, so after marking Absent the toast confirms but the row doesn't change. (b) The async handler is invoked directly from `onClick` with no catch — a failed request becomes an unhandled promise rejection (the toast still fires via `apiFetch`). Pre-existing logic; this phase only swapped the footer import.
**Fix:** Invalidate the prefix once and guard the call:

```tsx
onClick={() =>
  submitHandler(attendance, status, late).catch((e) => logError(e, { context: "mark-attendance" }))
}
// inside submitHandler:
queryClient.invalidateQueries({ queryKey: ["attendance"] });
```

(The prefix also covers today/range/grid/correction keys in one line.)

### WR-04: Clickable NoticeCard is not keyboard-accessible

**File:** `features/noticeboard/notice-card.tsx:34-37`
**Issue:** Navigation is wired to `onClick` on a `<Card>` div — no `role`, `tabIndex`, or keyboard handler. Keyboard and screen-reader users cannot open any notice detail.
**Fix:** Make the card a link instead of a click-div:

```tsx
<Link href={`/noticeboard/${notice._id}`} className="block …card classes…">
```

(or minimally add `role="button" tabIndex={0}` + `onKeyDown` Enter/Space handling).

## Info

### IN-01: PaginationFooter bridge shim has zero consumers

**File:** `components/pagination-footer.tsx:1`
**Issue:** All 10 retrofits import `@/components/shared/pagination-footer`; grep finds no source file importing the old path. The re-export shim is currently dead code (phase-04 plan docs still reference the old path).
**Fix:** Either delete the shim and correct the phase-04 plans, or keep it deliberately with a comment naming its purpose.

### IN-02: Notice schema skips trim normalization used elsewhere

**File:** `services/notice.api.ts:17-21`
**Issue:** `title`/`description` accept whitespace-only strings (`.min(1)` passes `"   "`); project precedent (`features/register/register-schema.ts`) normalizes with `.trim()` inside schemas.
**Fix:** `.pipe(z.string().min(1))` over `.trim()`ed inputs, or `.transform((v) => v.trim()).refine(...)`.

### IN-03: Feed defaults unloaded role to most-permissive tier

**File:** `features/noticeboard/notice-feed.tsx:32`
**Issue:** `can(user?.role ?? "user", …)` grants create/delete buttons to everyone during the `useMe` load; admins/interns see buttons flash then vanish.
**Fix:** Default restrictive: `?? "intern"`, or hide actions until `user` is defined.

### IN-04: Corrections data-table nits (pre-existing)

**File:** `features/attendance-correction/corrections/data-table.tsx:45-49,78,87-88`
**Issue:** `columnFilters` state is wired but no filter input exists (dead state); `manualSorting: true` while the server query ignores sort order — sortable-looking headers do nothing; NoData copy says "No Chart To Show … This Chart" in a table component.
**Fix:** Drop unused state, pass `sort` to `useAdminAttendanceCorrection`, correct copy.

### IN-05: `refetch: any` where a precise type already exists in a sibling

**File:** `features/users/data-table.tsx:39-40`
**Issue:** `refetch: any` (with eslint-disable) while `features/mail/data-table.tsx:40` types the identical prop as `() => void`.
**Fix:** `refetch: () => void;` and drop the disable comment.

### IN-06: TODO comment + duplicated resolution logic in NoticeDetail

**File:** `features/noticeboard/notice-detail.tsx:19-24`
**Issue:** Adds a new `TODO` (project convention keeps TODO debt at zero besides one legacy stray), and hand-rolls list-scan resolution that WR-01's consolidation should own in one place.
**Fix:** Resolved automatically by adopting the WR-01 fix; remove the TODO.

---

_Considered and not flagged:_ `PaginationFooter` disabled-state/readout edge cases (correct); expiry-badge thresholds vs D-03 (correct); badge variant existence (verified); `apiFetch` envelope/array handling (correct); nav-list hooks-before-conditional-return (correct); render-phase `setPage` clamp in feed (guarded, sanctioned pattern); `(admin)`/`(manager)` layout guard semantics beyond the noticeboard routes (pre-existing, unchanged by this phase).

_Reviewed: 2026-08-26T04:45:19Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
