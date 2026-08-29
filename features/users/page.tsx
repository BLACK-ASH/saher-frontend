"use client";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getAdminUsers } from "@/services/admin.api";
import { UserT } from "@/hooks/use-me";
import { columns } from "./column";
import { UserDataTable } from "./data-table";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import RoleAccess from "@/components/role-access";
import { can } from "@/lib/permissions";

const UserTable = () => {
  const router = useRouter();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["user", "list"],
    queryFn: getAdminUsers,
    staleTime: 1000 * 60,
  });

  if (isLoading) return <DefaultLoader />;
  // getAdminUsers mirrors the backend user row; the table columns are typed for
  // the canonical UserT. The two differ only in image nullability (backend can
  // send null for self-registered users — handled by optional chaining in the
  // columns), so reconcile at this boundary.
  const users = (data?.items ?? []) as unknown as UserT[];
  if (users.length === 0) return <NoData title="No User To Show" description="" />;

  return (
    <div>
      <div className="flex items-center justify-end p-4">
        <RoleAccess
          allow={(r) => can(r, "write", "account")}
          fallback={null}
        >
          <Button onClick={() => router.push("/register")} className="flex gap-2">
            <UserPlus className="h-4 w-4" />
            Create Employee
          </Button>
        </RoleAccess>
      </div>
      <UserDataTable columns={columns} data={users} refetch={refetch} />
    </div>
  );
};

export default UserTable;
