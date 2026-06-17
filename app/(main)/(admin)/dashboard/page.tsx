"use client";

import { RangeAttendanceTable } from "@/features/dashboard/range-attendance-table";
import { TodayAttendanceTable } from "@/features/dashboard/today-attendance-table";

const page = () => {
  return (
    <div>
      <TodayAttendanceTable className="m-2" />
      <RangeAttendanceTable className="m-2" />
    </div>
  );
};

export default page;
