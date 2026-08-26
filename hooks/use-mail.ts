import {
  getMails,
  getSearchUser,
  getSentMails,
  sendMail,
} from "@/services/mail.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type UseMailProps = {
  keyword?: string;
  page?: number;
  limit?: number;
};

export const useMail = ({ keyword, page = 1, limit = 10 }: UseMailProps = {}) => {
  const queryClient = useQueryClient();

  const inbox = useQuery({
    queryKey: ["inbox", page, limit],
    queryFn: () => getMails({ page, limit }),
    staleTime: 60 * 1000,
  });

  const sent = useQuery({
    queryKey: ["sent", page, limit],
    queryFn: () => getSentMails({ page, limit }),
    staleTime: 60 * 1000,
  });

  const user = useQuery({
    queryKey: ["users", keyword],
    queryFn: () => getSearchUser(keyword as string),
    enabled: !!keyword && keyword.trim().length >= 2,
  });

  const send = useMutation({
    mutationFn: sendMail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sent"] });
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
    },
  });

  return {
    inbox,
    sent,
    send,
    user,
  };
};
