import { apiFetch, type ApiResponse } from "@/lib/api-wrapper";
import { normalizeList } from "@/lib/normalize-list";
import { z } from "zod";
import type { RegisterFormData } from "@/features/register/register-schema";
import { bankDetailSchema } from "@/features/register/register-schema";
import type { AccountT } from "@/hooks/use-profile";
import type { UserRole } from "@/lib/permissions";

// ========================
// ACCOUNT UPDATE SCHEMA
// ========================

// Mirrors backend admin/account/schema.ts: accountUpdateSchema =
// accountBaseSchema.partial().strict() — account fields ONLY. Sending `user`
// or `bank` keys 400s (strict rejects unknown keys) — T-06-02-03. Dates stay
// strings here (register-wizard semantics); backend z.coerce.date accepts them.
export const accountUpdateSchema = z
  .object({
    gender: z.enum(["male", "female", "other"]),
    dateOfBirth: z.string(),
    dateOfJoining: z.string(),
    phoneNumber: z
      .string()
      .trim()
      .regex(/^(?:\+91[\s-]?|91[\s-]?)?[6-9]\d{9}$/, {
        message: "Invalid Indian Mobile Number",
      })
      .transform((val) => val.replace(/^\+91[\s-]?|^91[\s-]?/, "")),
    secondaryPhoneNumber: z
      .string()
      .trim()
      .regex(/^(?:\+91[\s-]?|91[\s-]?)?[6-9]\d{9}$/, {
        message: "Invalid Indian Mobile Number",
      })
      .transform((val) => val.replace(/^\+91[\s-]?|^91[\s-]?/, ""))
      .optional(),
    employeeId: z.string("Employee Id Is Required."),
    department: z.string("Department Is Required."),
    designation: z.string("Designation Is Required."),
    employeeType: z.enum(
      ["free", "intern", "full-time", "part-time", "volunteer"],
      "Employee Type Is Required.",
    ),
    employeeShift: z.enum(["shift-1", "shift-2"]).optional(),
    salaryStructure: z.string("Salary Structure Is Required."),
    address: z.string("Address Is Required."),
    aadhar: z.string("Aadhar Card Is Required."),
    pan: z.string("Pan Card Is Required."),
    resume: z.string("Resume Is Required."),
  })
  .partial()
  .strict()
  .refine(
    (data) => {
      if (data.employeeType === "part-time" && !data.employeeShift) {
        return false;
      }
      return true;
    },
    {
      message: "Employee Shift Is Required For Part Time Employee.",
      path: ["employeeShift"],
    },
  );

export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>;

// Bank input type — reuse the register wizard's bankDetailSchema (do not redefine).
export type BankInput = z.infer<typeof bankDetailSchema>;

// ========================
// RESPONSE SCHEMAS
// ========================

// Mirrors backend admin/_services/user.ts:userSchemaFinal (list endpoint shape).
// All list rows are User docs populated with image (src/alt); full KYC is NOT
// present here — the backend list carries no account/bank fields (accept T-06-01-03).
const imageObjectSchema = z
  .object({
    id: z.string(),
    alt: z.string(),
    src: z.string(),
  })
  .nullable();

export const adminUserResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string().optional(),
  image: imageObjectSchema.nullish(),
  role: z.enum(["user", "manager", "admin", "intern"]),
  email: z.string(),
  emailVerified: z.boolean().default(false),
  pushNotificationsEnabled: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isBanned: z.boolean().default(false),
  deletedAt: z.coerce.date().optional(),
  bannedAt: z.coerce.date().optional(),
});

export type AdminUserResponse = z.infer<typeof adminUserResponseSchema>;

// ========================
// API FUNCTIONS
// ========================

// POST /api/admin/account — atomic onboarding (server-side MongoDB txn over
// user + bank + account). Sends ONLY the {user, account, bank} triplet — the
// backend accountRegisterSchema is strict (T-06-01-01). apiFetch throws on
// failure, so the return is always success-shaped; callers toast res.message.
export const registerAccount = async (
  data: RegisterFormData,
): Promise<ApiResponse<{ id: string }>> => {
  return apiFetch<{ id: string }>("/api/admin/account", {
    method: "POST",
    body: JSON.stringify({
      user: data.user,
      account: data.account,
      bank: data.bank,
    }),
  });
};

// GET /api/admin/users?fields=isActive — full UNPAGINATED array (7-day Redis
// cache server-side). normalizeList wraps it into a {items, page, ...} shape;
// search/pagination/sorting stay client-side in the directory table.
export const getAdminUsers = async (): Promise<
  ReturnType<typeof normalizeList<AdminUserResponse>>
> => {
  const res = await apiFetch<AdminUserResponse[]>(
    `/api/admin/users?fields=isActive`,
    { method: "GET" },
  );
  return normalizeList<AdminUserResponse>(res);
};

// ========================
// ACCOUNT & BANK ENDPOINTS
// ========================

// GET /api/admin/user/:id — populated {user, account, bank} detail (ADMN-03).
// Returns AccountT (the shape the existing detail view already relies on).
export const getAdminUserDetail = async (id: string): Promise<AccountT> => {
  const res = await apiFetch<AccountT>(`/api/admin/user/${id}`, {
    method: "GET",
  });
  return res.data;
};

// PUT /api/admin/account/:id — account fields ONLY. Backend schema is
// accountBaseSchema.partial().strict(); sending user/bank keys 400s (T-06-02-03).
export const updateAccount = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<AccountUpdateInput>;
}) => {
  await apiFetch(`/api/admin/account/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// POST /api/admin/bank — manager-only write (bank:write). Body reuses bankDetailSchema.
export const createBank = async (data: BankInput) => {
  await apiFetch(`/api/admin/bank`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// PUT /api/admin/bank/:id — manager-only update (bank:update), strict partial.
export const updateBank = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<BankInput>;
}) => {
  await apiFetch(`/api/admin/bank/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// PATCH /api/admin/bank/restore/:id — manager-only restore (bank:update).
export const restoreBank = async (id: string) => {
  await apiFetch(`/api/admin/bank/restore/${id}`, { method: "PATCH" });
};

// PUT /api/admin/user/:id — update a user's role. Backend userUpdateSchema is
// userSchema.partial() so `role` alone is accepted (update:user permission).
export const updateUserRole = async (id: string, role: UserRole) =>
  apiFetch(`/api/admin/user/${id}`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
