// ========================
// ROLE PERMISSIONS MATRIX
// ========================
// Verbatim mirror of ../saher-backend/src/permission/role-permission.ts (D-13).
// This is UX-only — every endpoint remains server-enforced.
// D-15: role strings pinned by live GET /api/auth/me probe (or A1 acceptance).

export type UserRole = "intern" | "user" | "manager" | "admin";
export type PermissionAction = "read" | "write" | "update" | "delete";
export type PermissionResource =
  | "account"
  | "user"
  | "bank"
  | "attendance"
  | "attendance-correction"
  | "holiday"
  | "notification"
  | "mail"
  | "notice"
  | "leave"
  | "leaveType"
  | "preReimbursement"
  | "postReimbursement"
  | "event"
  | "payroll";

export const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<string>> = {
  admin: new Set([
    "account:read",
    "user:read",
    "holiday:read",
    "attendance:read",
    "attendance-correction:read",
    "event:read",
    "mail:read",
    "payroll:read",
    "preReimbursement:read",
    "postReimbursement:read",
    "leaveType:read",
    "leave:read",
    "bank:read",
    "notification:read",
    "notice:read",
    "notice:write",
    "notice:update",
    "notice:delete",
    "account:write",
    "account:update",
    "account:delete",
    "user:write",
    "user:update",
    "user:delete",
    "holiday:write",
    "holiday:update",
    "holiday:delete",
    "attendance:write",
    "attendance:update",
    "attendance-correction:write",
    "attendance-correction:update",
    "event:write",
    "event:update",
    "event:delete",
    "mail:write",
    "payroll:write",
    "payroll:update",
    "preReimbursement:write",
    "preReimbursement:update",
    "preReimbursement:delete",
    "postReimbursement:update",
    "leaveType:write",
    "leaveType:update",
    "leave:write",
    "leave:update",
  ]),

  manager: new Set([
    "user:read",
    "holiday:read",
    "attendance:read",
    "attendance-correction:read",
    "event:read",
    "mail:read",
    "preReimbursement:read",
    "postReimbursement:read",
    "leave:read",
    "bank:read",
    "notification:read",
    "account:write",
    "account:update",
    "user:write",
    "user:update",
    "holiday:write",
    "holiday:update",
    "holiday:delete",
    "bank:write",
    "bank:update",
    "attendance:write",
    "attendance:update",
    "attendance-correction:write",
    "attendance-correction:update",
    "event:write",
    "event:update",
    "notification:write",
    "notification:update",
    "notification:delete",
    "mail:write",
    "preReimbursement:write",
    "preReimbursement:update",
    "preReimbursement:delete",
    "postReimbursement:update",
    "leave:write",
    "leave:update",
  ]),

  user: new Set([
    "event:read",
    "attendance:read",
    "attendance:write",
    "attendance-correction:write",
    "mail:write",
    "notice:write",
    "notice:update",
    "notice:delete",
    "postReimbursement:write",
    "postReimbursement:update",
    "postReimbursement:delete",
    "preReimbursement:update",
    "leave:write",
    "leave:update",
  ]),

  intern: new Set(["event:read"]),
};

export const can = (
  role: UserRole,
  action: PermissionAction,
  resource: PermissionResource,
): boolean => {
  return ROLE_PERMISSIONS[role].has(`${resource}:${action}`);
};
