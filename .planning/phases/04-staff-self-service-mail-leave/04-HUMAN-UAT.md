---
status: partial
phase: 04-staff-self-service-mail-leave
source: [04-VERIFICATION.md]
started: 2026-08-26T12:20:00Z
updated: 2026-08-26T12:20:00Z

## Current Test

[awaiting human testing]

## Tests

### 1. Mail round-trip: log in as two accounts; A composes to B via the To picker (type ≥2 chars, click chip), sends; B opens I
test: Mail round-trip: log in as two accounts; A composes to B via the To picker (type ≥2 chars, click chip), sends; B opens Inbox tab, clicks the row, reads body
result: [pending]

### 2. Reply flow: B clicks Reply on A's mail, observes prefilled compose, sends back to A
test: Reply flow: B clicks Reply on A's mail, observes prefilled compose, sends back to A
result: [pending]

### 3. Inbox pagination: with >10 mails in the backend, page through Inbox/Sent using the footer arrows
test: Inbox pagination: with >10 mails in the backend, page through Inbox/Sent using the footer arrows
result: [pending]

### 4. Sanitize/display check: send a mail whose body contains &, <, > and quotes; open it in the detail dialog
test: Sanitize/display check: send a mail whose body contains &, <, > and quotes; open it in the detail dialog
result: [pending]

### 5. After the /leave gate fix ships: log in as role 'user', click sidebar 'Leave', apply for leave
test: After the /leave gate fix ships: log in as role 'user', click sidebar 'Leave', apply for leave
result: [pending]

### 6. Proof upload end-to-end (CR-01 fix): in Apply Leave, drop/crop an image, wait for upload, submit
test: Proof upload end-to-end (CR-01 fix): in Apply Leave, drop/crop an image, wait for upload, submit
result: [pending]

### 7. Edit pending application (CR-02 fix): as staff, change the leave TYPE on a pending application and save; re-open details
test: Edit pending application (CR-02 fix): as staff, change the leave TYPE on a pending application and save; re-open details
result: [pending]

### 8. Manager review queue: log in as manager/admin, open /leave-management, exercise All/Pending/Approved/Rejected filters, a
test: Manager review queue: log in as manager/admin, open /leave-management, exercise All/Pending/Approved/Rejected filters, approve one request with a comment and reject another
result: [pending]

### 9. Admin leave-type CRUD: create a type, then edit a DISABLED type without touching its Active checkbox and save
test: Admin leave-type CRUD: create a type, then edit a DISABLED type without touching its Active checkbox and save
result: [pending]

### 10. Visual/responsive pass of /mail and /leave screens at mobile + desktop widths
test: Visual/responsive pass of /mail and /leave screens at mobile + desktop widths
result: [pending]

### 11. (NEW in re-verification — side effect of the guard fix) As role 'user', paste /dashboard, /users, /attendance-correction
test: (NEW in re-verification — side effect of the guard fix) As role 'user', paste /dashboard, /users, /attendance-correction and /leave-management directly into the URL bar
result: [pending]

## Summary

total: 11
passed: 0
issues: 0
pending: 11
skipped: 0
blocked: 0

## Gaps
