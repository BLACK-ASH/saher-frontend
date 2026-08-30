import { QueryProps } from "@/services/program.api";
import {
  addSession,
  deleteSession,
  deleteSessionAttendance,
  getSessions,
  getSingleSession,
  markSessionAttendance,
  requestSessionExport,
  restoreSession,
  sendSessionReminder,
  updateSession,
  updateSessionAttendance,
} from "@/services/session.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

  const restore = useMutation({
    mutationFn: restoreSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  // Reminder/export touch only this session's detail (and land as notifications
  // under their own ["notification"] key) — invalidate ["sessions", id] ONLY.
  // Do NOT invalidate ["sessions"]: no list data changes here.
  const sendReminder = useMutation({
    mutationFn: sendSessionReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", id] });
      toast.success("Reminder sent to speakers");
    },
  });

  const requestExport = useMutation({
    mutationFn: requestSessionExport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", id] });
      toast.success("Report generating — check notifications");
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
    restore,
    sendReminder,
    requestExport,
  };
};
