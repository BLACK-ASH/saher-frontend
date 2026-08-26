import { apiFetch } from "@/lib/api-wrapper";
import { normalizeList } from "@/lib/normalize-list";
import { DefaultUserT, userField } from "@/lib/common-zod-schema";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                              APPLY LEAVE                                   */
/* -------------------------------------------------------------------------- */

export const createLeaveTypeSchema = z
  .object({
    name: z.string().min(2),

    code: z.string().min(2),

    allocatedDays: z.number().min(0),

    maxCarryForwardDays: z.number().min(0),

    requiresProof: z.boolean(),

    minDaysNotice: z.number().min(0),

    description: z.string().optional(),

    isActive: z.boolean(),
  })
  .refine((data) => data.maxCarryForwardDays <= data.allocatedDays, {
    message: "Carry forward days cannot exceed allocated days",
    path: ["maxCarryForwardDays"],
  });

export type CreateLeaveTypeType = z.infer<typeof createLeaveTypeSchema>;

export const applyLeaveSchema = z.object({
  type: z.string().min(1, "Please select leave type"),

  startDate: z.string().min(1, "Start date is required"),

  endDate: z.string().min(1, "End date is required"),

  reason: z.string().min(3, "Reason must contain at least 3 characters"),

  proof: z.string().optional(),
});

export type ApplyLeaveType = z.infer<typeof applyLeaveSchema>;

/* -------------------------------------------------------------------------- */
/*                            REVIEW LEAVE                                    */
/* -------------------------------------------------------------------------- */

export const reviewLeaveSchema = z.object({
  status: z.enum(["approved", "rejected"]),

  managerComment: z.string().optional(),
});

export type ReviewLeaveType = z.infer<typeof reviewLeaveSchema>;

/* -------------------------------------------------------------------------- */
/*                           RESPONSE SCHEMAS                                 */
/* -------------------------------------------------------------------------- */

export const leaveTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  allocatedDays: z.number(),
  maxCarryForwardDays: z.number(),
  requiresProof: z.boolean(),
  minDaysNotice: z.number(),
  isActive: z.boolean(),
  description: z.string().optional(),
});

export type LeaveTypeResponse = z.infer<typeof leaveTypeSchema>;

export const leaveApplicationSchema = z.object({
  id: z.string(),
  user: userField,
  startDate: z.string(),
  endDate: z.string(),
  totalDays: z.number(),
  reason: z.string(),
  type: z.object({ name: z.string(), code: z.string() }),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]),
  proof: z.string().optional(),
  approvedBy: z.string().optional(),
  managerComment: z.string().optional(),
});

export type LeaveApplicationResponse = z.infer<typeof leaveApplicationSchema>;

export const leaveBalanceSchema = z.object({
  id: z.string(),
  user: z.string(),
  year: z.string(),
  balance: z.record(
    z.string(),
    z.object({ used: z.number(), remaining: z.number() }),
  ),
});

export type LeaveBalanceResponse = z.infer<typeof leaveBalanceSchema>;

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export type LeaveTypeT = {
  id: string;
  name: string;
  code: string;
  allocatedDays: number;
  maxCarryForwardDays: number;
  requiresProof: boolean;
  minDaysNotice: number;
  isActive: boolean;
  description?: string;
};

export type LeaveT = {
  id: string;
  user: DefaultUserT;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  type: {
    name: string;
    code: string;
  };
  status: LeaveStatus;
  proof?: string;
  approvedBy?: string;
  managerComment?: string;
};

export type LeaveBalanceItem = {
  used: number;
  remaining: number;
};

export type LeaveBalanceT = {
  id: string;
  user: DefaultUserT;
  year: string;
  balance: {
    casual: LeaveBalanceItem;
    paternity: LeaveBalanceItem;
    emergency: LeaveBalanceItem;
    [key: string]: LeaveBalanceItem;
  };
};
export type CreateLeaveTypePayload = Omit<
  LeaveTypeT,
  "code" | "isActive" | "id"
> & {
  code: string;
};

export type UpdateLeaveTypePayload = Partial<CreateLeaveTypePayload>;

export type CreateLeavePayload = {
  startDate: Date | string;
  endDate: Date | string;
  reason: string;
  type: string;
  proof?: string;
};

// Backend update controller reads `leaveCode` (the leave-type _id) and
// ignores `type`; only the create endpoint matches by code.
export type UpdateLeavePayload = Partial<Omit<CreateLeavePayload, "type">> & {
  leaveCode?: string;
};

export type ReviewLeavePayload = {
  status: Exclude<LeaveStatus, "cancelled" | "pending">;
  managerComment?: string;
};

/* -------------------------------------------------------------------------- */
/*                               LEAVE TYPES                                  */
/* -------------------------------------------------------------------------- */

export const getLeaveTypes = async () => {
  const res = await apiFetch<LeaveTypeT[]>("/api/leave/type", {
    method: "GET",
  });

  return res.data;
};

export const createLeaveType = async (data: CreateLeaveTypePayload) => {
  const res = await apiFetch("/api/leave/type", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return res;};

export const updateLeaveType = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateLeaveTypePayload;
}) => {
  const res = await apiFetch(`/api/leave/type/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  return res;};

/* -------------------------------------------------------------------------- */
/*                           LEAVE APPLICATIONS                               */
/* -------------------------------------------------------------------------- */

export const applyLeave = async (data: CreateLeavePayload) => {
  const res = await apiFetch<LeaveT>("/api/leave/application/apply", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return res;};

export const updateLeaveApplication = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateLeavePayload;
}) => {
  const res = await apiFetch<LeaveT>(`/api/leave/application/update/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  return res;};

export const reviewLeaveApplication = async ({
  id,
  data,
}: {
  id: string;
  data: ReviewLeavePayload;
}) => {
  const res = await apiFetch<LeaveT>(`/api/leave/application/review/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  return res.data;
};

export const getLeaveApplications = async ({
  page = 1,
  limit = 10,
}: {
  page?: number;
  limit?: number;
}) => {
  const res = await apiFetch<LeaveT[]>(
    `/api/leave/application?page=${page}&limit=${limit}`,
    {
      method: "GET",
    },
  );

  return normalizeList<LeaveT>(res);
};

export const getAllLeaveApplications = async ({
  page = 1,
  limit = 10,
}: {
  page?: number;
  limit?: number;
}) => {
  const res = await apiFetch<LeaveT[]>(
    `/api/leave/application/all?page=${page}&limit=${limit}`,
    {
      method: "GET",
    },
  );

  return normalizeList<LeaveT>(res);
};

/* -------------------------------------------------------------------------- */
/*                              LEAVE BALANCE                                 */
/* -------------------------------------------------------------------------- */

export const getLeaveBalance = async () => {
  const res = await apiFetch<LeaveBalanceT>("/api/leave/balance", {
    method: "GET",
  });

  return res.data;
};
