"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { HolidayT } from "@/services/holiday.api";

import { Button } from "@/components/ui/button";

import { HolidayFormDialog } from "./holiday-form-dialog";
import { DeleteHolidayDialog } from "./delete-holiday-dialog";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type Props = {
  holiday: HolidayT;
};

export function HolidayActions({ holiday }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <HolidayFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        holiday={holiday}
      />

      <DeleteHolidayDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        holiday={holiday}
      />
    </>
  );
}
