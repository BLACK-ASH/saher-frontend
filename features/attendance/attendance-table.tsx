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
import { formatIstDate, formatIstDateTime, formatHours } from "@/lib/date";
import { AttendanceCorrectionSide } from "./attendance-correction";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AttendanceReportDropdown } from "./attendance-report";
import { PaginationFooter } from "@/components/shared/pagination-footer";

export const attendanceStatusVariant: Record<
  "half-day" | "present" | "absent" | "week-off" | "on-leave",
  "outline-warn" | "outline-success" | "destructive" | "default"
> = {
  "half-day": "outline-warn",
  present: "outline-success",
  absent: "destructive",
  "week-off": "default",
  "on-leave": "default",
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
      <CardHeader className="flex flex-wrap items-center justify-between">
        <CardTitle>Recent Attendances</CardTitle>
        <CardAction className="flex flex-wrap gap-2 items-center">
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
          <PaginationFooter
            page={attendances?.page ?? page}
            totalPages={attendances?.totalPages ?? 0}
            onPageChange={setPage}
          />
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
            {attendances?.items.map((attendance) => (
              <TableRow className="cursor-pointer" key={attendance.id}>
                <TableCell className="font-medium">
                  {formatIstDate(attendance.date)}
                </TableCell>
                <TableCell className="text-center">
                  {formatIstDateTime(attendance.inTime)}
                </TableCell>
                <TableCell className="text-center">
                  {formatIstDateTime(attendance.outTime)}
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
