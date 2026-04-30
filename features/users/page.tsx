"use client";
import { UserT } from "@/hooks/use-me";
import { apiFetch } from "@/lib/api-wrapper";
import { useQuery } from "@tanstack/react-query";
import { columns } from "./column";
import { UserDataTable } from "./data-table";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";

const UserTable = () => {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await apiFetch<UserT[]>(`/api/admin/users?fields=isActive`);
      return res.data;
    },
    staleTime: 1000 * 60 * 60,
  });

  if (isLoading) return <DefaultLoader />;
  if (!users) return <NoData title="No User To Show" description="" />;
  return <UserDataTable columns={columns} data={users} />;
};

export default UserTable;
