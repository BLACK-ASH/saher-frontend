import {
  addParticipant,
  deleteParticipant,
  getParticipants,
  getSingleParticipant,
  restoreParticipant,
  updateParticipant,
} from "@/services/participant.api";
import { QueryProps } from "@/services/program.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createResourceListHook } from "./resource-list-factory";

const useParticipantBase = createResourceListHook({
  baseKey: ["participants"],
  list: getParticipants,
  get: getSingleParticipant,
  mutations: {
    add: addParticipant as (args: unknown) => Promise<unknown>,
    update: updateParticipant as (args: unknown) => Promise<unknown>,
    del: deleteParticipant as (args: unknown) => Promise<unknown>,
  },
});

type Props = { id?: string } & QueryProps;

export const useParticipants = ({
  keyword = "",
  limit = 10,
  page = 1,
  isDeleted = "false",
  id,
}: Props) => {
  const queryClient = useQueryClient();
  const { list, detail, add, update, del } = useParticipantBase({
    id,
    keyword,
    page,
    limit,
    isDeleted,
  });

  const restore = useMutation({
    mutationFn: restoreParticipant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants"] });
    },
  });

  return {
    participants: list,
    participant: detail,
    add,
    update,
    del,
    restore,
  };
};
