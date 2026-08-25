import { describe, it, expect } from "vitest";
import { can, ROLE_PERMISSIONS } from "./permissions";
import type { UserRole, PermissionAction, PermissionResource } from "./permissions";

describe("ROLE_PERMISSIONS", () => {
  it("admin has 42 entries", () => {
    expect(ROLE_PERMISSIONS.admin.size).toBe(42);
  });

  it("manager has 36 entries", () => {
    expect(ROLE_PERMISSIONS.manager.size).toBe(36);
  });

  it("user has 14 entries", () => {
    expect(ROLE_PERMISSIONS.user.size).toBe(14);
  });

  it("intern has 1 entry", () => {
    expect(ROLE_PERMISSIONS.intern.size).toBe(1);
  });
});

describe("can() — verified backend quirks (no-inheritance counterexamples)", () => {
  it("admin CANNOT write bank (counterexample #1)", () => {
    expect(can("admin", "write", "bank")).toBe(false);
  });

  it("manager CAN write bank", () => {
    expect(can("manager", "write", "bank")).toBe(true);
  });

  it("user CAN write notice (counterexample #2)", () => {
    expect(can("user", "write", "notice")).toBe(true);
  });

  it("admin CANNOT write notice", () => {
    expect(can("admin", "write", "notice")).toBe(false);
  });

  it("manager CAN write notification (counterexample #3)", () => {
    expect(can("manager", "write", "notification")).toBe(true);
  });

  it("admin CANNOT write notification", () => {
    expect(can("admin", "write", "notification")).toBe(false);
  });
});

describe("can() — intern minimality", () => {
  it("intern CAN read event", () => {
    expect(can("intern", "read", "event")).toBe(true);
  });

  it("intern CANNOT read user", () => {
    expect(can("intern", "read", "user")).toBe(false);
  });

  it("intern CANNOT write attendance", () => {
    expect(can("intern", "write", "attendance")).toBe(false);
  });
});

describe("can() — positive controls", () => {
  it("admin CAN read payroll", () => {
    expect(can("admin", "read", "payroll")).toBe(true);
  });

  it("manager CANNOT read payroll", () => {
    expect(can("manager", "read", "payroll")).toBe(false);
  });

  it("admin CAN read account", () => {
    expect(can("admin", "read", "account")).toBe(true);
  });

  it("admin CAN delete account", () => {
    expect(can("admin", "delete", "account")).toBe(true);
  });
});

describe("can() — exhaustive smoke (never throws)", () => {
  const roles: UserRole[] = ["admin", "manager", "user", "intern"];
  const actions: PermissionAction[] = ["read", "write", "update", "delete"];
  const resources: PermissionResource[] = [
    "account", "user", "bank", "attendance", "attendance-correction",
    "holiday", "notification", "mail", "notice", "leave", "leaveType",
    "preReimbursement", "postReimbursement", "event", "payroll",
  ];

  for (const role of roles) {
    for (const action of actions) {
      for (const resource of resources) {
        it(`${role} ${action} ${resource} returns boolean`, () => {
          expect(typeof can(role, action, resource)).toBe("boolean");
        });
      }
    }
  }
});
