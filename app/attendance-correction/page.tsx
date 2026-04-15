import { AttendanceCorrectionChart } from "@/features/attendance-correction/attendance-correction-chart"
import AdminAttendanceCorrectionTable from "@/features/attendance-correction/attendance-correction-table"
import AttendanceCorrectionView from "@/features/attendance-correction/attendance-correction-view"
import { Suspense } from "react"

const page = () => {
  return (
    <section className="p-3 grid grid-cols-1 md:grid-cols-3 gap-2">
      <AttendanceCorrectionChart />
      <AdminAttendanceCorrectionTable />
      <Suspense>
        <AttendanceCorrectionView />
      </Suspense>
    </section>
  )
}

export default page
