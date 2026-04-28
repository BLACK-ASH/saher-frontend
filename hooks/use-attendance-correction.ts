import {
  getAttendanceCorrection,
  submitAttendanceCorrection,
} from "@/services/attendance-correction.api";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";

type useAttendanceCorrectionProps = {
  sort?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export const useAttendanceCorrection = ({
  sort = "desc",
  page = 1,
  limit = 10,
}: useAttendanceCorrectionProps = {}) => {
  const queryClient = useQueryClient();

  const allCorrections = useQuery({
    queryKey: ["attendance", "correction"],
    queryFn: () => getAttendanceCorrection({ sort, page, limit }),
  });

  const submitCorrection = useMutation({
    mutationFn: submitAttendanceCorrection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "correction"] });
    },
  });

  return {
    allCorrections,
    submitCorrection,
  };
};
