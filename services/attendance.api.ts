import { apiFetch } from "@/lib/api-wrapper";
import { userField } from "@/lib/common-zod-schema";
import { toast } from "sonner";
import z from "zod";

export const attendanceSchema = z.object({
  id: z.string(),
  user: userField,
  inTime: z.string().nullable(),
  outTime: z.string().nullable(),
  workHours: z.number(),
  date: z.string(),
  status: z.enum(["present", "half-day", "absent", "week-off", "on-leave"]),
  overtime: z.boolean().optional(),
  isLate: z.boolean(),
});

type DefaultProps = {
  sort?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export type AttendanceResponse = z.infer<typeof attendanceSchema>;

export const getAttendanceStatus = async () => {
  const res = await apiFetch<AttendanceResponse>("/api/attendance/me", {
    method: "GET",
  });
  return res.data;
};

export const getAttendanceById = async (id: string) => {
  const res = await apiFetch<AttendanceResponse>(
    `/api/attendance/record/${id}`,
    {
      method: "GET",
    },
  );
  return res.data;
};

export const getAttendance = async ({
  sort = "desc",
  page = 1,
  limit = 7,
}: DefaultProps) => {
  const res = await apiFetch<AttendanceResponse[]>(
    `/api/attendance/user/me?sort=${sort}&page=${page}&limit=${limit}`,
    {
      method: "GET",
    },
  );
  return { data: res.data, meta: res.meta };
};

export const getTodayAttendance = async ({
  sort = "desc",
  page = 1,
  limit = 15,
}: DefaultProps) => {
  const res = await apiFetch<AttendanceResponse[]>(
    `/api/attendance/today?sort=${sort}&page=${page}&limit=${limit}`,
    {
      method: "GET",
    },
  );
  return { data: res.data, meta: res.meta };
};

export const getRangeAttendance = async ({
  sort = "desc",
  page = 1,
  limit = 15,
  startDate,
  endDate,
}: DefaultProps & { startDate: string; endDate: string }) => {
  const res = await apiFetch<AttendanceResponse[]>(
    `/api/attendance/retrieve?startDate=${startDate}&endDate=${endDate}&$sort=${sort}&page=${page}&limit=${limit}`,
    {
      method: "GET",
    },
  );
  return { data: res.data, meta: res.meta };
};

export const checkInApi = async () => {
  const res = await apiFetch<AttendanceResponse>("/api/attendance/check-in", {
    method: "POST",
  });
  if (!res.success) toast.error(res.message);
  return res.data;
};

export const weekoff = async () => {
  const res = await apiFetch<AttendanceResponse>("/api/attendance/weekoff", {
    method: "POST",
  });
  if (!res.success) toast.error(res.message);
  return res.data;
};

export const overtimeCheckInApi = async () => {
  const res = await apiFetch<AttendanceResponse>(
    "/api/attendance/overtime/check-in",
    {
      method: "POST",
    },
  );
  if (!res.success) toast.error(res.message);
  return res.data;
};

export const checkOutApi = async () => {
  const res = await apiFetch<AttendanceResponse>("/api/attendance/check-out", {
    method: "POST",
  });
  if (!res.success) toast.error(res.message);
  return res.data;
};
