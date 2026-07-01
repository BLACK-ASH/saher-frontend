import {
  addWorkshops,
  deleteWorkshops,
  getWorkshops,
  updateWorkshops,
} from "@/services/workshop.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useWorkshops = () => {
  const queryClient = useQueryClient();

  const workshops = useQuery({
    queryKey: ["workshops"],
    queryFn: getWorkshops,
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
