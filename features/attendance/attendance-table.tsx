"use client";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, RotateCw } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AttendanceReportDropdown } from "./attendance-report";

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
  const [page, setPage] = useState<number>(1);
  const { attendancesList: data } = useAttendance({ sort: "desc", page });
  const { data: attendances, isLoading, refetch, isRefetching } = data;

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
        <CardAction className="flex gap-2 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <AttendanceReportDropdown />
            </TooltipTrigger>
            <TooltipContent>
              <p>Download Attendance Report.</p>
            </TooltipContent>
          </Tooltip>
          <Button
            variant={"outline"}
            disabled={isRefetching}
            onClick={() => refetch()}
          >
            <RotateCw />
          </Button>
          <Button
            variant={"outline"}
            disabled={1 > page - 1}
            onClick={() => setPage((prev) => prev - 1)}
          >
            <ArrowLeft />
          </Button>
          <Button
            disabled={attendances?.meta?.total! < page + 1}
            onClick={() => setPage((prev) => prev + 1)}
            variant={"outline"}
          >
            <ArrowRight />
          </Button>
        </CardAction>
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
              <TableHead className="text-center">Late</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendances?.data.map((attendance) => (
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
                <TableCell className="font-medium text-center">
                  <Badge
                    variant={
                      attendance.isLate ? "outline-warn" : "outline-success"
                    }
                  >
                    {attendance.isLate ? "late" : "on time"}
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
