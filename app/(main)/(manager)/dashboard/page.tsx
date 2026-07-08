"use client";

import { Separator } from "@/components/ui/separator";
import AttendanceDashboard from "@/features/dashboard/attendance-grid/attendance-dashboard";
import { RangeAttendanceTable } from "@/features/dashboard/range-attendance-table";
import { TodayAttendanceTable } from "@/features/dashboard/today-attendance-table";

const page = () => {
  return (
    <section className="p-4 container mx-auto">
      <TodayAttendanceTable className="mb-4" />
      {/* <RangeAttendanceTable className="mt-2" /> */}
      <Separator className="my-4" />

      <AttendanceDashboard />
    </section>
  );
};

export default page;
