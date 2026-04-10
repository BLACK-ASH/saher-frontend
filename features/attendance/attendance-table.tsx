"use client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { dateField } from "@/lib/common-zod-schema"
import { usePathname, useRouter } from "next/navigation"
import z from "zod"

const attendanceStatus = ["present", "half-day", "absent"]
export const attendanceSchema = z.object({
  _id: z.string("Attendance Id Is Required."),
  inTime: dateField,
  outTime: dateField,
  workHours: z.number(),
  date: z.string(),
  isLate: z.boolean().optional(),
  status: z.enum(attendanceStatus),
})

export type AttendanceType = z.infer<typeof attendanceSchema>

const attendances = [
  { _id: "id-01", date: "01-01-2026", workHours: 9, inTime: "9am", outTime: "6pm", isLate: false },
  { _id: "id-02", date: "02-01-2026", workHours: 8, inTime: "9am", outTime: "6pm", isLate: false },
  { _id: "id-03", date: "03-01-2026", workHours: 8.5, inTime: "9am", outTime: "6pm", isLate: false },
  { _id: "id-04", date: "04-01-2026", workHours: 7, inTime: "9am", outTime: "6pm", isLate: false },
  { _id: "id-05", date: "05-01-2026", workHours: 7.7, inTime: "9am", outTime: "6pm", isLate: false },
  { _id: "id-06", date: "06-01-2026", workHours: 8.7, inTime: "9am", outTime: "6pm", isLate: false },
  { _id: "id-07", date: "07-01-2026", workHours: 9, inTime: "9am", outTime: "6pm", isLate: false },
  { _id: "id-08", date: "08-01-2026", workHours: 8, inTime: "9am", outTime: "6pm", isLate: false },
  { _id: "id-09", date: "09-01-2026", workHours: 8.5, inTime: "9am", outTime: "6pm", isLate: false },
  { _id: "id-10", date: "10-01-2026", workHours: 7, inTime: "9am", outTime: "6pm", isLate: false },
]

export function AttendanceTable() {
  const router = useRouter()
  const pathname = usePathname()
  const setId = (id: string) => {
    router.push(pathname + "?attendanceId=" + id)
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Attendances</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          {/* <TableCaption>A list of your recent invoices.</TableCaption> */}
          <TableHeader>
            <TableRow>
              <TableHead className="w-25">Date</TableHead>
              <TableHead >Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Work Hours</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendances.map((attendance) => (
              <TableRow className="cursor-pointer" key={attendance._id} onClick={() => setId(attendance._id)} >
                <TableCell className="font-medium">{attendance.date}</TableCell>
                <TableCell className="text-center">{attendance.inTime}</TableCell>
                <TableCell className="text-center">{attendance.outTime}</TableCell>
                <TableCell className="text-center">{attendance.workHours}</TableCell>
                <TableCell>
                  {!attendance.isLate ?
                    <Badge variant={"outline-success"}>On Time</Badge> : <Badge variant={"outline-warn"}>Late</Badge>
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {/* <TableFooter> */}
          {/*   <TableRow> */}
          {/*   </TableRow> */}
          {/* </TableFooter> */}
        </Table>
      </CardContent>
    </Card>
  )
}

