import { apiFetch } from "@/lib/api-wrapper";
import { DefaultUserT } from "@/lib/common-zod-schema";
import { toast } from "sonner";
import { QueryProps } from "./program.api";

export type SessionT = {
  id: string;
  title: string;
  programId: {
    id: string;
    title: string;
  };
  workshopId: {
    id: string;
    title: string;
  };
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  speaker: DefaultUserT[];
};

export type SessionCreateT = {
  title: string;
  workshopId?: string;
  programId: string;
  description: string;
  date: string;
  startTime: Date;
  endTime: Date;
  speaker: string[];
};

export const getSessions = async ({
  keyword,
  page = 1,
  limit = 10,
}: QueryProps) => {
  const res = await apiFetch<SessionT[]>(
    `/api/events/sessions?keyword=${keyword}&page=${page}&limit=${limit}`,
    {
      method: "GET",
    },
  );
  if (!res.success) toast.error(res.message);
  return res.data;
};

export const addSession = async ({
  programId,
  data,
}: {
  programId: string;
  data: SessionCreateT;
}) => {
  const res = await apiFetch<SessionT>("/api/events/sessions/" + programId, {
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
