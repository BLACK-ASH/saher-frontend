import { toast } from "sonner";
import { apiFetch } from "@/lib/api-wrapper"
import z from "zod";
import { dateField, userField } from "@/lib/common-zod-schema";
import { AttendanceCorrectionType } from "@/features/attendance/attendance-correction";

const record = z.object({
  inTime: dateField,
  outTime: dateField,
  status: z.enum(["absent", "half-day", "present"]),
  isLate: z.boolean()
})

const attendanceCorrectionSchema = z.object({
  _id: z.string(),
  user: userField,
  manager: userField,
  attendance: z.string(),
  previous: record,
  changes: record.partial(),
  message: z.string(),
  reason: z.string(),
  status: z.enum(["reject", "pending", "approve"])
})

export type AttendanceCorrectionResponse = z.infer<typeof attendanceCorrectionSchema>
type SubmitCorrectionPayload = AttendanceCorrectionType & { date: string }

export const getAttendanceCorrection = async () => {
  const res = await apiFetch<AttendanceCorrectionResponse[]>(process.env.NEXT_PUBLIC_SERVER_URL + "/api/attendance/attendance-correction", {
    method: "GET",
  })
  return res.data
}

export const submitAttendanceCorrection = async (payload: SubmitCorrectionPayload) => {
  const res = await apiFetch<AttendanceCorrectionResponse>(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/attendance/attendance-correction`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  if (!res.success) toast.error(res.message)

  return res.data
}

