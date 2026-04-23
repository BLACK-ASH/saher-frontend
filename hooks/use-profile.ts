import { useQuery } from "@tanstack/react-query";
import { UserT } from "./use-me";
import { apiFetch } from "@/lib/api-wrapper";

export type BankT = {
  readonly accountHolderName: string;
  readonly bankName: string;
  readonly accountNumber: string;
  readonly ifcs: string;
  readonly branch: string;
  readonly mobileNumber: string;
  readonly id: string;
};

export type AccountT = {
  readonly gender: "male" | "female" | "other";
  readonly dateOfBirth: Date;
  readonly dateOfJoining: Date;
  readonly phoneNumber: string;
  readonly employeeId: string;
  readonly department: string;
  readonly designation: string;
  readonly employeeType: "full-time" | "part-time" | "volunteer";
  readonly salaryStructure: string;
  readonly address: string;
  readonly id: string;
  readonly user: UserT;
  readonly bank: BankT;
  readonly employeeShift?: "shift-1" | "shift-2" | undefined;
};

export const useProfile = ({ userId }: { userId?: string }) => {
  return useQuery({
    queryKey: ["user", "profile", "me"],
    queryFn: async () => {
      const res = await apiFetch<AccountT>(`/api/user`);
      return res.data;
    },
    retry: 3,
    staleTime: 1000 * 60,
  });
};
