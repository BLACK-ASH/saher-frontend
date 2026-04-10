import { AttendanceChart } from "@/features/attendance/attendance-chart"
import AttendanceCorrection from "@/features/attendance/attendance-correction"
import AttendanceCorrectionRequests from "@/features/attendance/attendance-correction-requests"
import { AttendanceTable } from "@/features/attendance/attendance-table"
import AttendanceStatus from "@/features/attendance/attendance-status"

const page = () => {
  return (
    <section className="p-3 gap-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <AttendanceStatus />
      <AttendanceChart className="md:col-span-2 " />
      <AttendanceTable />
      <AttendanceCorrection />
      <AttendanceCorrectionRequests />
    </section>
  )
}

export default page
