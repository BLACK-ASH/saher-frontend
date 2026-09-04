# Phase 3 — fix-03-form-validation Summary

## Goal
Audit all major frontend form zod schemas against their backend equivalents
and close the validation gaps where the frontend was stricter-or-looser in a
way that breaks business rules or rejects data the backend accepts.

## What changed

### Frontend
- `features/attendance/attendance-correction.tsx` — `attendanceCorrectionCreateSchema.message`
  max raised `.max(100)` → `.max(300)` to match backend `.min(3).max(300)`;
  character counter updated `/100` → `/300`.
- `features/attendance-correction/attendance-correction-view.tsx` —
  removed `"pending"` from `attendanceCorrectionStatusList` so the handle/submit
  status enum is now `['reject','on-hold','approve']`, matching backend
  `correction.schema.ts`. Normalized the informational reset value (`pending` →
  `on-hold`) so existing pending records still open cleanly.

### Docs (no code)
- `.planning/phases/fix-03-form-validation/VALIDATION-AUDIT.md` — 13-form audit
  vs backend with severity table (14 GAP rows, 5 HIGH + 2 MEDIUM).
- `.planning/phases/fix-03-form-validation/VALIDATION-BACKEND-GAPS.md` —
  backend-only gaps documented (bill amount/advance `.positive()`, leave type
  `.min(1)`), cross-referenced to owning phases (fix-04, fix-06).

## Confirmed correct (no change)
- Bill create/update `amount` + advance `advance` all `.positive()` on the
  frontend (5× present) — backend lacks these (documented, fix-04 owns).
- Leave apply: reason/min bounds + endDate>=startDate refine match backend.
- Notice create: title/description `.min(1)` match backend.
- Registration + Bank + Account-edit schemas match backend constraints.
- Session/workshop/program are intentially as-is (backend-enforced).

## Not changed (tracked)
- Leave `proof` remains `z.string().optional()` — LEAVE-01, owned by fix-06.

## Verification
- `pnpm lint` — 0 errors (58 pre-existing warnings).
- `pnpm build` — PASS.
- `pnpm test` — 428/428 PASS (28 files).
