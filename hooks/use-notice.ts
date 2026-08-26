import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createNotice,
  deleteNotice,
  getNotices,
  permanentDeleteNotice,
  restoreNotice,
  updateNotice,
  type CreateNoticeInput,
} from "@/services/notice.api";

export const useNotices = ({ id }: { id?: string } = {}) => {
  const queryClient = useQueryClient();

  // Backend returns old docs on update — always refetch via invalidation.
  const invalidateNotices = () => {
    queryClient.invalidateQueries({ queryKey: ["notices"] });
  };

  const notices = useQuery({
    queryKey: ["notices", "active"],
    queryFn: getNotices,
  });

  // No GET /notice/:id endpoint exists — resolve detail from the full list.
  const notice = useQuery({
    queryKey: ["notices", "detail", id],
    queryFn: async () => (await getNotices()).find((n) => n._id === id),
    enabled: !!id,
  });

  const addNotice = useMutation({
    mutationFn: createNotice,
    onSuccess: invalidateNotices,
  });

  const editNotice = useMutation({
    mutationFn: ({ id: noticeId, data }: { id: string; data: Partial<CreateNoticeInput> }) =>
      updateNotice(noticeId, data),
    onSuccess: invalidateNotices,
  });

  const removeNotice = useMutation({
    mutationFn: deleteNotice,
    onSuccess: invalidateNotices,
  });

  const restore = useMutation({
    mutationFn: restoreNotice,
    onSuccess: invalidateNotices,
  });

  const permanentRemove = useMutation({
    mutationFn: permanentDeleteNotice,
    onSuccess: invalidateNotices,
  });

  return {
    notices,
    notice,
    addNotice,
    editNotice,
    removeNotice,
    restore,
    permanentRemove,
  };
};
