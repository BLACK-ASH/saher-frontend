import {
  addSession,
  deleteSession,
  getSessions,
  updateSession,
} from "@/services/session.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useSessions = () => {
  const queryClient = useQueryClient();

  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: getSessions,
  });

  const add = useMutation({
    mutationFn: addSession,
    onSuccess: () => {
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
