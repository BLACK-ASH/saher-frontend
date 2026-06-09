import { getCalendar } from "@/services/calendar.api";
import { useQuery } from "@tanstack/react-query";

export const useCalendar = (year: number, month: number) => {
  return useQuery({
    queryKey: ["calendar", year, month],
    queryFn: () => getCalendar(year.toString(), month.toString()),
    retry: 3,
    staleTime: 1000 * 12 * 60,
  });
};
