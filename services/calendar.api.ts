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
