"use client";

import { RangeAttendanceTable } from "@/features/dashboard/range-attendance-table";
import { TodayAttendanceTable } from "@/features/dashboard/today-attendance-table";

const page = () => {
  return (
    <section className="p-4 container mx-auto">
      <TodayAttendanceTable className="mb-4" />
      <RangeAttendanceTable className="mt-2" />
    </section>
  );
};

export default page;
