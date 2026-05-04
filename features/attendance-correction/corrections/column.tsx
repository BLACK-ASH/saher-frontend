"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { attendanceCorrectionStatusVariant } from "@/features/attendance/attendance-correction-requests";
import { imageUrl } from "@/lib/image-url";
import { formatDate, formatTime } from "@/lib/utils/time";
import { AttendanceCorrectionResponse } from "@/services/attendance-correction.api";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowRight, ArrowUpDown } from "lucide-react";
import AttendanceCorrectionView from "../attendance-correction-view";

export const attendanceCorrectionColumns: ColumnDef<AttendanceCorrectionResponse>[] =
  [
    {
      accessorKey: "user",
      header: () => <div>User</div>,
      cell: ({ row }) => {
        const correction = row.original;

        return (
          <div className="flex gap-3 items-center max-w-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage
                src={imageUrl(correction?.user.image?.src)}
                alt={correction?.user.name}
              />
              <AvatarFallback className="rounded-lg">
                {correction?.user.name}
              </AvatarFallback>
            </Avatar>
            <div>
              <p>{correction.user.name}</p>
              <p className="text-muted-foreground text-xs">
                {correction.user.email}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: "name",
      accessorFn: (row) => row.user.displayName,
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
      id: "date",
      accessorFn: (row) => row.attendance.date,
      header: () => <div>Day</div>,
      cell: ({ row }) => {
        return <p>{formatDate(row.getValue("date"))}</p>;
      },
    },
    {
      id: "check-in",
      accessorFn: (row) => row.changes,
      header: () => <div>Check In</div>,
      cell: ({ row }) => {
        const changes = row.original.changes;
        const previous = row.original.previous;

        return (
          <div className="flex gap-1 items-center text-muted-foreground">
            <p>{formatTime(previous.inTime)}</p>
            <ArrowRight className="size-4" />
            <p className="text-foreground">{formatTime(changes.inTime)}</p>
          </div>
        );
      },
    },
    {
      id: "check-out",
      accessorFn: (row) => row.changes,
      header: () => <div>Check Out</div>,
      cell: ({ row }) => {
        const changes = row.original.changes;
        const previous = row.original.previous;

        return (
          <div className="flex gap-1 items-center text-muted-foreground">
            <p>{formatTime(previous.outTime)}</p>
            <ArrowRight className="size-4" />
            <p className="text-foreground">{formatTime(changes.outTime)}</p>
          </div>
        );
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

        return <AttendanceCorrectionView correction={correction} />;
      },
    },
  ];
