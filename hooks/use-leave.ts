import {
  applyLeave,
  createLeaveType,
  getAllLeaveApplications,
  getLeaveApplications,
  getLeaveBalance,
  getLeaveTypes,
  reviewLeaveApplication,
  updateLeaveApplication,
  updateLeaveType,
} from "@/services/leave.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Props = {
  page?: number;
  limit?: number;
  all?: boolean;
};

export const useLeave = ({ page = 1, limit = 10, all = false }: Props = {}) => {
  const queryClient = useQueryClient();

  const leaveTypes = useQuery({
    queryKey: ["leave", "types"],
    queryFn: getLeaveTypes,
    staleTime: 1000 * 60 * 30,
  });

  const applications = useQuery({
    queryKey: ["leave", "applications", page, limit, all],
    queryFn: () =>
      all
        ? getAllLeaveApplications({ page, limit })
        : getLeaveApplications({ page, limit }),
  });

  const balance = useQuery({
    queryKey: ["leave", "balance"],
    queryFn: getLeaveBalance,
    staleTime: 1000 * 60 * 5,
  });

  const apply = useMutation({
    mutationFn: applyLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["leave"],
      });
    },
  });

  const review = useMutation({
    mutationFn: reviewLeaveApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["leave"],
      });
    },
  });

  const updateApplication = useMutation({
    mutationFn: updateLeaveApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["leave"],
      });
    },
  });

  const createType = useMutation({
    mutationFn: createLeaveType,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["leave", "types"],
      });
    },
  });

  const updateType = useMutation({
    mutationFn: updateLeaveType,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["leave", "types"],
      });
    },
  });

  return {
    leaveTypes,
    applications,
    balance,

    apply,
    review,
    updateApplication,

    createType,
    updateType,
  };
};
