import { apiFetch } from "@/lib/api-wrapper";
import { normalizeList } from "@/lib/normalize-list";
import { z } from "zod";

// ========================
// RESPONSE SCHEMAS
// ========================

// Mirrors backend payroll/schema.ts:payrollResponseSchema exactly.
// Backend wraps records in an ARRAY even for GET /payroll/:id (Quirk 6) —
// that endpoint is intentionally not exposed; list/byUser get the array via
// normalizeList. Status/mode enums are backend-exact ("partially-paid" hyphen).
export const payrollSchema = z.object({
  id: z.string(),
  user: z.string(),
  dateOfCreation: z.coerce.date(),
  dateOfPayment: z.coerce.date().optional(),
  mode: z.enum(["cash", "cheque", "upi", "-"]),
  baseSalary: z.number(),
  expectedSalary: z.number(),
  paidSalary: z.number().optional(),
  bonus: z.number(),
  deduction: z.array(z.string()),
  status: z.enum(["paid", "unpaid", "partially-paid", "approved"]),
});

export type PayrollMode = z.infer<typeof payrollSchema>["mode"];
export type PayrollStatus = z.infer<typeof payrollSchema>["status"];
export type PayrollResponse = z.infer<typeof payrollSchema>;

// ========================
// REQUEST SCHEMAS
// ========================

// Mirrors backend createPayrollSchema — ONLY {mode, paidSalary} survives; any
// extra key is stripped by the backend zod. paidSalary is the INCREMENTAL
// installment amount, never a cumulative total (Quirk 8).
export const payrollUpdateInputSchema = z.object({
  mode: z.enum(["cash", "cheque", "upi", "-"]),
  paidSalary: z.number().positive("Amount must be greater than zero"),
});

export type PayrollUpdateInput = z.infer<typeof payrollUpdateInputSchema>;

// ========================
// API FUNCTIONS
// ========================

// GET /payroll?page=&limit=&year=&month= — server-pageable list. Omitted
// year/month produce no params for them (backend falls back to current).
export const getPayrollList = async (
  filters: { year?: number; month?: number } = {},
  page = 1,
  limit = 10,
): Promise<ReturnType<typeof normalizeList<PayrollResponse>>> => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters.year !== undefined) params.set("year", String(filters.year));
  if (filters.month !== undefined) params.set("month", String(filters.month));

  const res = await apiFetch<PayrollResponse[]>(`/api/payroll?${params.toString()}`, {
    method: "GET",
  });
  return normalizeList<PayrollResponse>(res);
};

// GET /payroll/user/:id?page=&limit= — per-employee history.
export const getPayrollByUser = async (
  id: string,
  page = 1,
  limit = 10,
): Promise<ReturnType<typeof normalizeList<PayrollResponse>>> => {
  const res = await apiFetch<PayrollResponse[]>(
    `/api/payroll/user/${id}?page=${page}&limit=${limit}`,
    { method: "GET" },
  );
  return normalizeList<PayrollResponse>(res);
};

// PUT /payroll/:id — sends ONLY mode+paidSalary (Quirk 8): the NEW installment
// amount. The backend accumulates it onto prior paidSalary server-side.
export const updatePayroll = async (id: string, data: PayrollUpdateInput) => {
  await apiFetch(`/api/payroll/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// POST /payroll/cron — synchronous (Quirk 7), NO body required.
export const runPayrollCron = async (): Promise<void> => {
  await apiFetch("/api/payroll/cron", {
    method: "POST",
  });
};

// Deliberately NOT exposed: GET /payroll/:id (returns Payroll[] even for a
// single record — Quirk 6; no requirement consumes it) and POST /approve/:id
// (no frontend requirement). If a later plan needs them, add with the array
// quirk handled at the call site.