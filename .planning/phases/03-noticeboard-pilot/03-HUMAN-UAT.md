---
status: partial
phase: 03-noticeboard-pilot
source: [03-VERIFICATION.md]
started: 2026-08-26T10:50:00Z
updated: 2026-08-26T10:50:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Create→feed round-trip as role 'user'
expected: Open /noticeboard, click New Notice — form shows IST-today+7 prefilled expiry; submit fires success toast, redirects to feed, new card visible first with Active badge
result: [pending]

### 2. Edit round-trip expiry preservation (CR-02)
expected: Create notice with chosen expiry, open /noticeboard/[id]/edit, save untouched, re-open detail — expiry day identical before/after (no UTC one-day shift)
result: [pending]

### 3. Route guard matrix (CR-01)
expected: As role 'user': /noticeboard/new and edit URLs pass guards. As admin/intern: both redirect to /forbidden
result: [pending]

### 4. Soft delete flow
expected: Trash2 icon opens dialog with notice title; Cancel = no change; Delete removes card from active feed + toast
result: [pending]

### 5. Visual pass of feed + detail
expected: Grid columns responsive mobile/desktop, badge colors green/yellow/red, IST-formatted dates ('26 Aug 2026'), line breaks preserved in detail
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
