import {
  getMails,
  getSearchUser,
  getSentMails,
  sendMail,
} from "@/services/mail.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useMail = (keyword?: string) => {
  const queryClient = useQueryClient();

  const inbox = useQuery({
    queryKey: ["inbox"],
    queryFn: () => getMails(),
    staleTime: 60 * 1000,
  });

  const user = useQuery({
    queryKey: ["users", keyword],
    queryFn: () => getSearchUser(keyword as string),
    enabled: !!keyword,
  });
  const sent = useQuery({
    queryKey: ["sent"],
    queryFn: () => getSentMails(),
    staleTime: 60 * 1000,
  });

  const send = useMutation({
    mutationFn: sendMail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sent"] });
    },
  });

  return {
    inbox,
    sent,
    send,
    user,
  };
};
