import { useQuery } from "@tanstack/react-query";
import { dateToIstDateOnly } from "@/lib/date";
import {
  getAttendanceByUserId,
  getRangeAttendance,
  getTodayAttendance,
} from "@/services/attendance.api";

export const useAdminAttendance = (
  filters: { startDate: string; endDate: string },
  page = 1,
) =>
  useQuery({
    queryKey: ["attendance", "admin", "range", filters, page],
    queryFn: () =>
      getRangeAttendance({ startDate: filters.startDate, endDate: filters.endDate, page, sort: "desc" }),
    staleTime: 60_000,
  });

export const useTodayAttendance = (page = 1) =>
  useQuery({
    queryKey: ["attendance", "admin", "today", page],
    queryFn: () => getTodayAttendance({ page, sort: "desc" }),
    staleTime: 60_000,
  });

export const useMonthlyAttendance = (year: number, month: number, page = 1) =>
  useQuery({
    queryKey: ["attendance", "admin", "monthly", year, month, page],
    queryFn: () => {
      const startDate = dateToIstDateOnly(new Date(year, month - 1, 1));
      const endDate = dateToIstDateOnly(new Date(year, month, 0));
      return getRangeAttendance({ startDate, endDate, page, sort: "desc" });
    },
    staleTime: 60_000,
  });

export const useEmployeeAttendance = (userId: string, page = 1) =>
  useQuery({
    queryKey: ["attendance", "admin", "user-history", userId, page],
    queryFn: () => getAttendanceByUserId(userId, page),
    enabled: !!userId,
    staleTime: 60_000,
  });
