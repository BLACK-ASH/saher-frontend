import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminUserDetail,
  getAdminUsers,
  updateAccount as updateAccountApi,
  createBank as createBankApi,
  updateBank as updateBankApi,
  restoreBank as restoreBankApi,
  type AccountUpdateInput,
  type BankInput,
} from "@/services/admin.api";

// Bank/account writes are money/KYC mutations — D-29: NO optimistic writes,
// invalidation-only. Mutations invalidate BOTH the ["admin"] (account/bank
// detail surfaces) and ["user"] (directory) prefixes so every consumer
// refreshes after a write.

const useInvalidate = () => {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    queryClient.invalidateQueries({ queryKey: ["user"] });
  };
  return invalidate;
};

export const useAdminUsers = () => {
  const invalidate = useInvalidate();

  const list = useQuery({
    queryKey: ["admin", "list"],
    queryFn: getAdminUsers,
  });

  return { list, invalidate };
};

export const useAdminAccount = (id: string | undefined) =>
  useQuery({
    queryKey: ["admin", "account", id],
    queryFn: () => getAdminUserDetail(id ?? ""),
    enabled: !!id,
  });

export const useBankMutations = () => {
  const invalidate = useInvalidate();

  const updateAccount = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<AccountUpdateInput>;
    }) => updateAccountApi({ id, data }),
    onSuccess: invalidate,
  });

  const createBank = useMutation({
    mutationFn: (data: BankInput) => createBankApi(data),
    onSuccess: invalidate,
  });

  const updateBank = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BankInput> }) =>
      updateBankApi({ id, data }),
    onSuccess: invalidate,
  });

  const restoreBank = useMutation({
    mutationFn: (id: string) => restoreBankApi(id),
    onSuccess: invalidate,
  });

  return { updateAccount, createBank, updateBank, restoreBank };
};