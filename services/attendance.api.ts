// services/attendance.api.ts

import { apiFetch } from "@/lib/api-wrapper"


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

  return res.data
}

export const checkInApi = async () => {
  const res = await apiFetch<AttendanceResponse>(process.env.NEXT_PUBLIC_SERVER_URL + "/api/attendance/check-in", {
    method: "POST",
  })

  return res.data
}

export const checkOutApi = async () => {
  const res = await apiFetch<AttendanceResponse>(process.env.NEXT_PUBLIC_SERVER_URL + "/api/attendance/check-out", {
    method: "POST",
  })

  return res.data
}
