"use client";
import { UserT } from "@/hooks/use-me";
import { apiFetch } from "@/lib/api-wrapper";
import { useQuery } from "@tanstack/react-query";
import { columns } from "./column";
import { DataTable } from "./data-table";

const UserTable = () => {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await apiFetch<UserT[]>(`/api/admin/users?fields=isActive`);
      return res.data;
    },
    staleTime: 1000 * 60 * 60,
  });

  console.log(users);

  return (
    <div className="container mx-auto p-2 py-10">
      <DataTable columns={columns} data={users} />
    </div>
  );
};

export default UserTable;
