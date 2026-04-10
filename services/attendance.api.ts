// services/attendance.api.ts

import { apiFetch } from "@/lib/api-wrapper"
import { toast } from "sonner"


export type AttendanceResponse = {
  "_id": string,
  "user": string,
  "inTime": null | Date,
  "outTime": null | Date,
  "workHours": number,
  "date": string | Date,
  "status": "present" | "absent" | "half-day",
  "isLate": boolean,
}



export const getAttendanceStatus = async () => {
  const res = await apiFetch<AttendanceResponse>(process.env.NEXT_PUBLIC_SERVER_URL + "/api/attendance/me", {
    method: "GET",
  })
  if(!res.success) toast.error(res.message)
  return res.data
}

export const checkInApi = async () => {
  const res = await apiFetch<AttendanceResponse>(process.env.NEXT_PUBLIC_SERVER_URL + "/api/attendance/check-in", {
    method: "POST",
  })
  if(!res.success) toast.error(res.message)
  return res.data
}

export const checkOutApi = async () => {
  const res = await apiFetch<AttendanceResponse>(process.env.NEXT_PUBLIC_SERVER_URL + "/api/attendance/check-out", {
    method: "POST",
  })
  if(!res.success) toast.error(res.message)
  return res.data
}
