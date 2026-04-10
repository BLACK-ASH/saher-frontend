import { AttendanceCorrectionType } from "@/features/attendance/attendance-correction";
import { apiFetch } from "@/lib/api-wrapper";
import { getAttendanceById } from "@/services/attendance-correction.api";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";

export const useAttendanceCorrection = (id: string) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["attendance", id],
    queryFn: () => getAttendanceById(id),
    enabled: !!id, // ✅ good practice
  });

  const submitCorrection = useMutation({
    mutationFn: async (payload: AttendanceCorrectionType & { date: string | Date }) => {
      return await apiFetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/attendance/attendance-correction`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", id] });
    },
  });

  return {
    attendance: data,
    isLoading,
    submitCorrection,
  };
};
