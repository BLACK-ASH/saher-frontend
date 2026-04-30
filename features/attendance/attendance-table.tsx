"use client";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAttendance } from "@/hooks/use-attendance";
import { formatDate, formatHours, formatTime } from "@/lib/utils/time";
import { AttendanceCorrectionSide } from "./attendance-correction";

export const attendanceStatusVariant: Record<
  "half-day" | "present" | "absent",
  "outline-warn" | "outline-success" | "destructive"
> = {
  "half-day": "outline-warn",
  present: "outline-success",
  absent: "destructive",
};

export function AttendanceTable({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { attendancesList: data } = useAttendance({ sort: "desc" });
  const { data: attendances, isLoading } = data;

  if (isLoading) return <DefaultLoader className={className} />;
  if (!attendances)
    return (
      <NoData
        className={className}
        title="No Recent Attendances"
        description="Please Refresh or You Don't Have Any Recent Attendances."
      />
    );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Attendances</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-25 text-center">Date</TableHead>
              <TableHead className="text-center">Check In</TableHead>
              <TableHead className="text-center">Check Out</TableHead>
              <TableHead className="text-center">Work Hours</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendances?.map((attendance) => (
              <TableRow className="cursor-pointer" key={attendance.id}>
                <TableCell className="font-medium">
                  {formatDate(attendance.date)}
                </TableCell>
                <TableCell className="text-center">
                  {formatTime(attendance.inTime)}
                </TableCell>
                <TableCell className="text-center">
                  {formatTime(attendance.outTime)}
                </TableCell>
                <TableCell className="text-center">
                  {formatHours(attendance.workHours)}
                </TableCell>
                <TableCell className="font-medium">
                  <Badge variant={attendanceStatusVariant[attendance.status]}>
                    {attendance.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <AttendanceCorrectionSide attendance={attendance} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
