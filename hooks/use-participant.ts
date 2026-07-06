import {
  addParticipant,
  deleteParticipant,
  getParticipants,
  getSingleParticipant,
  updateParticipant,
} from "@/services/participant.api";
import { QueryProps } from "@/services/program.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Props = { id?: string } & QueryProps;

export const useParticipants = ({
  keyword = "",
  limit = 10,
  page = 1,
  id,
}: Props) => {
  const queryClient = useQueryClient();

  const participants = useQuery({
    queryKey: ["participants", keyword, page, limit],
    queryFn: () => getParticipants({ keyword, page, limit }),
  });

  const participant = useQuery({
    queryKey: ["participants", id],
    queryFn: () => getSingleParticipant(id as string),
    enabled: !!id,
  });

  const add = useMutation({
    mutationFn: addParticipant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants"] });
    },
  });

  const update = useMutation({
    mutationFn: updateParticipant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants"] });
    },
  });

  const del = useMutation({
    mutationFn: deleteParticipant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants"] });
    },
  });

  return {
    participant,
    participants,
    add,
    update,
    del,
  };
};
