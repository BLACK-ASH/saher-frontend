import {
  addParticipantsInProgram,
  addProgram,
  deleteProgram,
  getParticipantFromProgram,
  getPrograms,
  getSingleProgram,
  QueryProps,
  removeParticipantFromProgram,
  restoreProgram,
  updateProgram,
} from "@/services/program.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createResourceListHook } from "./resource-list-factory";

const useProgramBase = createResourceListHook({
  baseKey: ["programs"],
  list: getPrograms,
  get: getSingleProgram,
  mutations: {
    add: addProgram as (args: unknown) => Promise<unknown>,
    update: updateProgram as (args: unknown) => Promise<unknown>,
    del: deleteProgram as (args: unknown) => Promise<unknown>,
  },
});

type Props = { id?: string } & QueryProps;

export const usePrograms = ({
  id,
  keyword = "",
  limit = 10,
  page = 1,
}: Props) => {
  const queryClient = useQueryClient();
  const { list, detail, add, update, del } = useProgramBase({
    id,
    keyword,
    page,
    limit,
  });

  const participants = useQuery({
    queryKey: ["programs", "participants", id],
    queryFn: () => getParticipantFromProgram(id as string),
    enabled: !!id,
  });

  const addParticipants = useMutation({
    mutationFn: addParticipantsInProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });

  const removeParticipant = useMutation({
    mutationFn: removeParticipantFromProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });

  const restore = useMutation({
    mutationFn: restoreProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });

  return {
    programs: list,
    program: detail,
    add,
    update,
    del,
    restore,
    participants,
    addParticipants,
    removeParticipant,
  };
};
