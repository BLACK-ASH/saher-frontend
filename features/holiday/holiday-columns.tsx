"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";

import { HolidayT } from "@/services/holiday.api";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const holidayTypeVariant: Record<
  HolidayT["type"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  national: "default",
  organizational: "secondary",
  optional: "outline",
  other: "secondary",
  google: "outline",
  "public-holiday": "destructive",
};

type HolidayColumnsProps = {
  onView: (holiday: HolidayT) => void;
  onEdit: (holiday: HolidayT) => void;
  onDelete: (holiday: HolidayT) => void;
};

export const holidayColumns = ({
  onView,
  onEdit,
  onDelete,
}: HolidayColumnsProps): ColumnDef<HolidayT>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Title
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },

  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => format(new Date(row.original.date), "dd MMM yyyy"),
  },

  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant={holidayTypeVariant[row.original.type]}>
        {row.original.type}
      </Badge>
    ),
    filterFn: "equals",
  },

  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <p className="max-w-xs truncate text-muted-foreground">
        {row.original.description || "-"}
      </p>
    ),
  },

  {
    id: "actions",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => {
      const holiday = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(holiday)}>
              View
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onEdit(holiday)}>
              Edit
            </DropdownMenuItem>

            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(holiday)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
