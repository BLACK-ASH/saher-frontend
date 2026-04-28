import { toast } from "sonner";
import { apiFetch } from "@/lib/api-wrapper";
import z from "zod";
import { dateField, userField } from "@/lib/common-zod-schema";
import { AttendanceCorrectionViewType } from "@/features/attendance-correction/attendance-correction-view";
import { AttendanceCorrectionCreateT } from "@/features/attendance/attendance-correction";

const record = z.object({
  inTime: dateField,
  outTime: dateField,
  status: z.enum(["absent", "half-day", "present"]),
  isLate: z.boolean(),
});

const attendanceCorrectionSchema = z.object({
  id: z.string(),
  user: userField,
  manager: userField.optional(),
  attendance: z.object({ id: z.string(), date: z.string() }),
  previous: record,
  changes: z.object({
    inTime: z.date(),
    outTime: z.date(),
    status: z.enum(["absent", "half-day", "present"]),
    isLate: z.boolean(),
  }),
  message: z.string(),
  reason: z.string(),
  proof: z.object({ src: z.string(), alt: z.string() }).optional(),
  status: z.enum(["reject", "pending", "approve", "on-hold"]),
});

export type AttendanceCorrectionResponse = z.infer<
  typeof attendanceCorrectionSchema
>;

type SubmitCorrectionPayload = AttendanceCorrectionCreateT;

export const getAttendanceCorrection = async () => {
  const res = await apiFetch<AttendanceCorrectionResponse[]>(
    "/api/attendance/correction/me",
    {
      method: "GET",
    },
  );
  return res.data;
};

export const getAttendanceCorrectionById = async (correctionId: string) => {
  if (correctionId.trim().length === 0) return null;
  const res = await apiFetch<AttendanceCorrectionResponse>(
    "/api/attendance/correction/" + correctionId,
    {
      method: "GET",
    },
  );
  return res.data;
};

export const getAttendanceCorrectionAll = async () => {
  const res = await apiFetch<AttendanceCorrectionResponse[]>(
    "/api/attendance/admin/correction",
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
    `/api/attendance/correction`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  if (!res.success) toast.error(res.message);

  return res;
};

export const handleAttendanceCorrection = async ({
  id,
  payload,
}: {
  id: string;
  payload: AttendanceCorrectionViewType;
}) => {
  const res = await apiFetch<AttendanceCorrectionResponse>(
    `/api/attendance/correction/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
  if (!res.success) toast.error(res.message);

  return res;
};
