"use client";
import { attendanceCorrectionColumns } from "./corrections/column";
import { AttendanceCorrectionDataTable } from "./corrections/data-table";

const AdminAttendanceCorrectionTable = () => {
  return (
    <div className="container mx-auto col-span-2 row-span-3 h-full">
      <AttendanceCorrectionDataTable columns={attendanceCorrectionColumns} />
    </div>
  );
};

export default AdminAttendanceCorrectionTable;
