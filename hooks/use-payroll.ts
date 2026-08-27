import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  searchPayroll, 
  getPayrollHistory, 
  payInstallment, 
  runCron 
} from "@/services/payroll.api";
import { toast } from "sonner";
import { PayrollHistoryResponse } from "@/services/payroll.api";

export const usePayroll = (year: number, month: number, page = 1, limit = 10) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["payroll", "list", year, month, page, limit],
    queryFn: () => searchPayroll(year, month, page, limit),
  });

  const pay = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof payInstallment>[1] }) => 
      payInstallment(id, data),
    onSuccess: () => {
      toast.success("Payment recorded");
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const run = useMutation({
    mutationFn: runCron,
    onSuccess: () => {
      toast.success("Payroll calculation started — check notifications");
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return {
    ...query,
    pay,
    run,
  };
};

export const usePayrollHistory = (payrollId: string) => {
  return useQuery<PayrollHistoryResponse[]>({
    queryKey: ["payroll", "history", payrollId],
    queryFn: () => getPayrollHistory(payrollId),
    enabled: !!payrollId,
  });
};
