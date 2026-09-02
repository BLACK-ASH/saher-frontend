"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { attendanceStatusVariant } from "@/features/attendance/attendance-table";
import { imageUrl } from "@/lib/image-url";
import { formatIstDate, formatIstDateTime, formatHours } from "@/lib/date";
import type { AttendanceResponse } from "@/services/attendance.api";

export function getAdminAttendanceColumns(
  onRowClick: (attendance: AttendanceResponse) => void,
): ColumnDef<AttendanceResponse>[] {
  return [
    {
      id: "employee",
      header: "Employee",
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="flex gap-3 items-center max-w-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={imageUrl(a.user.image?.src)} alt={a.user.name} />
              <AvatarFallback className="rounded-lg">{a.user.name}</AvatarFallback>
            </Avatar>
            <div>
              <p>{a.user.name}</p>
              <p className="text-muted-foreground text-xs">{a.user.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: "date",
      header: "Date",
      cell: ({ row }) => (
        <span className="font-medium">{formatIstDate(row.original.date)}</span>
      ),
    },
    {
      id: "inTime",
      header: "Check In",
      cell: ({ row }) => (
        <span className="text-center">{formatIstDateTime(row.original.inTime)}</span>
      ),
    },
    {
      id: "outTime",
      header: "Check Out",
      cell: ({ row }) => (
        <span className="text-center">{formatIstDateTime(row.original.outTime)}</span>
      ),
    },
    {
      id: "workHours",
      header: "Work Hours",
      cell: ({ row }) => (
        <span className="text-center">{formatHours(row.original.workHours)}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={attendanceStatusVariant[row.original.status]} className="mx-auto">
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "late",
      header: "Late",
      cell: ({ row }) => (
        <Badge variant={row.original.isLate ? "outline-warn" : "outline-success"} className="mx-auto">
          {row.original.isLate ? "late" : "on time"}
        </Badge>
      ),
    },
    {
      id: "overtime",
      header: "Overtime",
      cell: ({ row }) =>
        row.original.overtime === true ? (
          <Badge variant="verify" className="mx-auto">
            overtime
          </Badge>
        ) : (
          <span className="text-muted-foreground text-center">--</span>
        ),
    },
  ];
}
