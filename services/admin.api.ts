import { apiFetch, type ApiResponse } from "@/lib/api-wrapper";
import { normalizeList } from "@/lib/normalize-list";
import { z } from "zod";
import type { RegisterFormData } from "@/features/register/register-schema";

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
