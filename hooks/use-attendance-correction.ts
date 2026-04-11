import { getAttendanceCorrection, submitAttendanceCorrection } from "@/services/attendance-correction.api";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";

type useAttendanceCorrectionProps = {
  attendanceId?: string
}

export const useAttendanceCorrection = ({ attendanceId }: useAttendanceCorrectionProps = {}) => {
  const queryClient = useQueryClient();

  const allCorrections = useQuery({
    queryKey: ["attendance", "correction"],
    queryFn: getAttendanceCorrection
  })

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
