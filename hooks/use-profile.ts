import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserT } from "./use-me";
import { apiFetch } from "@/lib/api-wrapper";
import { toast } from "sonner";
import { getSessions, revokeSession } from "@/services/auth.api";

export type BankT = {
  readonly accountHolderName: string;
  readonly bankName: string;
  readonly accountNumber: string;
  readonly ifcs: string;
  readonly branch: string;
  readonly mobileNumber: string;
  readonly id: string;
};

export type KYCDoc = {
  id: string;
  alt: string;
  src: string;
};

export type AccountT = {
  readonly gender: "male" | "female" | "other";
  readonly dateOfBirth: Date;
  readonly dateOfJoining: Date;
  readonly phoneNumber: string;
  readonly secondaryPhoneNumber?: string | undefined;
  readonly employeeId: string;
  readonly department: string;
  readonly designation: string;
  readonly employeeType: "free" | "intern" | "full-time" | "part-time" | "volunteer";
  readonly salaryStructure: string;
  readonly address: string;
  readonly id: string;
  readonly user: UserT;
  readonly bank: BankT | null;
  readonly employeeShift?: "shift-1" | "shift-2" | undefined;
  readonly aadhar: KYCDoc | null | undefined;
  readonly pan: KYCDoc | null | undefined;
  readonly resume: KYCDoc | null | undefined;
};

export const useProfile = () => {
  const queryClient = useQueryClient();

  const profile = useQuery({
    queryKey: ["user", "profile", "me"],
    queryFn: async () => {
      const res = await apiFetch<AccountT>(`/api/user`);
      return res.data;
    },
    retry: 3,
    staleTime: 1000 * 60,
  });

  const sessions = useQuery({
    queryKey: ["user", "sessions"],
    queryFn: getSessions,
    retry: 3,
    refetchOnWindowFocus: true,
  });

  const revokeSessionMutation = useMutation({
    mutationFn: revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "sessions"] });
      toast.success("Session revoked successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    profile,
    sessions,
    revokeSession: revokeSessionMutation,
  };
};