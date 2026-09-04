import { apiFetch } from "@/lib/api-wrapper";
import { normalizeList } from "@/lib/normalize-list";
import { z } from "zod";

// ========================
// RESPONSE SCHEMAS
// ========================

// Mirrors backend get-bill.schema.ts getBillResponseSchema exactly (D-20).
export const billSchema = z.object({
  id: z.string(),
  user: z.string(),
  images: z.array(z.object({ id: z.string(), src: z.string(), alt: z.string() })).default([]),
  amount: z.number(),
  advance: z.number(),
  date: z.string(),
  description: z.string(),
  status: z.enum(["pending", "accept", "reject", "on-hold"]),
  reason: z.string().optional(),
  isDeleted: z.boolean(),
});

export type BillResponse = z.infer<typeof billSchema>;

// Mirrors getSettleBillResponseSchema.
// ⚠ Quirk 1 naming trap: GET /reimbursement/bills returns THESE records, not
// bills — that endpoint is intentionally unused by this module.
export const settlementSchema = z.object({
  id: z.string(),
  bill: z.string(),
  user: z.string(),
  amount: z.number(),
  mode: z.enum(["cash", "upi", "cheque", "-"]),
  date: z.string(),
  manager: z.string(),
  status: z.enum(["pending", "settle", "expired", "on-hold"]),
  expiredAt: z.string(),
  settleDate: z.string().optional(),
});

export type SettlementResponse = z.infer<typeof settlementSchema>;

// Quirk 5: Total arrives PRE-FORMATTED ("1200 Amount to Received") — display
// verbatim; math lives only on PocketUse/AdvanceUse/SettledUse.
export const balanceEnquirySchema = z.object({
  PocketUse: z.number(),
  AdvanceUse: z.number(),
  SettledUse: z.number(),
  Total: z.string(),
  Empty: z.literal(true).optional(),
});

export type BalanceEnquiryResponse = z.infer<typeof balanceEnquirySchema>;

// Mirrors createLogResponseShape from get-audit-log.controller.ts.
export const auditLogEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  description: z.string(),
  amount: z.number(),
  from: z.string(),
  to: z.string(),
});

export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;

// ========================
// REQUEST SCHEMAS
// ========================

const descriptionField = z
  .string()
  .trim()
  .min(5, "Description must contain at least 5 characters")
  .max(50, "Description must be at most 50 characters");

// Mirrors bill/schema.ts userBillCreateSchema, plus D-06's UI cap of 10
// receipts and a positive-amount floor the backend leaves to us.
export const userBillCreateSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
  description: descriptionField,
  date: z.string(),
  images: z.array(z.string()).min(1).max(10, "Up to 10 receipts allowed"),
});

export type UserBillCreateInput = z.infer<typeof userBillCreateSchema>;

// D-07 date lock: backend userBillUpdateSchema has NO date key — pending-bill
// edits may touch amount/description/images only.
export const userBillUpdateSchema = z
  .object({
    amount: z.number().positive("Amount must be greater than zero"),
    description: descriptionField,
    images: z.array(z.string()).min(1).max(10, "Up to 10 receipts allowed"),
  })
  .partial();

export type UserBillUpdateInput = z.infer<typeof userBillUpdateSchema>;

// Mirrors adminBillCreatSchema (backend's own typo).
export const adminBillCreateSchema = z.object({
  advance: z.number().positive("Advance must be greater than zero"),
  date: z.string(),
  description: descriptionField,
});

export type AdminBillCreateInput = z.infer<typeof adminBillCreateSchema>;

export const adminBillUpdateSchema = z
  .object({
    advance: z.number().positive("Advance must be greater than zero"),
    description: descriptionField,
  })
  .partial();

export type AdminBillUpdateInput = z.infer<typeof adminBillUpdateSchema>;

// Quirk 4: the API field is `reason` — the UI labels it "Notes".
export const handleBillInputSchema = z.object({
  status: z.enum(["accept", "reject", "on-hold"]),
  reason: z.string().trim().min(5, "Notes must contain at least 5 characters"),
});

export type HandleBillInput = z.infer<typeof handleBillInputSchema>;

// Recording a settlement completes the lifecycle (D-20): status locked to the
// literal "settle"; mode "-" renders as "Other" in the UI.
export const settleInputSchema = z.object({
  mode: z.enum(["cash", "upi", "cheque", "-"]),
  status: z.literal("settle"),
  description: z.string().optional(),
});

export type SettleInput = z.infer<typeof settleInputSchema>;

// BullMQ job descriptor or processing message — Pitfall 7: the download itself
// arrives later via the notification action pattern.
export type ExportReportResult =
  | { jobId?: string; format?: string; count?: number }
  | string
  | null;

export type SearchBillsFilters = {
  description?: string;
  amount?: number;
  date?: string;
  user?: string;
  status?: string;
};

// ========================
// USER BILL CRUD
// ========================

// POST /bill — responds { data: null }; invalidate the cache instead of using
// any return value.
export const createBill = async (data: UserBillCreateInput) => {
  await apiFetch("/api/reimbursement/bill", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// PATCH /:billId — staff edit of a pending/on-hold bill (date locked, D-07).
export const updateBill = async (billId: string, data: UserBillUpdateInput) => {
  await apiFetch(`/api/reimbursement/${billId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// DELETE /:billId — soft delete; this IS the staff withdraw action.
export const deleteBill = async (billId: string) => {
  await apiFetch(`/api/reimbursement/${billId}`, { method: "DELETE" });
};

// PATCH /:billId/restore — clears the soft-delete flag (D-30 contract).
export const restoreBill = async (billId: string) => {
  await apiFetch(`/api/reimbursement/${billId}/restore`, { method: "PATCH" });
};

// ========================
// ADMIN ADVANCE BILLS
// ========================

export const createAdvanceBill = async (
  userId: string,
  data: AdminBillCreateInput,
) => {
  await apiFetch(`/api/reimbursement/admin/${userId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateAdvanceBill = async (
  billId: string,
  data: AdminBillUpdateInput,
) => {
  await apiFetch(`/api/reimbursement/admin/${billId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const deleteAdvanceBill = async (billId: string) => {
  await apiFetch(`/api/reimbursement/admin/${billId}`, { method: "DELETE" });
};

// ========================
// HANDLE & SETTLE
// ========================

// POST /handle/:billId — ⚠ Pitfall 2: an accept auto-creates a Settlement but
// responds { data: null } with no id. The settlement id must be fetched back
// via getSettlementByBill(billId) before "Record Settlement" can fire.
export const handleBill = async (billId: string, data: HandleBillInput) => {
  await apiFetch(`/api/reimbursement/handle/${billId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const settleBill = async (settleId: string, data: SettleInput) => {
  await apiFetch(`/api/reimbursement/settlement/${settleId}`, {
    method: "POST",
    // Backend validates description as a required string even when blank.
    body: JSON.stringify({ ...data, description: data.description ?? "" }),
  });
};

// ========================
// READS
// ========================

// GET /mybills?isDeleted= — returns the RAW array; backend sends no meta, so
// list normalization must NOT be applied here.
export const getMyBills = async (isDeleted = false): Promise<BillResponse[]> => {
  const res = await apiFetch<BillResponse[]>(
    `/api/reimbursement/mybills?isDeleted=${isDeleted}`,
    { method: "GET" },
  );
  return res.data;
};

// GET /recyclebills — raw array, same no-meta shape as mybills.
export const getRecycleBills = async (): Promise<BillResponse[]> => {
  const res = await apiFetch<BillResponse[]>("/api/reimbursement/recyclebills", {
    method: "GET",
  });
  return res.data;
};

// GET / — paginated search. ALWAYS emits isDeleted=false: the controller 400s
// unless ≥1 search param is present and isDeleted does NOT count toward that
// rule (verified against search-bill.controller.ts). When every filter is
// cleared we append a benign `description=` so the querystring never trips the
// empty-query guard (Quirk 10).
export const searchBills = async (
  filters: SearchBillsFilters = {},
  page = 1,
  limit = 10,
): Promise<ReturnType<typeof normalizeList<BillResponse>>> => {
  const params = new URLSearchParams({ isDeleted: "false" });

  if (filters.description !== undefined)
    params.set("description", filters.description);
  if (filters.amount !== undefined) params.set("amount", String(filters.amount));
  if (filters.date !== undefined) params.set("date", filters.date);
  if (filters.user !== undefined) params.set("user", filters.user);
  if (filters.status !== undefined) params.set("status", filters.status);

  if (
    filters.description === undefined &&
    filters.amount === undefined &&
    filters.date === undefined &&
    filters.user === undefined &&
    filters.status === undefined
  ) {
    params.set("description", "");
  }

  params.set("page", String(page));
  params.set("limit", String(limit));

  const res = await apiFetch<BillResponse[]>(`/api/reimbursement/?${params.toString()}`, {
    method: "GET",
  });
  return normalizeList<BillResponse>(res);
};

export const getBalanceEnquiry = async (): Promise<BalanceEnquiryResponse> => {
  const res = await apiFetch<BalanceEnquiryResponse>(
    "/api/reimbursement/balance-enquiry",
    { method: "GET" },
  );
  return balanceEnquirySchema.parse(res.data);
};

export const getAuditLog = async (page = 1, limit = 10) => {
  const res = await apiFetch<AuditLogEntry[]>(
    `/api/reimbursement/audit-log?page=${page}&limit=${limit}`,
    { method: "GET" },
  );
  return normalizeList<AuditLogEntry>(res);
};

// GET /export/report?format= — returns res.data untouched (job descriptor or
// processing message); delivery happens via notifications (Pitfall 7).
export const exportReport = async (
  format: "pdf" | "xlsx",
): Promise<ExportReportResult> => {
  const res = await apiFetch<ExportReportResult>(
    `/api/reimbursement/export/report?format=${format}`,
    { method: "GET" },
  );
  return res.data;
};

// GET /:billId — ⚠ Quirk 1 naming trap: despite living on the bill router this
// endpoint queries the SETTLEMENT collection by bill id. It exists here solely
// so the post-accept flow can recover the auto-created settlement id.
export const getSettlementByBill = async (
  billId: string,
): Promise<SettlementResponse> => {
  const res = await apiFetch<SettlementResponse>(`/api/reimbursement/${billId}`, {
    method: "GET",
  });
  return res.data;
};
