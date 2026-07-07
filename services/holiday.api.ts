import { apiFetch } from "@/lib/api-wrapper";
import { toast } from "sonner";

export const holidayTypes = [
  "national",
  "organizational",
  "optional",
  "other",
  "google",
  "public-holiday",
] as const;

export type HolidayType = (typeof holidayTypes)[number];

export type HolidayT = {
  id: string;
  title: string;
  type: HolidayType;
  date: string;
  description: string | null;
};

export type HolidayPayload = {
  title: string;
  type: HolidayType;
  date: Date | string;
  description?: string | null;
};

export const getHolidays = async () => {
  const res = await apiFetch<HolidayT[]>("/api/attendance/holiday", {
    method: "GET",
  });

  if (!res.success) toast.error(res.message);

  return res.data;
};

export const getHoliday = async (id: string) => {
  const res = await apiFetch<HolidayT>(`/api/attendance/holiday/${id}`, {
    method: "GET",
  });

  if (!res.success) toast.error(res.message);

  return res.data;
};

export const addHoliday = async (data: HolidayPayload) => {
  const res = await apiFetch<HolidayT>("/api/attendance/holiday", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!res.success) toast.error(res.message);
  else toast.success(res.message);

  return res.data;
};

export const updateHoliday = async (
  id: string,
  data: Partial<HolidayPayload>,
) => {
  const res = await apiFetch<HolidayT>(`/api/attendance/holiday/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!res.success) toast.error(res.message);
  else toast.success(res.message);

  return res.data;
};

export const deleteHoliday = async (id: string) => {
  const res = await apiFetch<null>(`/api/attendance/holiday/${id}`, {
    method: "DELETE",
  });

  if (!res.success) toast.error(res.message);
  else toast.success(res.message);

  return res.success;
};
