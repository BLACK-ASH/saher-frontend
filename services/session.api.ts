import { apiFetch } from "@/lib/api-wrapper";
import { DefaultUserT } from "@/lib/common-zod-schema";
import { toast } from "sonner";

export type SessionT = {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  speaker: DefaultUserT[];
};

export const getSessions = async () => {
  const res = await apiFetch<SessionT[]>("/api/events/sessions", {
    method: "GET",
  });
  if (!res.success) toast.error(res.message);
  return res.data;
};

export const addSession = async (data: Omit<SessionT, "id">) => {
  const res = await apiFetch<SessionT>("/api/events/sessions", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.success) toast.error(res.message);
  return res;
};

export const updateSession = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<SessionT>;
}) => {
  const res = await apiFetch<SessionT>(`/api/events/sessions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.success) toast.error(res.message);
  return res;
};

export const deleteSession = async (id: string) => {
  const res = await apiFetch(`/api/events/sessions/${id}`, {
    method: "DELETE",
  });
  if (!res.success) toast.error(res.message);
  return res;
};
