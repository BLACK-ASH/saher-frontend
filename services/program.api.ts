import { apiFetch } from "@/lib/api-wrapper";
import { toast } from "sonner";

export type ProgramsT = {
  id: string;
  title: string;
  description: string;
  participants?: string[] | undefined;
};

type UpdateProgramInput = {
  id: string;
  data: Omit<ProgramsT, "participants">;
};

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
