"use client";
import { useRouter } from "next/navigation";
import { useAdminUsers } from "@/hooks/use-admin";
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
  const { list } = useAdminUsers();
  const { data, isLoading, refetch } = list;

  if (isLoading) return <DefaultLoader />;
  // getAdminUsers returns AdminUserResponse[] which has extra fields (deletedAt,
  // bannedAt, pushNotificationsEnabled). Columns are typed for UserT which is a
  // subset. Cast at boundary since accessors only use common fields.
  const users = (data?.items ?? []) as UserT[];
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
