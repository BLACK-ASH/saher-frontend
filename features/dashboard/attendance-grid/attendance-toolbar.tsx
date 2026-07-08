"use client";

import { Dispatch, SetStateAction } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type AttendanceToolbarProps = {
  startDate: string;
  endDate: string;

  setStartDate: Dispatch<SetStateAction<string>>;
  setEndDate: Dispatch<SetStateAction<string>>;

  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;

  onRefresh: () => void;
  refreshing: boolean;
};

export default function AttendanceToolbar({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  onPrevious,
  onNext,
  onToday,
  onRefresh,
  refreshing,
}: AttendanceToolbarProps) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <CalendarDays className="h-6 w-6" />
            Attendance Dashboard
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            View employee attendance within a selected date range.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <Field>
            <FieldLabel htmlFor="start-date">Start Date</FieldLabel>

            <Input
              id="start-date"
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="end-date">End Date</FieldLabel>

            <Input
              id="end-date"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Field>

          <Button type="button" variant="outline" onClick={onPrevious}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <Button type="button" variant="outline" onClick={onToday}>
            Today
          </Button>

          <Button type="button" variant="outline" onClick={onNext}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <Button type="button" onClick={onRefresh} disabled={refreshing}>
            <RotateCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>
    </div>
  );
}
