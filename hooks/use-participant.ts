import {
  addParticipant,
  deleteParticipant,
  getParticipants,
  getSingleParticipant,
  updateParticipant,
} from "@/services/participant.api";
import { QueryProps } from "@/services/program.api";
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
  id,
}: Props) => {
  const { list, detail, add, update, del } = useParticipantBase({
    id,
    keyword,
    page,
    limit,
  });

  return {
    participants: list,
    participant: detail,
    add,
    update,
    del,
  };
};
