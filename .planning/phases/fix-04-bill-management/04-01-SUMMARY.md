# Phase 4 — fix-04-bill-management Summary

## Goal
Fix the live bill-module bugs surfaced in QA: (1) receipts uploaded at
create never display in the bill detail view, (2) the Withdraw action is a
no-op, (3) editing a bill shows the proof/receipts as empty even though they
were provided at create, and (4) the backend must reject non-positive
amounts at every layer. The admin-panel-open issue is a permission matter,
not a code defect (see "Not a bug").

## What changed

### Root cause (bugs 1 & 3 — one backend defect)
The backend `Bill` model stores receipts as `images: [Media ObjectId]`, but
every bill response ran the doc through `getBillResponseSchema`, which only
declared a singular `image: z.string().optional()` and had **no `images`
key**. Zod's default strip behavior removed the stored `images` array, and no
controller ever set `image` — so `bill.image` was always `undefined` and the
frontend could never render or prefill receipts.

### Backend
- `src/reimbursement/get-bill/get-bill.schema.ts` — replaced the dead
  `image: z.string().optional()` with `images: z.array({ id, src, alt }).default([])`,
  the contract the upload endpoints already emit (Phase 2).
- `src/reimbursement/get-bill/my-bills.controller.ts`,
  `src/reimbursement/get-bill/search-bill.controller.ts`,
  `src/reimbursement/get-bill/recycle-bill.controller.ts` — added
  `.populate('images')` so the `images` array carries the Media `{ src, alt }`
  docs on every bill read path; `normalizeDoc` already maps `_id → id`.
- `src/reimbursement/bill/schema.ts` + `src/database/bill.model.ts` — backend
  now rejects non-positive `amount` (zod `.positive()` + Mongoose `min: 1`).
  `advance` allows 0 (kept `min: 0`) because normal user bills legitimately
  carry `advance: 0`; only admin advance-bills set it positive.

### Frontend
- `services/reimbursement.api.ts` — `billSchema.image` → `images` array of
  `{ id, src, alt }` (default `[]`), mirroring the backend response schema.
- `features/reimbursement/bill-detail-dialog.tsx` — renders all receipts from
  `bill.images` (thumbnails link to full `src`).
- `features/reimbursement/edit-bill-dialog.tsx` — prefills the edit form's
  `images` from the real receipt ids (`bill.images.map(i => i.id)`).
- `app/(main)/reimbursement/my-bills/page.tsx` (bug 2) — wired `onView` to
  open `BillDetailDialog` and `onWithdraw` to a confirmation `AlertDialog`
  that calls the existing `withdraw` mutation (soft delete), which refreshes
  the list via React Query invalidation.
- `tests/lifecycle-timeline.test.tsx` — fixture updated `image: undefined` →
  `images: []` to match the new response type.

## Not a bug (info)
Bug 4 ("admin panel not opening"): the management page correctly runs behind
`<RoleGuard allow={(r) => can(r, "read", "preReimbursement")}>`. Only
`admin`/`manager` hold `preReimbursement:read`; a `user`/`intern` account is
redirected to `/forbidden` by design (server still enforces all endpoints).
If the QA account can't open the panel, its role is not admin — that is a
role/config matter, not code.

## Follow-up — admin-panel runtime crash (NOT yet root-caused)
Later QA reported the reimbursement management page throws "Something went
wrong" (app/error.tsx boundary) even when logged in as `admin`. This is a
client **runtime render/data crash**, distinct from the permission redirect.
It is NOT caused by the fix-04 receipt changes: the search/recycle responses
are NOT zod-parsed at runtime (`searchBills` returns `res.data` raw through
`normalizeList`; `billSchema` is used only as a TS type and for
`balanceEnquiry.parse`), so the `images` schema change never executes on that
data path. Root cause requires live runtime logs (deep-link the page, read
the `logError` output / dev error boundary). Likely candidates to investigate
first: `useUserMap` iterating a non-iterable cached `["users"]` value, or a
data-shape mismatch from the backend search/mybills endpoint. Revisit before
declaring the management panel stable.

## Verification
- Backend: `pnpm typecheck` PASS, `pnpm test` 257/257 PASS, `pnpm lint` 0 errors.
- Frontend: `pnpm lint` 0 errors (58 warnings), `pnpm test` 428/428 PASS, `pnpm build` PASS.

## Follow-ups
- Recycle-bin restores now also carry populated receipts (same response path).
- Backend `.populate('images')` adds a query per bill read; negligible at this
  scale — revisit the join if bill-list queries ever become hot.
