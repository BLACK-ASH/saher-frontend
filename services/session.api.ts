import { apiFetch } from "@/lib/api-wrapper";
import { normalizeList } from "@/lib/normalize-list";
import { DefaultUserT } from "@/lib/common-zod-schema";
import { toast } from "sonner";
import { QueryProps } from "./program.api";
import { ParticipantT } from "./participant.api";

export type SessionT = {
  id: string;
  title: string;
  program: {
    id: string;
    title: string;
  };
  workshop: {
    id: string;
    title: string;
  };
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  speaker: DefaultUserT[];
  images: {
    id: string;
    src: string;
    alt: string;
  }[];
  review?: string;
  participants?: ParticipantT[];
};

export type SessionCreateT = {
  title: string;
  workshop?: string;
  program: string;
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
  return normalizeList<SessionT>(res);
};

export const getSingleSession = async (id: string) => {
  const res = await apiFetch<SessionT>(`/api/events/sessions/${id}`, {
    method: "GET",
  });
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
  data: Partial<Omit<SessionT, "images"> & { images: string[] }>;
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

export const markSessionAttendance = async ({
  id,
  data,
}: {
  id: string;
  data: { participantIds: string[] };
}) => {
  const res = await apiFetch<SessionT>(
    `/api/events/attendance/sessions/${id}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
  if (!res.success) toast.error(res.message);
  return res;
};

export const updateSessionAttendance = async ({
  id,
  data,
}: {
  id: string;
  data: { participantIds: string[] };
}) => {
  const res = await apiFetch<SessionT>(
    `/api/events/attendance/sessions/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
  if (!res.success) toast.error(res.message);
  return res;
};

export const deleteSessionAttendance = async ({
  id,
  data,
}: {
  id: string;
  data: { participantIds: string[] };
}) => {
  const res = await apiFetch<SessionT>(
    `/api/events/attendance/sessions/${id}`,
    {
      method: "DELETE",
      body: JSON.stringify(data),
    },
  );
  if (!res.success) toast.error(res.message);
  return res;
};
