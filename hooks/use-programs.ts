import {
  addProgram,
  deleteProgram,
  getPrograms,
  updateProgram,
} from "@/services/program.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const usePrograms = () => {
  const queryClient = useQueryClient();

  const programs = useQuery({
    queryKey: ["programs"],
    queryFn: getPrograms,
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
