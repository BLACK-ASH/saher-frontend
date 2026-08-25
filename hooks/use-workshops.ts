import { QueryProps } from "@/services/program.api";
import {
  addWorkshops,
  deleteWorkshops,
  getSingleWorkshop,
  getWorkshops,
  updateWorkshops,
} from "@/services/workshop.api";
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
  const { list, detail, add, update, del } = useWorkshopBase({
    id,
    keyword,
    page,
    limit,
  });

  return {
    workshops: list,
    workshop: detail,
    add,
    update,
    del,
  };
};
