"use client";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import { useAdminAttendanceCorrection } from "@/hooks/use-admin-attendance-correction";
import { attendanceCorrectionColumns } from "./corrections/column";
import { AttendanceCorrectionDataTable } from "./corrections/data-table";

const AdminAttendanceCorrectionTable = () => {
  const { allCorrections } = useAdminAttendanceCorrection();
  const { data: corrections, isLoading } = allCorrections;

  if (isLoading) return <DefaultLoader className="col-span-2" />;
  if (!corrections)
    return (
      <NoData
        className="col-span-2"
        title="No Chart To Show."
        description="Please Refresh or You Don't Have Any Attendance To Show This Chart."
      />
    );

  return (
    <div className="container mx-auto col-span-2 row-span-3 h-full">
      <AttendanceCorrectionDataTable
        columns={attendanceCorrectionColumns}
        data={corrections}
      />
    </div>
  );
};

export default AdminAttendanceCorrectionTable;
