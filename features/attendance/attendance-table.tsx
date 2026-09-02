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
import { Input } from "@/components/ui/input";
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
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [appliedStart, setAppliedStart] = useState("");
  const [appliedEnd, setAppliedEnd] = useState("");
  const { attendancesList: data } = useAttendance({ sort: "desc", page, limit: 100 });
  const { data: attendances, isLoading, refetch, isRefetching } = data;

  const filteredItems =
    attendances?.items.filter((a) => {
      if (appliedStart && a.date < appliedStart) return false;
      if (appliedEnd && a.date > appliedEnd) return false;
      return true;
    }) ?? [];

  if (isLoading) return <DefaultLoader className={className} />;
  if (!attendances)
    return (
      <NoData
        className={className}
        title="No Recent Attendances"
        description="Please Refresh or You Don't Have Any Recent Attendances."
      />
    );

  const filterActive = !!(appliedStart || appliedEnd);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-wrap items-center justify-between">
        <CardTitle>Recent Attendances</CardTitle>
        <CardAction className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="w-[140px]"
              value={filterStartDate}
              max={filterEndDate || undefined}
              onChange={(e) => setFilterStartDate(e.target.value)}
              placeholder="Start"
            />
            <Input
              type="date"
              className="w-[140px]"
              value={filterEndDate}
              min={filterStartDate || undefined}
              onChange={(e) => setFilterEndDate(e.target.value)}
              placeholder="End"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAppliedStart(filterStartDate);
                setAppliedEnd(filterEndDate);
                setPage(1);
              }}
            >
              Apply
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterStartDate("");
                setFilterEndDate("");
                setAppliedStart("");
                setAppliedEnd("");
                setPage(1);
              }}
            >
              Reset
            </Button>
          </div>
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
        {filterActive && (
          <p className="mb-2 text-sm text-muted-foreground">
            Filtered: {appliedStart || "—"} to {appliedEnd || "—"}
          </p>
        )}
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
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No attendance records match the selected date range.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((attendance) => (
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
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
