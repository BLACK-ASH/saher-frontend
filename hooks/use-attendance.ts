import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAttendanceStatus,
  checkInApi,
  checkOutApi,
  getAttendance,
} from "@/services/attendance.api";

export enum AttendanceStatus {
  NOT_CHECKED_IN = "NOT_CHECKED_IN",
  CHECKED_IN = "CHECKED_IN",
  LATE = "LATE",
  CHECKED_OUT = "CHECKED_OUT",
}

type UseAttendanceProps = {
  attendanceId?: string;
  sort?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export const useAttendance = ({
  limit = 10,
  sort = "asc",
  page = 1,
}: UseAttendanceProps = {}) => {
  const queryClient = useQueryClient();

  const today = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: getAttendanceStatus,
  });

  const attendancesList = useQuery({
    queryKey: ["attendance", "list", page, limit, sort],
    queryFn: () => getAttendance({ sort, page, limit }),
  });

  const checkIn = useMutation({
    mutationFn: checkInApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });

  const checkOut = useMutation({
    mutationFn: checkOutApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });

  // 🔥 derive status
  let status = AttendanceStatus.NOT_CHECKED_IN;

  if (today.data?.inTime && !today.data?.outTime) {
    status = AttendanceStatus.CHECKED_IN;
  }

  if (today.data?.isLate) {
    status = AttendanceStatus.LATE;
  }

  if (today.data?.inTime && today.data?.outTime) {
    status = AttendanceStatus.CHECKED_OUT;
  }

  const isCheckedIn: boolean = !!today.data?.inTime;
  const isCheckedOut: boolean = !!today.data?.outTime;

  return {
    today,
    attendancesList,

    status,
    isCheckedIn,
    isCheckedOut,

    checkIn,
    checkOut,
  };
};
