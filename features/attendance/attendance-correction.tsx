"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import z from "zod"
import { attendanceSchema } from "./attendance-table"
import { useSearchParams } from "next/navigation"

const correctionStatus = ["pending", "reject", "approve"]

const user = z.object({
  _id: z.string(),
  role: z.enum(["user", "manager", "admin"]),
  name: z.string(),
})

export const attendanceCorrectionSchema = z.object({
  _id: z.string("Attendance Id Is Required."),
  user: user,
  manager: user,
  attendance: z.string(),
  previous: attendanceSchema.partial(),
  changes: attendanceSchema.partial(),
  status: z.enum(correctionStatus),
  message: z.string(),
  reason: z.string(),
})

export type AttendanceCorrectionType = z.infer<typeof attendanceCorrectionSchema>

type Props = {}
const AttendanceCorrection = () => {
  const attendanceId = useSearchParams().get("attendanceId")
  return (
    <Card>
      <CardHeader>
        <CardTitle>Correction</CardTitle>
      </CardHeader>
      <CardContent>
        {attendanceId}
      </CardContent>
    </Card>
  )
}

export default AttendanceCorrection
