import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPayrollList,
  getPayrollByUser,
  updatePayroll,
  runPayrollCron,
  type PayrollUpdateInput,
} from "@/services/payroll.api";

// Money rule D-29 (plan 05-01 parity): NO optimistic writes — mutations only
// invalidate ["payroll"]; the server refetch after invalidation is the only
// way the cache changes.
export const usePayroll = (
  filters: { year?: number; month?: number },
  page = 1,
) => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["payroll"] });
  };

  const list = useQuery({
    queryKey: ["payroll", "list", filters, page],
    queryFn: () => getPayrollList(filters, page),
  });

  const payInstallment = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PayrollUpdateInput }) =>
      updatePayroll(id, data),
    onSuccess: invalidate,
  });

  const runCron = useMutation({
    mutationFn: runPayrollCron,
    onSuccess: invalidate,
  });

  return { list, payInstallment, runCron };
};

export const usePayrollByUser = (userId: string | null, page = 1) =>
  useQuery({
    queryKey: ["payroll", "user", userId, page],
    queryFn: () => getPayrollByUser(userId ?? "", page),
    enabled: !!userId,
  });