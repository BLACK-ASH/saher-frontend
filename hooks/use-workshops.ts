import { QueryProps } from "@/services/program.api";
import {
  addWorkshops,
  deleteWorkshops,
  getWorkshops,
  updateWorkshops,
} from "@/services/workshop.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Props = {} & QueryProps;

export const useWorkshops = ({ keyword, page, limit }: Props) => {
  const queryClient = useQueryClient();

  const workshops = useQuery({
    queryKey: ["workshops", keyword, page, limit],
    queryFn: () => getWorkshops({ keyword, page, limit }),
  });

  const add = useMutation({
    mutationFn: addWorkshops,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
    },
  });

  const update = useMutation({
    mutationFn: updateWorkshops,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
    },
  });

  const del = useMutation({
    mutationFn: deleteWorkshops,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
    },
  });

  return {
    workshops,
    add,
    update,
    del,
  };
};
