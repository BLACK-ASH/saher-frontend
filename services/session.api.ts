import { apiFetch } from "@/lib/api-wrapper";
import { normalizeList } from "@/lib/normalize-list";
import { DefaultUserT } from "@/lib/common-zod-schema";
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

// Mirrors backend `updatedSessionSchema` (baseSchema.partial()): program is
// set via the URL param, not the body. speaker/workshop are bare ObjectIds.
export type SessionUpdateT = {
  title?: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  speaker?: string[];
  workshop?: string;
  review?: string;
  images?: string[];
};

export const getSessions = async ({
  keyword,
  page = 1,
  limit = 10,
  isDeleted,
}: QueryProps) => {
  const res = await apiFetch<SessionT[]>(
    `/api/events/sessions?keyword=${keyword}&page=${page}&limit=${limit}` +
      (isDeleted ? `&isDeleted=${isDeleted}` : ""),
    {
      method: "GET",
    },
  );
  return normalizeList<SessionT>(res);
};

export const getSingleSession = async (id: string) => {
  const res = await apiFetch<SessionT>(`/api/events/sessions/${id}`, {
    method: "GET",
  });
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
  return res;
};

export const updateSession = async ({
  id,
  data,
}: {
  id: string;
  data: SessionUpdateT;
}) => {
  const res = await apiFetch<SessionT>(`/api/events/sessions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res;
};

export const deleteSession = async (id: string) => {
  const res = await apiFetch(`/api/events/sessions/${id}`, {
    method: "DELETE",
  });
  return res;
};

export const restoreSession = async (id: string) => {
  const res = await apiFetch(`/api/events/sessions/restore/${id}`, {
    method: "PATCH",
  });
  return res;
};

// GET despite the verb — backend reminder route is an odd GET job trigger (EVNT-07).
// Sends an email reminder to the session's speakers; 201, data null. Any 2xx = done.
export const sendSessionReminder = async (id: string) => {
  const res = await apiFetch(`/api/events/programs/workshops/sessions/${id}`, {
    method: "GET",
  });
  return res;
};

// GET oddity — backend export route is an odd GET job trigger (EVNT-08).
// Enqueues a BullMQ report job returning { jobId, format }; the result lands as a
// "download" notification. "processing"/2xx treated as success for the caller.
export const requestSessionExport = async ({
  id,
  format,
}: {
  id: string;
  format: "pdf" | "xlsx";
}) => {
  const res = await apiFetch<{ jobId: string; format: string }>(
    `/api/events/export/report?sessionId=${id}&format=${format}`,
    {
      method: "GET",
    },
  );
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
  return res;
};
