// services/attendance.api.ts

import { apiFetch } from "@/lib/api-wrapper"
import { dateField, userField } from "@/lib/common-zod-schema"
import { toast } from "sonner"
import z from "zod"


export const attendanceSchema = z.object({
  _id: z.string("Attendance Id Is Required."),
  user: userField,
  inTime: dateField,
  outTime: dateField,
  workHours: z.number(),
  date: z.string(),
  isLate: z.boolean(),
  status: z.enum(["present", "half-day", "absent"]),
})

export type AttendanceResponse = z.infer<typeof attendanceSchema>

export const getAttendanceStatus = async () => {
  const res = await apiFetch<AttendanceResponse>(process.env.NEXT_PUBLIC_SERVER_URL + "/api/attendance/me", {
    method: "GET",
  })
  return res.data
}

export const getAttendance = async (filter: "week" | "month") => {
  const res = await apiFetch<{ attendances: AttendanceResponse[], count: number }>(process.env.NEXT_PUBLIC_SERVER_URL + "/api/attendance/retrive?type=" + filter, {
    method: "GET",
  })
  if (!res.success) toast.error(res.message)
  return res.data
}

export const checkInApi = async () => {
  const res = await apiFetch<AttendanceResponse>(process.env.NEXT_PUBLIC_SERVER_URL + "/api/attendance/check-in", {
    method: "POST",
  })
  if (!res.success) toast.error(res.message)
  return res.data
}

export const checkOutApi = async () => {
  const res = await apiFetch<AttendanceResponse>(process.env.NEXT_PUBLIC_SERVER_URL + "/api/attendance/check-out", {
    method: "POST",
  })
  if (!res.success) toast.error(res.message)
  return res.data
}
