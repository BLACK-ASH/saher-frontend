"use client";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAttendanceCorrection } from "@/hooks/use-attendance-correction";
import { formatIstDate } from "@/lib/date";
import AttendanceComparision from "./attendance-comparision";
import { RotateCw } from "lucide-react";
import { useState } from "react";
import { PaginationFooter } from "@/components/pagination-footer";

export const attendanceCorrectionStatusVariant: Record<
  "pending" | "on-hold" | "approve" | "reject",
  "outline-warn" | "outline" | "outline-success" | "destructive"
> = {
  pending: "outline-warn",
  "on-hold": "outline",
  approve: "outline-success",
  reject: "destructive",
};

const AttendanceCorrectionRequests = () => {
  const [page, setPage] = useState<number>(1);
  const { allCorrections } = useAttendanceCorrection({ page });
  const {
    data: corrections,
    isLoading,
    isRefetching,
    refetch,
  } = allCorrections;

  if (isLoading) return <DefaultLoader />;
  if (!corrections || corrections.items.length === 0)
    return (
      <NoData
        title="No Attendance Correction Request."
        description="Please Refresh or You Haven't Created Any Attendance Correction Request."
      />
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Correction Requests</CardTitle>
        <CardAction className="flex gap-2">
          <Button
            variant={"outline"}
            disabled={isRefetching}
            onClick={() => refetch()}
          >
            <RotateCw />
          </Button>
          <PaginationFooter
            page={corrections.page}
            totalPages={corrections.totalPages}
            onPageChange={setPage}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">Status</TableHead>
              <TableHead className="text-center">Date</TableHead>
              <TableHead className="text-center">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {corrections.items.map((correction) => (
              <TableRow className="cursor-pointer" key={correction.id}>
                <TableCell className="font-medium">
                  <Badge
                    variant={
                      attendanceCorrectionStatusVariant[correction.status]
                    }
                  >
                    {correction.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {formatIstDate(correction.attendance.date)}
                </TableCell>
                <TableCell className="text-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="link">Details</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Attendance Correction Details</DialogTitle>
                      </DialogHeader>
                      <AttendanceComparision correction={correction} />
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AttendanceCorrectionRequests;
