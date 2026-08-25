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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createResourceListHook } from "./resource-list-factory";

const useSessionBase = createResourceListHook({
  baseKey: ["sessions"],
  list: getSessions,
  get: getSingleSession,
  mutations: {
    add: addSession as (args: unknown) => Promise<unknown>,
    update: updateSession as (args: unknown) => Promise<unknown>,
    del: deleteSession as (args: unknown) => Promise<unknown>,
  },
});

type Props = { id?: string } & QueryProps;

export const useSessions = ({ id, keyword, limit, page }: Props) => {
  const queryClient = useQueryClient();
  const { list, detail, add, update, del } = useSessionBase({
    id,
    keyword,
    page,
    limit,
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
    sessions: list,
    session: detail,
    add,
    update,
    del,
    markAttendance,
    updateAttendance,
    deleteAttendance,
  };
};
