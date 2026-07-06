import { QueryProps } from "@/services/program.api";
import {
  addSession,
  deleteSession,
  deleteSessionAttendance,
  getSessions,
  getSingleSession,
  markSessionAttendance,
  updateSession,
  updateSessionAttendance,
} from "@/services/session.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Props = { id?: string } & QueryProps;

export const useSessions = ({ id, keyword, limit, page }: Props) => {
  const queryClient = useQueryClient();

  const sessions = useQuery({
    queryKey: ["sessions", keyword, limit, page],
    queryFn: () => getSessions({ keyword, page, limit }),
  });

  const session = useQuery({
    queryKey: ["sessions", id],
    queryFn: () => getSingleSession(id as string),
    enabled: !!id,
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

  const markAttendance = useMutation({
    mutationFn: markSessionAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const updateAttendance = useMutation({
    mutationFn: updateSessionAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const deleteAttendance = useMutation({
    mutationFn: deleteSessionAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  return {
    sessions,
    session,
    add,
    update,
    del,
    markAttendance,
    updateAttendance,
    deleteAttendance,
  };
};
