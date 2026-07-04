import {
  addProgram,
  deleteProgram,
  getPrograms,
  QueryProps,
  updateProgram,
} from "@/services/program.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Props = {} & QueryProps;

export const usePrograms = ({ keyword = "", limit = 10, page = 1 }: Props) => {
  const queryClient = useQueryClient();

  const programs = useQuery({
    queryKey: ["programs", keyword, page, limit],
    queryFn: () => getPrograms({ keyword, page, limit }),
  });

  const add = useMutation({
    mutationFn: addProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });

  const update = useMutation({
    mutationFn: updateProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });

  const del = useMutation({
    mutationFn: deleteProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });

  return {
    programs,
    add,
    update,
    del,
  };
};
