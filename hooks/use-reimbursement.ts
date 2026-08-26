import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  createAdvanceBill,
  createBill as createBillApi,
  deleteAdvanceBill,
  deleteBill as deleteBillApi,
  getAuditLog,
  getBalanceEnquiry,
  getMyBills,
  getRecycleBills,
  handleBill as handleBillApi,
  restoreBill as restoreBillApi,
  searchBills,
  settleBill as settleBillApi,
  updateAdvanceBill,
  updateBill as updateBillApi,
  type AdminBillCreateInput,
  type AdminBillUpdateInput,
  type SearchBillsFilters,
  type SettleInput,
  type UserBillCreateInput,
  type UserBillUpdateInput,
} from "@/services/reimbursement.api";

type HandleManyItem = {
  billId: string;
  status: "accept" | "reject" | "on-hold";
  reason: string;
};

export const useReimbursement = (options?: {
  isDeleted?: boolean;
  searchFilters?: SearchBillsFilters;
  searchPage?: number;
  auditPage?: number;
}) => {
  const queryClient = useQueryClient();
  const [bulkProgress, setBulkProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  // Money rule D-29: NO optimistic writes anywhere — every mutation funnels
  // here; the server refetch after invalidation is the only way cache changes.
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["bills"] });
    queryClient.invalidateQueries({ queryKey: ["balance"] });
  };

  const isDeleted = options?.isDeleted ?? false;
  const searchFilters = options?.searchFilters ?? {};
  const searchPage = options?.searchPage ?? 1;
  const auditPage = options?.auditPage ?? 1;

  const myBills = useQuery({
    queryKey: ["bills", "my", isDeleted],
    queryFn: () => getMyBills(isDeleted),
  });

  const recycleBills = useQuery({
    queryKey: ["bills", "recycle"],
    queryFn: getRecycleBills,
  });

  const searchResults = useQuery({
    queryKey: ["bills", "search", searchFilters, searchPage],
    queryFn: () => searchBills(searchFilters, searchPage),
  });

  const balance = useQuery({
    queryKey: ["balance"],
    queryFn: getBalanceEnquiry,
  });

  const auditLog = useQuery({
    queryKey: ["audit-log", auditPage],
    queryFn: () => getAuditLog(auditPage),
  });

  const addBill = useMutation({
    mutationFn: (data: UserBillCreateInput) => createBillApi(data),
    onSuccess: invalidate,
  });

  const editBill = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserBillUpdateInput }) =>
      updateBillApi(id, data),
    onSuccess: invalidate,
  });

  const withdraw = useMutation({
    mutationFn: deleteBillApi,
    onSuccess: invalidate,
  });

  const restore = useMutation({
    mutationFn: restoreBillApi,
    onSuccess: invalidate,
  });

  const addAdvance = useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: AdminBillCreateInput;
    }) => createAdvanceBill(userId, data),
    onSuccess: invalidate,
  });

  const editAdvance = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminBillUpdateInput }) =>
      updateAdvanceBill(id, data),
    onSuccess: invalidate,
  });

  const removeAdvance = useMutation({
    mutationFn: deleteAdvanceBill,
    onSuccess: invalidate,
  });

  // ⚠ On accept the backend auto-creates a Settlement but responds with no id
  // (Pitfall 2) — rely on this invalidation to refetch detail for settle.
  const handleOne = useMutation({
    mutationFn: ({
      billId,
      status,
      reason,
    }: {
      billId: string;
      status: "accept" | "reject" | "on-hold";
      reason: string;
    }) => handleBillApi(billId, { status, reason }),
    onSuccess: invalidate,
  });

  const settle = useMutation({
    mutationFn: ({
      settleId,
      input,
    }: {
      settleId: string;
      input: SettleInput;
    }) => settleBillApi(settleId, input),
    onSuccess: invalidate,
  });

  // D-11/D-27 bulk engine: strictly sequential (never Promise.all), a failed
  // item never aborts the rest (apiFetch already toasted its error), progress
  // surfaces per item, ONE summary toast at the end.
  const handleMany = async (items: HandleManyItem[]) => {
    setBulkProgress({ done: 0, total: items.length });
    let succeeded = 0;
    const failures: string[] = [];

    for (const item of items) {
      try {
        await handleBillApi(item.billId, {
          status: item.status,
          reason: item.reason,
        });
        succeeded += 1;
      } catch {
        failures.push(item.billId);
      }
      setBulkProgress((p) => p && { ...p, done: p.done + 1 });
    }

    setBulkProgress(null);
    invalidate();

    if (failures.length > 0) {
      toast.warning(`${succeeded} handled, ${failures.length} failed`);
    } else {
      toast.success(`${succeeded} handled, ${failures.length} failed`);
    }
  };

  return {
    myBills,
    recycleBills,
    searchResults,
    balance,
    auditLog,
    createBill: addBill,
    updateBill: editBill,
    withdraw,
    restore,
    createAdvance: addAdvance,
    updateAdvance: editAdvance,
    deleteAdvance: removeAdvance,
    handleOne,
    settle,
    handleMany,
    bulkProgress,
  };
};
