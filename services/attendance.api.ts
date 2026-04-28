import { apiFetch } from "@/lib/api-wrapper";
import { userField } from "@/lib/common-zod-schema";
import { toast } from "sonner";
import z from "zod";

export const attendanceSchema = z.object({
  id: z.string("Attendance Id Is Required."),
  user: userField,
  inTime: z.coerce.date().nullable(),
  outTime: z.coerce.date().nullable(),
  workHours: z.number(),
  date: z.string(),
  isLate: z.boolean(),
  status: z.enum(["present", "half-day", "absent"]),
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
  limit = 10,
}: DefaultProps) => {
  const res = await apiFetch<AttendanceResponse[]>(
    `/api/attendance/user/me?sort=${sort}&page=${page}&limit=${limit}`,
    {
      method: "GET",
    },
  );
  return res.data;
};

export const checkInApi = async () => {
  const res = await apiFetch<AttendanceResponse>("/api/attendance/check-in", {
    method: "POST",
  });
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
