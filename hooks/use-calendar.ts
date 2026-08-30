import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendar,
  syncGoogleCalendar,
  updateCalendarEvent,
} from "@/services/calendar.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Props = {
  year?: number;
  month?: number;
};

export const useCalendar = ({ year, month }: Props) => {
  const queryClient = useQueryClient();

  const calendar = useQuery({
    queryKey: ["calendar", "events", year, month],
    queryFn: () => getCalendar(year?.toString() ?? "", month?.toString() ?? ""),
    retry: 3,
    enabled: year != null && month != null,
    staleTime: 1000 * 12 * 60,
  });

  const add = useMutation({
    mutationFn: createCalendarEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
  });

  const update = useMutation({
    mutationFn: updateCalendarEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
  });

  const del = useMutation({
    mutationFn: deleteCalendarEvent,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
  });

  const syncGoogle = useMutation({
    mutationFn: syncGoogleCalendar,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
  });

  return { calendar, add, del, update, syncGoogle };
};
