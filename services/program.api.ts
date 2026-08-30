import { apiFetch } from "@/lib/api-wrapper";
import { normalizeList } from "@/lib/normalize-list";
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
  isDeleted?: string;
};

export const getPrograms = async ({
  keyword,
  page = 1,
  limit = 10,
  isDeleted,
}: QueryProps) => {
  const res = await apiFetch<ProgramsT[]>(
    `/api/events/programs?keyword=${keyword}&page=${page}&limit=${limit}` +
      (isDeleted ? `&isDeleted=${isDeleted}` : ""),
    {
      method: "GET",
    },
  );
  return normalizeList<ProgramsT>(res);
};

export const getSingleProgram = async (id: string) => {
  const res = await apiFetch<SingleParticipantT>(`/api/events/programs/${id}`, {
    method: "GET",
  });
  return res.data;
};

export const addProgram = async (data: Omit<ProgramsT, "id">) => {
  const res = await apiFetch<ProgramsT>("/api/events/programs", {
    method: "POST",
    body: JSON.stringify(data),
  });
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
  return res;
};

export const deleteProgram = async (id: string) => {
  const res = await apiFetch(`/api/events/programs/${id}`, {
    method: "DELETE",
  });
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
    body: JSON.stringify({ participantIds: participants }),
  });
  return res;
};

export const restoreProgram = async (id: string) => {
  const res = await apiFetch(`/api/events/programs/restore/${id}`, {
    method: "PATCH",
  });
  return res;
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
  return res;
};
