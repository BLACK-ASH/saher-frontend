"use client";

import { useMemo, useState } from "react";

import { HolidayT } from "@/services/holiday.api";
import { useHoliday } from "@/hooks/use-holiday";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/data-table";

import { holidayColumns } from "./holiday-columns";
import { HolidayFormDialog } from "./holiday-form-dialog";
import { DeleteHolidayDialog } from "./delete-holiday-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HolidayTable() {
  const { holidays } = useHoliday();

  const { data = [], isLoading } = holidays;

  const [selectedHoliday, setSelectedHoliday] = useState<HolidayT | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const columns = useMemo(
    () =>
      holidayColumns({
        onView: (holiday) => {
          setSelectedHoliday(holiday);
          setFormOpen(true);
        },

        onEdit: (holiday) => {
          setSelectedHoliday(holiday);
          setFormOpen(true);
        },

        onDelete: (holiday) => {
          setSelectedHoliday(holiday);
          setDeleteOpen(true);
        },
      }),
    [],
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Manage Holidays</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={data}
          searchKey="title"
          searchPlaceholder="Search holidays..."
          toolbar={
            <Button
              variant={"outline"}
              onClick={() => {
                setSelectedHoliday(null);
                setFormOpen(true);
              }}
            >
              Add Holiday
            </Button>
          }
        />

        <HolidayFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          holiday={selectedHoliday}
        />

        <DeleteHolidayDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          holiday={selectedHoliday}
        />
      </CardContent>
    </Card>
  );
}
