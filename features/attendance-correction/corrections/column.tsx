"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { attendanceCorrectionStatusVariant } from "@/features/attendance/attendance-correction-requests";
import { imageUrl } from "@/lib/image-url";
import { formatDate } from "@/lib/utils/time";
import { AttendanceCorrectionResponse } from "@/services/attendance-correction.api";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import AttendanceCorrectionView from "../attendance-correction-view";

export const attendanceCorrectionColumns: ColumnDef<AttendanceCorrectionResponse>[] =
  [
    {
      accessorKey: "user",
      header: () => <div>Profile</div>,
      cell: ({ row }) => {
        const correction = row.original;

        return (
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage
              src={imageUrl(correction?.user.image?.src)}
              alt={correction?.user.name}
            />
            <AvatarFallback className="rounded-lg">
              {correction?.user.name}
            </AvatarFallback>
          </Avatar>
        );
      },
    },
    {
      id: "name",
      accessorFn: (row) => row.user.name,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      id: "role",
      accessorFn: (row) => row.user.role,
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Role
        </Button>
      ),
      cell: ({ row }) => {
        const role = row.getValue<string>("role");
        return <p>{role.toUpperCase()}</p>;
      },
    },
    {
      id: "date",
      accessorFn: (row) => row.attendance.date,
      header: () => <div>Day</div>,
      cell: ({ row }) => {
        return <p>{formatDate(row.getValue("date"))}</p>;
      },
    },
    {
      accessorKey: "status",
      header: () => <div>Status</div>,
      cell: ({ row }) => {
        const status = row.getValue<"pending" | "approve" | "reject">("status");

        return (
          <Badge variant={attendanceCorrectionStatusVariant[status]}>
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const correction = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <AttendanceCorrectionView correction={correction} />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
