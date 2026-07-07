import {
  addHoliday,
  deleteHoliday,
  getHoliday,
  getHolidays,
  HolidayPayload,
  updateHoliday,
} from "@/services/holiday.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useHoliday = ({ id }: { id?: string } = {}) => {
  const queryClient = useQueryClient();

  const holidays = useQuery({
    queryKey: ["holidays"],
    queryFn: getHolidays,
  });

  const holiday = useQuery({
    queryKey: ["holiday", id],
    queryFn: () => getHoliday(id!),
    enabled: !!id,
  });

  const createHoliday = useMutation({
    mutationFn: addHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["holidays"],
      });
      queryClient.invalidateQueries({
        queryKey: ["calendar"],
      });
    },
  });

  const editHoliday = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HolidayPayload> }) =>
      updateHoliday(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["holidays"],
      });

      queryClient.invalidateQueries({
        queryKey: ["holiday", variables.id],
      });

      queryClient.invalidateQueries({
        queryKey: ["calendar"],
      });
    },
  });

  const removeHoliday = useMutation({
    mutationFn: deleteHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["holidays"],
      });

      queryClient.invalidateQueries({
        queryKey: ["calendar"],
      });
    },
  });

  return {
    holidays,
    holiday,
    createHoliday,
    editHoliday,
    removeHoliday,
  };
};
