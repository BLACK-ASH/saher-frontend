// hooks/useAttendance.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getAttendanceStatus,
  checkInApi,
  checkOutApi,
} from "@/services/attendance.api"

export enum AttendanceStatus {
  NOT_CHECKED_IN = "NOT_CHECKED_IN",
  CHECKED_IN = "CHECKED_IN",
  CHECKED_OUT = "CHECKED_OUT",
}

export const useAttendance = () => {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["attendance", "me"],
    queryFn: getAttendanceStatus,
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

  if (data?.inTime && !data?.outTime) {
    status = AttendanceStatus.CHECKED_IN
  }

  if (data?.inTime && data?.outTime) {
    status = AttendanceStatus.CHECKED_OUT
  }

  const isCheckedIn: boolean = data?.inTime !== null
  const isCheckedOut: boolean = data?.outTime !== null

  return {
    data,
    isLoading,

    status,
    isCheckedIn,
    isCheckedOut,

    checkIn: checkInMutation.mutate,
    checkOut: checkOutMutation.mutate,

    isCheckingIn: checkInMutation.isPending,
    isCheckingOut: checkOutMutation.isPending,
  }
}
