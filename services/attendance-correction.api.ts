import { toast } from "sonner";
import { apiFetch } from "@/lib/api-wrapper";
import z from "zod";
import { dateField, userField } from "@/lib/common-zod-schema";
import { AttendanceCorrectionType } from "@/features/attendance/attendance-correction";
import { AttendanceCorrectionViewType } from "@/features/attendance-correction/attendance-correction-view";

const record = z.object({
  inTime: dateField,
  outTime: dateField,
  status: z.enum(["absent", "half-day", "present"]),
  isLate: z.boolean(),
});

const attendanceCorrectionSchema = z.object({
  _id: z.string(),
  user: userField,
  manager: userField,
  attendance: z.object({ _id: z.string(), date: z.string() }),
  previous: record,
  changes: record.partial(),
  message: z.string(),
  reason: z.string(),
  proof: z.object({ src: z.string(), alt: z.string() }).optional(),
  status: z.enum(["reject", "pending", "approve"]),
});

export type AttendanceCorrectionResponse = z.infer<
  typeof attendanceCorrectionSchema
>;
type SubmitCorrectionPayload = AttendanceCorrectionType & { date: string };

export const getAttendanceCorrection = async () => {
  const res = await apiFetch<AttendanceCorrectionResponse[]>(
    "/api/attendance/attendance-correction",
    {
      method: "GET",
    },
  );
  return res.data;
};

export const getAttendanceCorrectionById = async (correctionId: string) => {
  if (correctionId.trim().length === 0) return null;
  const res = await apiFetch<AttendanceCorrectionResponse>(
    "/api/attendance/attendance-correction/" + correctionId,
    {
      method: "GET",
    },
  );
  return res.data;
};

export const getAttendanceCorrectionAll = async () => {
  const res = await apiFetch<AttendanceCorrectionResponse[]>(
    "/api/attendance/attendance-correction-all",
    {
      method: "GET",
    },
  );
  return res.data;
};

export const submitAttendanceCorrection = async (
  payload: SubmitCorrectionPayload,
) => {
  const res = await apiFetch<AttendanceCorrectionResponse>(
    `/api/attendance/attendance-correction`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  if (!res.success) toast.error(res.message);

  return res;
};

export const handleAttendanceCorrection = async (
  payload: AttendanceCorrectionViewType & { id: string },
) => {
  const res = await apiFetch<AttendanceCorrectionResponse>(
    `/api/attendance/attendance-correction/${payload.id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
  if (!res.success) toast.error(res.message);

  return res;
};
