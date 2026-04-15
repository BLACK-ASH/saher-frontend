import { getAttendanceCorrectionAll, getAttendanceCorrectionById, handleAttendanceCorrection } from "@/services/attendance-correction.api";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";

type useAttendanceCorrectionProps = {
  correctionId?: string
}

export const useAdminAttendanceCorrection = ({ correctionId }: useAttendanceCorrectionProps = {}) => {
  const queryClient = useQueryClient();

  const correction = useQuery({
    queryKey: ["attendance", "correction", correctionId],
    queryFn: () => getAttendanceCorrectionById(correctionId as string)
  })

  const allCorrections = useQuery({
    queryKey: ["attendance", "correction"],
    queryFn: getAttendanceCorrectionAll
  })

  const handleCorrection = useMutation({
    mutationFn:handleAttendanceCorrection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "correction", correctionId] });
    },
  });

  return {
    correction,
    allCorrections,
    handleCorrection,
  };
};
