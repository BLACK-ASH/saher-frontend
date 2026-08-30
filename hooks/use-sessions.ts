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

// Sessions belong to workshops which belong to programs — mutations must invalidate all three.
const invalidateSessionHierarchy = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ["sessions"] });
  queryClient.invalidateQueries({ queryKey: ["workshops"] });
  queryClient.invalidateQueries({ queryKey: ["programs"] });
};

type Props = { id?: string } & QueryProps;

export const useSessions = ({ id, keyword, limit, page }: Props) => {
  const queryClient = useQueryClient();
  const base = useSessionBase({ id, keyword, page, limit });

  // Wrap base mutations to also invalidate workshops and programs
  const add = useMutation({
    mutationFn: (vars: unknown) => base.add.mutateAsync(vars),
    onSuccess: () => invalidateSessionHierarchy(queryClient),
  });
  const update = useMutation({
    mutationFn: (vars: unknown) => base.update.mutateAsync(vars),
    onSuccess: () => invalidateSessionHierarchy(queryClient),
  });
  const del = useMutation({
    mutationFn: (vars: unknown) => base.del.mutateAsync(vars),
    onSuccess: () => invalidateSessionHierarchy(queryClient),
  });

  const markAttendance = useMutation({
    mutationFn: markSessionAttendance,
    onSuccess: () => invalidateSessionHierarchy(queryClient),
  });

  const updateAttendance = useMutation({
    mutationFn: updateSessionAttendance,
    onSuccess: () => invalidateSessionHierarchy(queryClient),
  });

  const deleteAttendance = useMutation({
    mutationFn: deleteSessionAttendance,
    onSuccess: () => invalidateSessionHierarchy(queryClient),
  });

  const restore = useMutation({
    mutationFn: restoreSession,
    onSuccess: () => invalidateSessionHierarchy(queryClient),
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
    sessions: base.list,
    session: base.detail,
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
