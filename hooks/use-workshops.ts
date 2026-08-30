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

// Workshops belong to programs — mutations must invalidate both.
const invalidateWorkshopAndProgram = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ["workshops"] });
  queryClient.invalidateQueries({ queryKey: ["programs"] });
};

type Props = { id?: string } & QueryProps;

export const useWorkshops = ({ id, keyword, page, limit }: Props) => {
  const queryClient = useQueryClient();
  const base = useWorkshopBase({ id, keyword, page, limit });

  // Wrap base mutations to also invalidate programs
  const add = useMutation({
    mutationFn: (vars: unknown) => base.add.mutateAsync(vars),
    onSuccess: () => invalidateWorkshopAndProgram(queryClient),
  });
  const update = useMutation({
    mutationFn: (vars: unknown) => base.update.mutateAsync(vars),
    onSuccess: () => invalidateWorkshopAndProgram(queryClient),
  });
  const del = useMutation({
    mutationFn: (vars: unknown) => base.del.mutateAsync(vars),
    onSuccess: () => invalidateWorkshopAndProgram(queryClient),
  });

  const restore = useMutation({
    mutationFn: restoreWorkshop,
    onSuccess: () => invalidateWorkshopAndProgram(queryClient),
  });

  return {
    workshops: base.list,
    workshop: base.detail,
    add,
    update,
    del,
    restore,
  };
};
