import { QueryProps } from "@/services/program.api";
import {
  addWorkshops,
  deleteWorkshops,
  getSingleWorkshop,
  getWorkshops,
  restoreWorkshop,
  updateWorkshops,
} from "@/services/workshop.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createResourceListHook } from "./resource-list-factory";

const useWorkshopBase = createResourceListHook({
  baseKey: ["workshops"],
  list: getWorkshops,
  get: getSingleWorkshop,
  mutations: {
    add: addWorkshops as (args: unknown) => Promise<unknown>,
    update: updateWorkshops as (args: unknown) => Promise<unknown>,
    del: deleteWorkshops as (args: unknown) => Promise<unknown>,
  },
});

type Props = { id?: string } & QueryProps;

export const useWorkshops = ({ id, keyword, page, limit }: Props) => {
  const queryClient = useQueryClient();
  const { list, detail, add, update, del } = useWorkshopBase({
    id,
    keyword,
    page,
    limit,
  });

  const restore = useMutation({
    mutationFn: restoreWorkshop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
    },
  });

  return {
    workshops: list,
    workshop: detail,
    add,
    update,
    del,
    restore,
  };
};
