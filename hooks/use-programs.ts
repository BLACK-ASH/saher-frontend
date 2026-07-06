import {
  addParticipantsInProgram,
  addProgram,
  deleteProgram,
  getParticipantFromProgram,
  getPrograms,
  getSingleProgram,
  QueryProps,
  removeParticipantFromProgram,
  updateProgram,
} from "@/services/program.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Props = { id?: string } & QueryProps;

export const usePrograms = ({
  id,
  keyword = "",
  limit = 10,
  page = 1,
}: Props) => {
  const queryClient = useQueryClient();

  const programs = useQuery({
    queryKey: ["programs", keyword, page, limit],
    queryFn: () => getPrograms({ keyword, page, limit }),
  });

  const program = useQuery({
    queryKey: ["programs", id],
    queryFn: () => getSingleProgram(id as string),
    enabled: !!id,
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

  const participants = useQuery({
    queryKey: ["programs", "participants", id],
    queryFn: () => getParticipantFromProgram(id as string),
    enabled: !!id,
  });

  const addParticipants = useMutation({
    mutationFn: addParticipantsInProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });

  const removeParticipant = useMutation({
    mutationFn: removeParticipantFromProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });

  return {
    programs,
    program,
    add,
    update,
    del,
    participants,
    addParticipants,
    removeParticipant,
  };
};
