"use client";

import { HolidayT } from "@/services/holiday.api";
import { useHoliday } from "@/hooks/use-holiday";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holiday: HolidayT | null;
};

export function DeleteHolidayDialog({ open, onOpenChange, holiday }: Props) {
  const { removeHoliday } = useHoliday();

  const handleDelete = () => {
    if (!holiday) return;

    removeHoliday.mutate(holiday.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Holiday</AlertDialogTitle>

          <AlertDialogDescription>
            Are you sure you want to delete <strong>{holiday?.title}</strong>?
            <br />
            <br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>

          <AlertDialogAction
            onClick={handleDelete}
            disabled={removeHoliday.isPending}
          >
            {removeHoliday.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
