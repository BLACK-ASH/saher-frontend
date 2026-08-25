"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getRangeAttendance } from "@/services/attendance.api";

import AttendanceToolbar from "./attendance-toolbar";
import AttendanceSummary from "./attendance-summary";
import { AttendanceRow } from "./types";
import AttendanceTable from "./attendance-table";
import { PaginationFooter } from "@/components/pagination-footer";

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getDatesBetween(start: string, end: string) {
  const dates: string[] = [];

  const current = new Date(start);
  const last = new Date(end);

  while (current <= last) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export default function AttendanceDashboard() {
  const today = new Date();

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [sort] = useState<"asc" | "desc">("desc");

  const [startDate, setStartDate] = useState(formatDate(addDays(today, -6)));

  const [endDate, setEndDate] = useState(formatDate(today));

  const attendance = useQuery({
    queryKey: ["attendance", startDate, endDate, page, limit, sort],
    queryFn: () =>
      getRangeAttendance({
        startDate,
        endDate,
        page,
        limit,
        sort,
      }),
  });

  const dates = useMemo(
    () => getDatesBetween(startDate, endDate),
    [startDate, endDate],
  );

  const grouped = useMemo<AttendanceRow[]>(() => {
    if (!attendance.data?.items) return [];

    const map = new Map<string, AttendanceRow>();

    attendance.data.items.forEach((record) => {
      if (!map.has(record.user.id)) {
        map.set(record.user.id, {
          user: record.user,
          attendance: {},
        });
      }

      map.get(record.user.id)!.attendance[record.date] = record;
    });

    return [...map.values()];
  }, [attendance.data]);

  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let halfDay = 0;
    let late = 0;

    attendance.data?.items.forEach((record) => {
      switch (record.status) {
        case "present":
          present++;
          break;

        case "absent":
          absent++;
          break;

        case "half-day":
          halfDay++;
          break;
      }

      if (record.isLate) {
        late++;
      }
    });

    return {
      present,
      absent,
      halfDay,
      late,
    };
  }, [attendance.data]);

  const previousRange = () => {
    const diff =
      Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
          86400000,
      ) + 1;

    setStartDate(formatDate(addDays(new Date(startDate), -diff)));

    setEndDate(formatDate(addDays(new Date(endDate), -diff)));
  };

  const nextRange = () => {
    const diff =
      Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
          86400000,
      ) + 1;

    setStartDate(formatDate(addDays(new Date(startDate), diff)));

    setEndDate(formatDate(addDays(new Date(endDate), diff)));
  };

  const goToday = () => {
    const now = new Date();

    setStartDate(formatDate(addDays(now, -6)));
    setEndDate(formatDate(now));
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <AttendanceToolbar
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        onPrevious={previousRange}
        onNext={nextRange}
        onToday={goToday}
        onRefresh={attendance.refetch}
        refreshing={attendance.isRefetching}
      />

      <AttendanceSummary
        present={summary.present}
        absent={summary.absent}
        halfDay={summary.halfDay}
        late={summary.late}
      />

      <AttendanceTable
        loading={attendance.isLoading}
        dates={dates}
        rows={grouped}
      />

      {attendance.data && (
        <PaginationFooter
          page={attendance.data.page}
          totalPages={attendance.data.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
