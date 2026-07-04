import { apiFetch } from "@/lib/api-wrapper";
import { toast } from "sonner";
import { QueryProps } from "./program.api";

export type WorkshopT = {
  id: string;
  title: string;
  description: string;
  programId: {
    id: string;
    title: string;
  };
};

type UpdateProgramInput = {
  id: string;
  data: Omit<WorkshopT, "programId">;
};

export const getWorkshops = async ({
  keyword,
  page = 1,
  limit = 10,
}: QueryProps) => {
  const res = await apiFetch<WorkshopT[]>(
    `/api/events/workshops?keyword=${keyword}&page=${page}&limit=${limit}`,
    {
      method: "GET",
    },
  );
  if (!res.success) toast.error(res.message);
  return res.data;
};

export const addWorkshops = async ({
  programId,
  data,
}: {
  programId: string;
  data: Omit<WorkshopT, "id" | "programId">;
}) => {
  const res = await apiFetch("/api/events/workshops/" + programId, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.success) toast.error(res.message);
  return res;
};

export const updateWorkshops = async ({ id, data }: UpdateProgramInput) => {
  const res = await apiFetch<Omit<WorkshopT, "participants">>(
    `/api/events/workshops/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
  if (!res.success) toast.error(res.message);
  return res;
};

export const deleteWorkshops = async (id: string) => {
  const res = await apiFetch(`/api/events/workshops/${id}`, {
    method: "DELETE",
  });
  if (!res.success) toast.error(res.message);
  return res;
};
