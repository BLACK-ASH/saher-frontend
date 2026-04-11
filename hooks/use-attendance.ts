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
  filter?: "week" | "month"
  attendanceId?: string
}

export const useAttendance = ({ filter = "week", attendanceId }: UseAttendanceProps = {}) => {
  const queryClient = useQueryClient()

  const today = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: getAttendanceStatus,
  })

  const attendance = useQuery({
    queryKey: ["attendance", attendanceId],
    queryFn: () => getAttendanceById(attendanceId!),
    enabled: !!attendanceId, // ✅ good practice
  });

  const attendancesList = useQuery({
    queryKey: ["attendance", "today", filter],
    queryFn: () => getAttendance(filter)
  })

  const checkInMutation = useMutation({
    mutationFn: checkInApi,
    onSuccess: (data) => {
      // 🔥 instant UI update (better than refetch)
      queryClient.setQueryData(["attendance", "today"], data)
    },
  })

  const checkOutMutation = useMutation({
    mutationFn: checkOutApi,
    onSuccess: (data) => {
      queryClient.setQueryData(["attendance", "today"], data)
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

  const isCheckedIn: boolean = today.data?.inTime !== null
  const isCheckedOut: boolean = today.data?.outTime !== null

  return {
    today,
    attendance,
    attendancesList,

    status,
    isCheckedIn,
    isCheckedOut,

    checkIn: checkInMutation.mutate,
    checkOut: checkOutMutation.mutate,

    isCheckingIn: checkInMutation.isPending,
    isCheckingOut: checkOutMutation.isPending,
  }
}
