import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyBills, createBill } from "@/services/reimbursement.api";

export const useReimbursement = () => {
  const queryClient = useQueryClient();

  const bills = useQuery({
    queryKey: ["reimbursement", "my-bills"],
    queryFn: () => getMyBills(),
  });

  const createBillMutation = useMutation({
    mutationFn: createBill,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reimbursement", "my-bills"] }),
  });

  return {
    bills,
    createBill: createBillMutation,
  };
};
