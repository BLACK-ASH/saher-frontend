import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getAttendanceStatus,
  checkInApi,
  checkOutApi,
  getAttendance,
  getAttendanceById,
} from "@/services/attendance.api"

export enum AttendanceStatus {
  NOT_CHECKED_IN = "NOT_CHECKED_IN",
  CHECKED_IN = "CHECKED_IN",
  CHECKED_OUT = "CHECKED_OUT",
}

type UseAttendanceProps = {
  filter?: "week" | "month",
  sort?: "asc" | "desc",
  attendanceId?: string
}

export const useAttendance = ({ filter = "week", sort = "asc", attendanceId }: UseAttendanceProps = {}) => {
  const queryClient = useQueryClient()

  const today = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: getAttendanceStatus,
  })

  const attendance = useQuery({
    queryKey: ["attendance", attendanceId],
    queryFn: () => getAttendanceById(attendanceId as string),
    enabled: !!attendanceId,
  });

  const attendancesList = useQuery({
    queryKey: ["attendance", "list", filter,sort],
    queryFn: () => getAttendance(filter, sort)
  })

  const checkIn = useMutation({
    mutationFn: checkInApi,
    onSuccess: (data) => {
      // 🔥 instant UI update (better than refetch)
      queryClient.setQueryData(["attendance", "today"], data)
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
    },
  })

  const checkOut = useMutation({
    mutationFn: checkOutApi,
    onSuccess: (data) => {
      queryClient.setQueryData(["attendance", "today"], data)
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
    },
  })

  // 🔥 derive status
  let status = AttendanceStatus.NOT_CHECKED_IN

  if (today.data?.inTime && !today.data?.outTime) {
    status = AttendanceStatus.CHECKED_IN
  }

  if (today.data?.inTime && today.data?.outTime) {
    status = AttendanceStatus.CHECKED_OUT
  }

  const isCheckedIn: boolean = !!today.data?.inTime
  const isCheckedOut: boolean = !!today.data?.outTime

  return {
    today,
    attendance,
    attendancesList,

    status,
    isCheckedIn,
    isCheckedOut,

    checkIn,
    checkOut,
  }
}
