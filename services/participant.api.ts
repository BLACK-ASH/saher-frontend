import { apiFetch } from "@/lib/api-wrapper";
import { normalizeList } from "@/lib/normalize-list";
import { toast } from "sonner";
import z from "zod";
import { QueryProps } from "./program.api";

const baseSchema = z.object({
  name: z.string().min(2).regex(/^[A-Za-z\s]+$/, "Name must contain only letters"),
  age: z.number().min(1).optional(),
  gender: z
    .string()
    .transform((e) => e.toLocaleUpperCase())
    .optional(),
  phoneNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number")
    .optional()
    .or(z.literal("")),
  image: z.string().trim().optional(),
  address: z.string().optional(),
  affiliation: z.string().optional(),
  parentDetails: z.string().optional(),
  document: z.string().trim().array().optional(),
});

export const participantSchema = baseSchema.refine(
  (data) => {
    if (data.age) return data.age >= 18 || !!data.parentDetails;
  },
  {
    message: "Parent Details is required if age is less than 18",
    path: ["parentDetails"],
  },
);

export const createParticipantSchema = participantSchema.extend({
  uploaded: z.object({ image: z.any(), document: z.any().array() }).optional(),
});

export const updatedParticipantSchema = baseSchema
  .extend({
    uploaded: z
      .object({ image: z.any(), document: z.any().array() })
      .optional(),
  })
  .partial()
  .refine(
    (data) => {
      if (data.age) return data.age >= 18 || !!data.parentDetails;
    },
    {
      message: "Parent Details is required if age is less than 18",
      path: ["parentDetails"],
    },
  );

export const participantResponseSchema = baseSchema
  .omit({ image: true })
  .extend({
    id: z.string(),
    image: z
      .object({ id: z.string(), src: z.string(), alt: z.string() })
      .optional(),
    document: z
      .object({ id: z.string(), src: z.string(), alt: z.string() })
      .array()
      .optional(),
  });

export type CreateParticipantType = z.infer<typeof createParticipantSchema>;
export type UpdateParticipantType = z.infer<typeof updatedParticipantSchema>;
export type ParticipantT = z.infer<typeof participantResponseSchema>;

export const getParticipants = async ({
  keyword,
  page = 1,
  limit = 10,
  isDeleted = "false",
}: QueryProps) => {
  const res = await apiFetch<ParticipantT[]>(
    `/api/events/participants?keyword=${keyword}&page=${page}&limit=${limit}&isDeleted=${isDeleted}`,
    {
      method: "GET",
    },
  );
  if (!res.success) toast.error(res.message);
  return normalizeList<ParticipantT>(res);
};

export const restoreParticipant = async (id: string) => {
  const res = await apiFetch(`/api/events/participants/restore/${id}`, {
    method: "PATCH",
  });
  if (!res.success) toast.error(res.message);
  return res;
};

export const getSingleParticipant = async (id: string) => {
  const res = await apiFetch<ParticipantT>(`/api/events/participants/${id}`, {
    method: "GET",
  });
  if (!res.success) toast.error(res.message);
  return res.data;
};

export const addParticipant = async (data: CreateParticipantType) => {
  const res = await apiFetch("/api/events/participants", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.success) toast.error(res.message);
  return res;
};

export const updateParticipant = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateParticipantType;
}) => {
  const res = await apiFetch(`/api/events/participants/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.success) toast.error(res.message);
  return res;
};

export const deleteParticipant = async (id: string) => {
  const res = await apiFetch(`/api/events/participants/${id}`, {
    method: "DELETE",
  });
  if (!res.success) toast.error(res.message);
  return res;
};
