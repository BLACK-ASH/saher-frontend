import { AttendanceChart } from "@/features/attendance/attendance-chart";
import AttendanceCorrectionRequests from "@/features/attendance/attendance-correction-requests";
import { AttendanceTable } from "@/features/attendance/attendance-table";
import AttendanceStatus from "@/features/attendance/attendance-status";

const page = () => {
  return (
    <section>
      <div className="p-2 gap-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <AttendanceStatus />
        <AttendanceChart className="md:col-span-2" />
      </div>
      <div className="p-2 gap-3 grid grid-cols-1 md:grid-cols-3">
        <AttendanceTable className="col-span-2" />
        <AttendanceCorrectionRequests />
      </div>
    </section>
  );
};

export default page;
