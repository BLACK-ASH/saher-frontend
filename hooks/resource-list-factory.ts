import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NormalizedList } from "@/lib/normalize-list";

type QueryProps = {
  keyword?: string;
  limit?: number;
  page?: number;
};

type ServiceFn<T = unknown> = (args: T) => Promise<unknown>;

type ResourceListConfig<T> = {
  baseKey: readonly unknown[];
  list: (params: QueryProps) => Promise<NormalizedList<T>>;
  get?: (id: string) => Promise<T>;
  mutations?: {
    add?: ServiceFn;
    update?: ServiceFn;
    del?: ServiceFn;
  };
};

export function createResourceListHook<T>(config: ResourceListConfig<T>) {
  return ({
    id,
    ...queryParams
  }: { id?: string } & QueryProps) => {
    const queryClient = useQueryClient();

    const list = useQuery({
      queryKey: [...config.baseKey, queryParams.keyword, queryParams.page, queryParams.limit],
      queryFn: () => config.list(queryParams),
    });

    const detail = useQuery({
      queryKey: [...config.baseKey, id],
      queryFn: () => config.get!(id as string),
      enabled: !!id && !!config.get,
    });

    const noop = () => Promise.resolve();

    const add = useMutation({
      mutationFn: (config.mutations?.add ?? noop) as (args: unknown) => Promise<unknown>,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: config.baseKey });
      },
    });

    const update = useMutation({
      mutationFn: (config.mutations?.update ?? noop) as (args: unknown) => Promise<unknown>,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: config.baseKey });
      },
    });

    const del = useMutation({
      mutationFn: (config.mutations?.del ?? noop) as (args: unknown) => Promise<unknown>,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: config.baseKey });
      },
    });

    return { list, detail, add, update, del };
  };
}
