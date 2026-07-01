import { apiFetch } from "@/lib/api-wrapper";
import { toast } from "sonner";

export type WorkshopT = {
  id: string;
  title: string;
  description: string;
  programmeId: string;
};

type UpdateProgramInput = {
  id: string;
  data: Omit<WorkshopT, "programmeId">;
};

export const getWorkshops = async () => {
  const res = await apiFetch<WorkshopT[]>("/api/events/workshops", {
    method: "GET",
  });
  if (!res.success) toast.error(res.message);
  return res.data;
};

export const addWorkshops = async (
  data: Omit<WorkshopT, "id" | "programmeId">,
) => {
  const res = await apiFetch<WorkshopT>("/api/events/workshops", {
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
