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
import { formatDate, formatHours, formatTime } from "@/lib/utils/time"
import { usePathname, useRouter } from "next/navigation"

const variant: Record<
  "half-day" | "present" | "absent",
  "outline-warn" | "outline-success" | "destructive"
> = {
  "half-day": "outline-warn",
  present: "outline-success",
  absent: "destructive",
}

export function AttendanceTable() {
  const router = useRouter()
  const pathname = usePathname()
  const setId = (id: string) => {
    router.push(pathname + "?attendanceId=" + id)
  }
  const { attendancesList: data } = useAttendance()
  const { data: attendances, isLoading } = data

  if (isLoading) return <p>Loading ...</p>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Attendances</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
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
            {attendances?.map((attendance) => (
              <TableRow className="cursor-pointer" key={attendance._id} onClick={() => setId(attendance._id)} >
                <TableCell className="font-medium">{formatDate(attendance.date)}</TableCell>
                <TableCell className="text-center">{formatTime(attendance.inTime)}</TableCell>
                <TableCell className="text-center">{formatTime(attendance.outTime)}</TableCell>
                <TableCell className="text-center">{formatHours(attendance.workHours)}</TableCell>
                <TableCell className="font-medium"><Badge variant={variant[attendance.status]}>{attendance.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

