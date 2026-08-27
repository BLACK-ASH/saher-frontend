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
  type HandleBillInput,
  type BillResponse,
  type UserBillUpdateInput,
  type AdminBillCreateInput,
  type AdminBillUpdateInput,
} from "@/services/reimbursement.api";
import { toast } from "sonner";
import { NormalizedList } from "@/lib/normalize-list";

export type HandleStatus = "accept" | "reject" | "on-hold";

type BulkProgress = { done: number; total: number } | null;

// Separate hook for search to satisfy react-hooks/rules-of-hooks
export const useSearchBills = (filters: Parameters<typeof searchBills>[0] = {}, page = 1) =>
  useQuery({
    queryKey: ["bills", "search", filters, page],
    queryFn: () => searchBills(filters, page),
  });

export const useRecycleBills = () =>
  useQuery({
    queryKey: ["bills", "recycle"],
    queryFn: getRecycleBills,
  });

export const useReimbursement = () => {
  const queryClient = useQueryClient();
  const [bulkProgress, setBulkProgress] = useState<BulkProgress>(null);

  const myBills = useQuery({
    queryKey: ["reimbursement", "my-bills"],
    queryFn: () => getMyBills(),
  });

  const createBillMutation = useMutation({
    mutationFn: createBill,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reimbursement", "my-bills"] }),
  });

  const updateBillMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserBillUpdateInput }) =>
      updateBill(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reimbursement", "my-bills"] }),
  });

  const withdraw = useMutation({
    mutationFn: deleteBill,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reimbursement", "my-bills"] }),
  });

  const restore = useMutation({
    mutationFn: restoreBill,
    onSuccess: () => {
      toast.success("Bill restored");
      queryClient.invalidateQueries({ queryKey: ["bills", "search"] });
      queryClient.invalidateQueries({ queryKey: ["bills", "recycle"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const createAdvance = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: AdminBillCreateInput }) =>
      createAdvanceBill(userId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reimbursement", "my-bills"] }),
  });

  const updateAdvance = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminBillUpdateInput }) =>
      updateAdvanceBill(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reimbursement", "my-bills"] }),
  });

  const deleteAdvance = useMutation({
    mutationFn: deleteAdvanceBill,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reimbursement", "my-bills"] }),
  });

  const settle = useMutation({
    mutationFn: ({ settleId, input }: { settleId: string; input: { mode: string; status: string } }) => {
      // placeholder
      return Promise.resolve();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reimbursement", "my-bills"] }),
  });

  // --- Finance Management ---
  const handleOne = useMutation({
    mutationFn: ({ billId, status, reason }: { billId: string; status: HandleStatus; reason: string }) =>
      handleBill(billId, { status, reason }),
    onSuccess: (_data, variables) => {
      toast.success(
        variables.status === "accept"
          ? "Bill accepted — settlement created automatically"
          : `Bill ${variables.status === "reject" ? "rejected" : "put on hold"}`
      );
      queryClient.invalidateQueries({ queryKey: ["bills", "search"] });
      queryClient.invalidateQueries({ queryKey: ["bills", "recycle"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleMany = async (items: { billId: string; status: HandleStatus; reason: string }[]) => {
    setBulkProgress({ done: 0, total: items.length });
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        await handleBill(items[i].billId, { status: items[i].status, reason: items[i].reason });
      } catch (err) {
        errors.push(`${items[i].billId.slice(-6)}: ${err instanceof Error ? err.message : "Failed"}`);
      }
      setBulkProgress({ done: i + 1, total: items.length });
    }

    setBulkProgress(null);

    queryClient.invalidateQueries({ queryKey: ["bills", "search"] });
    queryClient.invalidateQueries({ queryKey: ["bills", "recycle"] });

    if (errors.length > 0) {
      toast.error(`Bulk handle completed with ${errors.length} failures`);
    } else {
      toast.success(`Bulk ${items[0]?.status === "accept" ? "accept" : items[0]?.status === "reject" ? "reject" : "hold"} completed`);
    }
  };

  return {
    bills: myBills,
    myBills: myBills,
    createBill: createBillMutation,
    updateBill: updateBillMutation,
    withdraw,
    restore,
    createAdvance,
    updateAdvance,
    deleteAdvance,
    settle,

    // Finance management - these are hooks, not query results
    // Components should use useSearchBills and useRecycleBills directly
    handleOne,
    handleMany,
    bulkProgress,
  };
};