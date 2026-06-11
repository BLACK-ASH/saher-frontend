"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserT } from "@/hooks/use-me";
import { apiFetch } from "@/lib/api-wrapper";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArchiveRestore, MoreHorizontal, Trash } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function UserActions({ user }: { user: UserT }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const deleteUser = useMutation({
    mutationFn: async () => {
      return apiFetch(`/api/admin/user/${user.id}`, {
        method: "DELETE",
      });
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({
        queryKey: ["user", "list"],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const restoreUser = useMutation({
    mutationFn: async () => {
      return apiFetch(`/api/admin/user/${user.id}/restore`, {
        method: "PATCH",
      });
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({
        queryKey: ["user", "list"],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(user.email)}
        >
          Copy Email ID
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push("/users/" + user.id)}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {user.isActive ? (
          <DropdownMenuItem
            disabled={deleteUser.isPending}
            className="flex items-center gap-2 text-destructive"
            onClick={() => deleteUser.mutate()}
          >
            <Trash className="h-4 w-4" />
            {deleteUser.isPending ? "Deleting..." : "Delete"}
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem
              disabled={deleteUser.isPending}
              className="flex items-center gap-2 text-destructive"
              onClick={() => deleteUser.mutate()}
            >
              <Trash className="h-4 w-4" />
              {deleteUser.isPending ? "Deleting..." : "Delete Permanently"}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={restoreUser.isPending}
              className="flex items-center gap-2 text-shadow-green-400"
              onClick={() => restoreUser.mutate()}
            >
              <ArchiveRestore />
              {restoreUser.isPending ? "Restoring..." : "Restore"}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
