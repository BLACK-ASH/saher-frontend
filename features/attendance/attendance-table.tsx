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
import { useAttendance } from "@/hooks/use-attendance"
import { formatHours, formatTime } from "@/utils/attendance"
import { usePathname, useRouter } from "next/navigation"


export function AttendanceTable() {
  const router = useRouter()
  const pathname = usePathname()
  const setId = (id: string) => {
    router.push(pathname + "?attendanceId=" + id)
  }
  const { attendances } = useAttendance()
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
            {attendances?.attendances.map((attendance) => (
              <TableRow className="cursor-pointer" key={attendance._id} onClick={() => setId(attendance._id)} >
                <TableCell className="font-medium">{attendance.date}</TableCell>
                <TableCell className="text-center">{formatTime(attendance.inTime)}</TableCell>
                <TableCell className="text-center">{formatTime(attendance.outTime)}</TableCell>
                <TableCell className="text-center">{formatHours(attendance.workHours)}</TableCell>
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

