"use client";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { attendanceStatusVariant } from "@/features/attendance/attendance-table";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { useEmployeeAttendance } from "@/hooks/use-admin-attendance";
import { formatIstDate, formatIstDateTime, formatHours } from "@/lib/date";
import { useEffect, useState } from "react";

type Props = {
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EmployeeAttendanceSheet({
  userId,
  userName,
  userEmail,
  open,
  onOpenChange,
}: Props) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (userId) setPage(1);
  }, [userId]);

  const { data, isLoading } = useEmployeeAttendance(userId, page);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-scroll sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{userName}</SheetTitle>
          <SheetDescription>{userEmail} — Full attendance history</SheetDescription>
        </SheetHeader>
        <div className="space-y-4">
          {isLoading ? (
            <DefaultLoader />
          ) : !data?.items.length ? (
            <NoData title="No attendance records" description="No records found for this employee." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Date</TableHead>
                    <TableHead className="text-center">Check In</TableHead>
                    <TableHead className="text-center">Check Out</TableHead>
                    <TableHead className="text-center">Work Hours</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Late</TableHead>
                    <TableHead className="text-center">Overtime</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{formatIstDate(a.date)}</TableCell>
                      <TableCell className="text-center">{formatIstDateTime(a.inTime)}</TableCell>
                      <TableCell className="text-center">{formatIstDateTime(a.outTime)}</TableCell>
                      <TableCell className="text-center">{formatHours(a.workHours)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={attendanceStatusVariant[a.status]} className="mx-auto">
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {a.isLate ? "late" : "on time"}
                      </TableCell>
                      <TableCell className="text-center">
                        {a.overtime === true ? "overtime" : "--"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationFooter page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
