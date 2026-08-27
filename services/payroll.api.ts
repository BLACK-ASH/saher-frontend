import { apiFetch } from "@/lib/api-wrapper";
import { normalizeList } from "@/lib/normalize-list";
import { z } from "zod";

// ========================
// RESPONSE SCHEMAS
// ========================

// Mirrors backend payroll/schema.ts:PayrollResponseSchema
export const payrollSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  month: z.number(),
  year: z.number(),
  expectedSalary: z.number(),
  paidSalary: z.number(),
  status: z.enum(["pending", "processed", "partially_paid", "paid"]),
  updatedAt: z.string(),
});

export type PayrollResponse = z.infer<typeof payrollSchema>;

// Mirrors backend payroll/schema.ts:PayrollHistoryResponseSchema
export const payrollHistorySchema = z.object({
  id: z.string(),
  payrollId: z.string(),
  amount: z.number(),
  mode: z.enum(["cash", "upi", "cheque", "-"]),
  description: z.string().optional(),
  date: z.string(),
});

export type PayrollHistoryResponse = z.infer<typeof payrollHistorySchema>;

// ========================
// REQUEST SCHEMAS
// ========================

export const payInstallmentSchema = z.object({
  mode: z.enum(["cash", "upi", "cheque", "-"]),
  paidSalary: z.number().positive("Amount must be greater than zero"),
});

export type PayInstallmentInput = z.infer<typeof payInstallmentSchema>;

// ========================
// API FUNCTIONS
// ========================

// GET /payroll?year=&month=
export const searchPayroll = async (
  year: number,
  month: number,
  page = 1,
  limit = 10,
): Promise<ReturnType<typeof normalizeList<PayrollResponse>>> => {
  const res = await apiFetch<PayrollResponse[]>(
    `/api/payroll?year=${year}&month=${month}&page=${page}&limit=${limit}`,
    { method: "GET" },
  );
  return normalizeList<PayrollResponse>(res);
};

// GET /payroll/:id/history
export const getPayrollHistory = async (id: string): Promise<PayrollHistoryResponse[]> => {
  const res = await apiFetch<PayrollHistoryResponse[]>(`/api/payroll/${id}/history`, {
    method: "GET",
  });
  return res.data;
};

// POST /payroll/:id/pay — Quirk 8: incremental update
export const payInstallment = async (id: string, data: PayInstallmentInput) => {
  await apiFetch(`/api/payroll/${id}/pay`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// POST /payroll/cron — Quirk 7: empty body, sync
export const runCron = async () => {
  await apiFetch("/api/payroll/cron", {
    method: "POST",
    body: JSON.stringify({}),
  });
};
