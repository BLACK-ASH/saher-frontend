import { EventPayload } from "@/features/calendar/add-event-dialog";
import { apiFetch } from "@/lib/api-wrapper";

type EventT = {
  title: string;
  start: Date;
  end: Date;
  type: string;
  allDay: boolean;
  details: {
    id: string;
    title: string;
    type: string | null;
    description: string | null;
  };
};

export const getCalendar = async (year: string, month: string) => {
  const res = await apiFetch<EventT[]>(`/api/calendar/${year}/${month}`, {
    method: "GET",
  });
  return res.data;
};

export const createCalendarEvent = async (data: EventPayload) => {
  const res = await apiFetch(`/api/calendar/event`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res;
};

export const updateCalendarEvent = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<EventPayload>;
}) => {
  const res = await apiFetch(`/api/calendar/event/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res;
};

export const deleteCalendarEvent = async (id: string) => {
  const res = await apiFetch(`/api/calendar/event/${id}`, {
    method: "DELETE",
  });
  return res;
};

export const syncGoogleCalendar = async () => {
  const res = await apiFetch(`/api/calendar/sync-holidays`, {
    method: "POST",
  });
  return res;
};
