import { apiFetch } from "@/lib/api-wrapper";
import { normalizeList } from "@/lib/normalize-list";
import { toast } from "sonner";
import { ParticipantT } from "./participant.api";

export type ProgramsT = {
  id: string;
  title: string;
  description: string;
};

type UpdateProgramInput = {
  id: string;
  data: ProgramsT;
};

export type SingleParticipantT = ProgramsT & { participants: ParticipantT[] };

export type QueryProps = {
  keyword?: string;
  limit?: number;
  page?: number;
};

export const getPrograms = async ({
  keyword,
  page = 1,
  limit = 10,
}: QueryProps) => {
  const res = await apiFetch<ProgramsT[]>(
    `/api/events/programs?keyword=${keyword}&page=${page}&limit=${limit}`,
    {
      method: "GET",
    },
  );
  if (!res.success) toast.error(res.message);
  return normalizeList<ProgramsT>(res);
};

export const getSingleProgram = async (id: string) => {
  const res = await apiFetch<SingleParticipantT>(`/api/events/programs/${id}`, {
    method: "GET",
  });
  if (!res.success) toast.error(res.message);
  return res.data;
};

export const addProgram = async (data: Omit<ProgramsT, "id">) => {
  const res = await apiFetch<ProgramsT>("/api/events/programs", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.success) toast.error(res.message);
  return res;
};

export const updateProgram = async ({ id, data }: UpdateProgramInput) => {
  const res = await apiFetch<Omit<ProgramsT, "participants">>(
    `/api/events/programs/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
  if (!res.success) toast.error(res.message);
  return res;
};

export const deleteProgram = async (id: string) => {
  const res = await apiFetch(`/api/events/programs/${id}`, {
    method: "DELETE",
  });
  if (!res.success) toast.error(res.message);
  return res;
};

export const addParticipantsInProgram = async ({
  id,
  participants,
}: {
  id: string;
  participants: string[];
}) => {
  const res = await apiFetch("/api/events/programs/participants/" + id, {
    method: "POST",
    body: JSON.stringify(participants),
  });
  if (!res.success) toast.error(res.message);
  return res;
};

export const getParticipantFromProgram = async (programId: string) => {
  const res = await apiFetch<ParticipantT[]>(
    `/api/events/programs/participants/${programId}`,
    {
      method: "GET",
    },
  );
  if (!res.success) toast.error(res.message);
  return res.data;
};

export const removeParticipantFromProgram = async ({
  programId,
  participantId,
}: {
  programId: string;
  participantId: string;
}) => {
  const res = await apiFetch(
    `/api/events/programs/participants/${programId}/${participantId}`,
    {
      method: "DELETE",
    },
  );
  if (!res.success) toast.error(res.message);
  return res;
};
