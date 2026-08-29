import { apiFetch } from "@/lib/api-wrapper";
import { normalizeList } from "@/lib/normalize-list";
import { toast } from "sonner";
import { QueryProps } from "./program.api";

export type WorkshopT = {
  id: string;
  title: string;
  description: string;
  program: {
    id: string;
    title: string;
  };
};

type UpdateProgramInput = {
  id: string;
  data: Omit<WorkshopT, "program">;
};

export const getWorkshops = async ({
  keyword,
  page = 1,
  limit = 10,
  isDeleted,
}: QueryProps) => {
  const res = await apiFetch<WorkshopT[]>(
    `/api/events/workshops?keyword=${keyword}&page=${page}&limit=${limit}` +
      (isDeleted ? `&isDeleted=${isDeleted}` : ""),
    {
      method: "GET",
    },
  );
  if (!res.success) toast.error(res.message);
  return normalizeList<WorkshopT>(res);
};

export const getSingleWorkshop = async (id: string) => {
  const res = await apiFetch<WorkshopT>(`/api/events/workshops/${id}`, {
    method: "GET",
  });
  if (!res.success) toast.error(res.message);
  return res.data;
};

export const addWorkshops = async ({
  programId,
  data,
}: {
  programId: string;
  data: Omit<WorkshopT, "id" | "program">;
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

export const restoreWorkshop = async (id: string) => {
  const res = await apiFetch(`/api/events/workshops/restore/${id}`, {
    method: "PATCH",
  });
  if (!res.success) toast.error(res.message);
  return res;
};
