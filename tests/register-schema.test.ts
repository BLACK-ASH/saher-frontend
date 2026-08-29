import { describe, expect, it } from "vitest";
import { registerFormSchema } from "@/features/register/register-schema";

const objectId = "614c1f8b9f1b2c3d4e5f6a7b";

const basePayload = {
  user: {
    name: "Test User",
    displayName: "Test",
    image: objectId,
    role: "user",
    email: "test@saher.io",
  },
  bank: {
    accountHolderName: "Test User",
    bankName: "HDFC",
    accountNumber: "1234567890",
    ifcs: "HDFC0001234",
    branch: "MG Road",
    mobileNumber: "9876543210",
  },
  account: {
    gender: "male",
    dateOfBirth: "2000-01-01",
    dateOfJoining: "2026-01-01",
    phoneNumber: "9876543210",
    employeeId: "EMP001",
    department: "Engineering",
    designation: "Engineer",
    salaryStructure: "Monthly",
    address: "123 Main St",
    aadhar: objectId,
    pan: objectId,
    resume: objectId,
  },
};

describe("registerFormSchema employeeType enum (five-value backend list)", () => {
  it("accepts employeeType 'free'", () => {
    const result = registerFormSchema.safeParse({
      ...basePayload,
      account: { ...basePayload.account, employeeType: "free" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts employeeType 'intern'", () => {
    const result = registerFormSchema.safeParse({
      ...basePayload,
      account: { ...basePayload.account, employeeType: "intern" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects employeeType 'part-time' without employeeShift (refine survives)", () => {
    const result = registerFormSchema.safeParse({
      ...basePayload,
      account: {
        ...basePayload.account,
        employeeType: "part-time",
        employeeShift: undefined,
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some((i) => i.path.join(".") === "account.employeeShift")).toBe(
        true,
      );
    }
  });
});
