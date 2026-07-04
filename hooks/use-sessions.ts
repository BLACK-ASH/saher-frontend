import { QueryProps } from "@/services/program.api";
import {
  addSession,
  deleteSession,
  getSessions,
  updateSession,
} from "@/services/session.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Props = {} & QueryProps;

export const useSessions = ({ keyword, limit, page }: Props) => {
  const queryClient = useQueryClient();

  const sessions = useQuery({
    queryKey: ["sessions", keyword, limit, page],
    queryFn: () => getSessions({ keyword, page, limit }),
  });

  const add = useMutation({
    mutationFn: addSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const update = useMutation({
    mutationFn: updateSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const del = useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  return {
    sessions,
    add,
    update,
    del,
  };
};
