import { toast } from "sonner";
import { AttendanceResponse } from "./attendance.api";
import { apiFetch } from "@/lib/api-wrapper"

export const getAttendanceById = async (id: string) => {
  const res = await  apiFetch<AttendanceResponse>(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/attendance/attendance/${id}`,
    {
      method: "GET",
    }
  );
  if(!res.success) toast.error(res.message)
  return res.data
}
