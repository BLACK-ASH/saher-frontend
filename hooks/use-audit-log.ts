import { useQuery } from "@tanstack/react-query";
import { getAuditLog } from "@/services/reimbursement.api";

export const useAuditLog = (page: number, limit = 10) => {
  return useQuery({
    queryKey: ["audit-log", page, limit],
    queryFn: () => getAuditLog(page, limit),
  });
};