import {
  getAttendanceCorrectionAll,
  getAttendanceCorrectionById,
  handleAttendanceCorrection,
} from "@/services/attendance-correction.api";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";

type useAttendanceCorrectionProps = {
  correctionId?: string;
  sort?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export const useAdminAttendanceCorrection = ({
  correctionId,
  sort = "desc",
  page = 1,
  limit = 10,
}: useAttendanceCorrectionProps) => {
  const queryClient = useQueryClient();

  const correction = useQuery({
    queryKey: ["attendance", "correction", correctionId],
    queryFn: () => getAttendanceCorrectionById(correctionId as string),
  });

  const allCorrections = useQuery({
    queryKey: ["attendance", "correction", limit, page, sort],
    queryFn: () => getAttendanceCorrectionAll({ page, limit, sort }),
  });

  const handleCorrection = useMutation({
    mutationFn: handleAttendanceCorrection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "correction"] });
      queryClient.invalidateQueries({
        queryKey: ["attendance", "correction", correctionId],
      });
    },
  });

  return {
    correction,
    allCorrections,
    handleCorrection,
  };
};
