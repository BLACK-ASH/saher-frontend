import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyBills,
  createBill,
  searchBills,
  getRecycleBills,
  handleBill,
  restoreBill,
  updateBill,
  deleteBill,
  createAdvanceBill,
  updateAdvanceBill,
  deleteAdvanceBill,
  settleBill,
  type HandleBillInput,
  type SearchBillsFilters,
  type SettleInput,
  type BillResponse,
  type UserBillUpdateInput,
  type AdminBillCreateInput,
  type AdminBillUpdateInput,
} from "@/services/reimbursement.api";
import { toast } from "sonner";

export type HandleStatus = "accept" | "reject" | "on-hold";

type HandleManyItem = {
  billId: string;
  status: HandleStatus;
  reason: string;
};

type BulkProgress = { done: number; total: number } | null;

// Separate hook for search to satisfy react-hooks/rules-of-hooks. Key stays under
// ["bills"] so the shared invalidate() in useReimbursement refetches it.
export const useSearchBills = (filters: SearchBillsFilters = {}, page = 1) =>
  useQuery({
    queryKey: ["bills", "search", filters, page],
    queryFn: () => searchBills(filters, page),
  });

export const useRecycleBills = () =>
  useQuery({
    queryKey: ["bills", "recycle"],
    queryFn: getRecycleBills,
  });

export const useReimbursement = (options?: { isDeleted?: boolean }) => {
  const queryClient = useQueryClient();
  const [bulkProgress, setBulkProgress] = useState<BulkProgress>(null);

  const isDeleted = options?.isDeleted ?? false;

  // Money rule D-29: NO optimistic writes anywhere — every mutation funnels
  // here; the server refetch after invalidation is the only way cache changes.
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["bills"] });
    queryClient.invalidateQueries({ queryKey: ["reimbursement", "balance"] });
  };

  const myBills = useQuery({
    queryKey: ["bills", "my", isDeleted],
    queryFn: () => getMyBills(isDeleted),
  });

  const createBillMutation = useMutation({
    mutationFn: createBill,
    onSuccess: invalidate,
  });

  const updateBillMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserBillUpdateInput }) =>
      updateBill(id, data),
    onSuccess: invalidate,
  });

  const withdraw = useMutation({
    mutationFn: deleteBill,
    onSuccess: invalidate,
  });

  const restore = useMutation({
    mutationFn: restoreBill,
    onSuccess: invalidate,
  });

  const createAdvance = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: AdminBillCreateInput }) =>
      createAdvanceBill(userId, data),
    onSuccess: invalidate,
  });

  const updateAdvance = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminBillUpdateInput }) =>
      updateAdvanceBill(id, data),
    onSuccess: invalidate,
  });

  const deleteAdvance = useMutation({
    mutationFn: deleteAdvanceBill,
    onSuccess: invalidate,
  });

  // ⚠ On accept the backend auto-creates a Settlement but responds with no id
  // (Pitfall 2) — rely on this invalidation to refetch detail for settle.
  const handleOne = useMutation({
    mutationFn: (item: HandleBillInput & { billId: string }) =>
      handleBill(item.billId, { status: item.status, reason: item.reason }),
    onSuccess: invalidate,
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const settle = useMutation({
    mutationFn: ({ settleId, input }: { settleId: string; input: SettleInput }) =>
      settleBill(settleId, input),
    onSuccess: invalidate,
    onError: (err: Error) => {
      toast.error(err.message);
    },
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
        await handleBill(item.billId, {
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
    bills: myBills,
    myBills,
    createBill: createBillMutation,
    updateBill: updateBillMutation,
    withdraw,
    restore,
    createAdvance,
    updateAdvance,
    deleteAdvance,
    handleOne,
    settle,
    handleMany,
    bulkProgress,
  };
};