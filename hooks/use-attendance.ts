// hooks/useAttendance.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getAttendanceStatus,
  checkInApi,
  checkOutApi,
  getAttendance,
} from "@/services/attendance.api"

export enum AttendanceStatus {
  NOT_CHECKED_IN = "NOT_CHECKED_IN",
  CHECKED_IN = "CHECKED_IN",
  CHECKED_OUT = "CHECKED_OUT",
}
type UseAttendanceProps = {
  filter?: "week" | "month"
}

export const useAttendance = ({ filter = "week" }: UseAttendanceProps = {}) => {
  const queryClient = useQueryClient()

  const today = useQuery({
    queryKey: ["attendance", "me"],
    queryFn: getAttendanceStatus,
  })

  const attendances = useQuery({
    queryKey: ["attendance", "me", filter],
    queryFn: () => getAttendance(filter)
  })

  const checkInMutation = useMutation({
    mutationFn: checkInApi,
    onSuccess: (data) => {
      // 🔥 instant UI update (better than refetch)
      queryClient.setQueryData(["attendance", "me"], data)
    },
  })

  const checkOutMutation = useMutation({
    mutationFn: checkOutApi,
    onSuccess: (data) => {
      queryClient.setQueryData(["attendance", "me"], data)
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
    attendances,

    status,
    isCheckedIn,
    isCheckedOut,

    checkIn: checkInMutation.mutate,
    checkOut: checkOutMutation.mutate,

    isCheckingIn: checkInMutation.isPending,
    isCheckingOut: checkOutMutation.isPending,
  }
}
