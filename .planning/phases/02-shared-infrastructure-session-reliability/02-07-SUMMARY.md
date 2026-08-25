---
phase: 02-shared-infrastructure-session-reliability
plan: 07
status: done
---

## Summary

### Files Changed (21)

**Task 1 — Display surfaces (12 files):**
- `app/(main)/mail/page.tsx` — `.toLocaleString()` → `formatIstDateTime`
- `app/(main)/program/sessions/[id]/page.tsx` — `.toLocaleDateString()`/`.toLocaleTimeString()` → `formatIstDate`/`formatIstDateTime`
- `app/(main)/program/sessions/review/[id]/page.tsx` — `.toLocaleDateString()` → `formatIstDate`
- `features/leave/leave-table.tsx` — `.toLocaleDateString()` → `formatIstDate`
- `features/leave/admin-page.tsx` — `.toLocaleDateString()` → `formatIstDate`
- `features/leave/leave-details-dialog.tsx` — `.toLocaleDateString()` → `formatIstDate`
- `features/holiday/holiday-columns.tsx` — date-fns `format()` → `formatIstDate`, dropped date-fns import
- `features/profile/profile.tsx` — private `formatDate` helper → thin `formatIstDate` call
- `features/dashboard/attendance-grid/attendance-hover-card.tsx` — local `formatTime`/`formatDate` → `formatIstDateTime`/`formatIstDate`
- `features/dashboard/attendance-grid/attendance-table.tsx` — `.toLocaleDateString()` → `formatIstDate`
- `features/calendar/calendar.tsx` — `.toLocaleString("default",...)` → `getMonthYear`
- `features/attendance/attendance-chart.tsx` — tickFormatter `.toLocaleDateString()` → `formatIstDate`; dropped intermediate `new Date()` parse for `getMonthYear`

**Task 2 — Input surfaces + helpers (9 files):**
- `lib/date.ts` — added `dateToIstDateOnly` (en-CA parts assembly) and `istDateOnlyToDate` (fixed-offset parse)
- `tests/date.test.ts` — 4 new test cases for the two helpers (TDD)
- `features/program/session/session-editor.tsx` — fixed real bug: `new Date(\`${date}T${time}\`)` → `new Date(combineDateAndTimeToIso(date, time))` (+05:30-flavored)
- `features/holiday/holiday-form-dialog.tsx` — Calendar onChange stores YYYY-MM-DD via `dateToIstDateOnly`, selected converts via `istDateOnlyToDate`, display uses `formatIstDate`, dropped date-fns import
- `features/register/basic-details.tsx` — same machine-format storage, display → `formatIstDate`, added `timeZone="Asia/Kolkata"` to Calendar
- `features/register/employee-details.tsx` — same pattern
- `components/app-footer.tsx` — `new Date().getFullYear()` → `dateToIstDateOnly(new Date()).slice(0, 4)`
- `features/dashboard/range-attendance-table.tsx` — `new Date(prev)` → `istDateOnlyToDate(prev)`, `.toISOString().split("T")[0]` → `dateToIstDateOnly()`
- `features/dashboard/attendance-grid/attendance-dashboard.tsx` — `new Date(start/end)` → `istDateOnlyToDate(start/end)`, `formatDate` helper → `dateToIstDateOnly()`

### Verification Results

**Grep A** (hard gate — `toLocale(Date|Time)String(`): clean — zero matches outside `components/ui/`

**Grep B** (hard gate — `new Date([^)]`): 4 hits, all classified exempt:
- `attendance-dashboard.tsx:20` — `new Date(date)` where `date` is a `Date` param (object copy)
- `session-editor.tsx:75-76` — `new Date(combineDateAndTimeToIso(...))` wrapping +05:30 ISO
- `holiday-form-dialog.tsx:80` — `new Date(holiday.date)` passed to `dateToIstDateOnly`

**Grep C** (audit — bare `toLocaleString(`): clean — zero matches outside `components/ui/`

**Reviewed-exempt components/ui evidence:**
- `components/ui/calendar.tsx:43,202` — locale-aware month/aria labels inside DayPicker wiring
- `components/ui/chart.tsx:258` — `item.value.toLocaleString()` — NUMBER formatting, not date rendering

**Lint:** 0 errors (54 warnings, all pre-existing)

**Typecheck:** clean

**Tests:** 329 passed (all suites)

**Build:** pre-existing failure on `/register` page (confirmed by stash test — unrelated to date changes). Per D-04 scope guard: logged, not fixed.

### Design Decisions

- `dateToIstDateOnly` uses `Intl.DateTimeFormat` with `en-IN` locale and `formatToParts` to extract year/month/day — same approach as existing `istParts` helper
- `istDateOnlyToDate` uses fixed-offset template parse (`${value}T00:00:00+05:30`) — no timezone conversion ambiguity
- `SessionCreateT` type expects `Date` for startTime/endTime, so `combineDateAndTimeToIso` result is wrapped in `new Date()` — the +05:30 offset ensures IST-correct parsing regardless of browser timezone
- Picker-backed forms (holiday, register) now store YYYY-MM-DD machine strings — Calendar `selected` converts via `istDateOnlyToDate`, submit sends the string directly (API contract)
- `attendance-table.tsx` headers: the two-line day+weekday layout was replaced with a single `formatIstDate` call (canonical D-09 format only, no custom layout invention)
