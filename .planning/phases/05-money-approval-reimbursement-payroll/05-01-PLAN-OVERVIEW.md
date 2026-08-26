# Phase 5 — Money & Approval: Reimbursement & Payroll

**Plan:** 01 of TBD  
**Wave:** 1  
**Status:** Planned  
**Researched:** 2026-08-26  
**Researched by:** gsd-phase-researcher  

## What This Plan Covers

This first plan establishes the foundational service layers and UI surfaces for Phase 5's money pipeline:

- **Reimbursement service layer** (`services/reimbursement.api.ts`) — Zod-inferred DTOs mirroring backend schemas exactly for all 12 reimbursement endpoints
- **Payroll service layer** (`services/payroll.api.ts`) — Zod-inferred DTOs for all 4 payroll endpoints, with `data[0]` pattern for `/:id` array response (Quirk 7)
- **Data hooks** (`hooks/use-reimbursement.ts`, `hooks/use-payroll.ts`) — TanStack Query queries/mutations with proper query keys, invalidation, and derived state
- **Staff "My Bills" page** — balance card with `PocketUse`/`AdvanceUse`/`SettledUse` numbers + `Total` string (Quirk 5), status badges, edit/withdraw actions
- **Finance "Bill Management" page** — Handle Queue tab + Recycle Bin tab with Active/Deleted filtering
- **Double-submit safety** — all money mutations gate pending state (disabled button + loading spinner, no optimistic updates; server validates idempotency)
- **REIM-11 blocker** — restore UI present but backend endpoint (D-30) not yet implemented; tracked as blocker for later phase
- **User name resolution** — `useUserMap()` cache mapping IDs to names (D-32)
- **Handle queue data source** — uses `GET /?status=pending&isDeleted=false` (D-31), after backend search schema fix

## Key Research Findings Integrated

| Finding | Resolution in Plan |
|---------|-------------------|
| `GET /bills` returns settlements, not bills | Handle queue uses `GET /?status=pending&isDeleted=false` |
| No bill restore endpoint | REIM-11 UI present; tracked as D-30 blocker |
| Settlement auto-created on accept | UI re-fetches bill detail after accept; extracts settlement ID |
| Balance `Total` is pre-formatted string | Display as-is; use `PocketUse`/`AdvanceUse`/`SettledUse` for breakdown |
| Payroll `/:id` returns array | Plan uses `data[0]` pattern |
| User IDs not populated in responses | `useUserMap()` hook caches names from search endpoint |

## Dependencies

- **Phase 4 completed** — User-search picker (D-32) available for advance bill user selection
- **Phase 3 patterns** — Trash tab pattern (Active/Deleted) reused for staff bill recycle bin
- **Phase 2 utilities** — IST date libraries (lib/date.ts) for all date rendering
- **Phase 1 gates** — Lint/typecheck/test infrastructure in place

## Open Issues (Tracked, Not Blocking)

1. **D-30:** Backend restore endpoint `PATCH /:billId/restore` — must be implemented before REIM-11 is fully achievable
2. **D-31:** Backend `searchBillQuerySchema` needs `status` field added — will enable `GET /?status=pending&isDeleted=false` for handle queue
3. **Export pattern** — async BullMQ job; download arrives via notification action (Phase 7 concern, not blocking Phase 5)

## Next Plans (TBD)

Subsequent plans will cover:
- Settlement recording and recycle bin full implementation
- Payroll installment payments and "Run Now" generation
- Advanced search and filtering for finance handle queue
- Audit log integration and export/download patterns