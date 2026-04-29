"use client";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDate } from "@/lib/utils/time";
import AttendanceComparision from "./attendance-comparision";

type Props = {};

export const attendanceCorrectionStatusVariant: Record<
  "pending" | "on-hold" | "approve" | "reject",
  "outline-warn" | "outline" | "outline-success" | "destructive"
> = {
  pending: "outline-warn",
  "on-hold": "outline",
  approve: "outline-success",
  reject: "destructive",
};

const AttendanceCorrectionRequests = (props: Props) => {
  const { allCorrections } = useAttendanceCorrection();
  const { data: corrections, isLoading } = allCorrections;

  if (isLoading) return <DefaultLoader />;
  if (!corrections || corrections.length === 0)
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
            {corrections?.map((correction) => (
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
                  {formatDate(correction.attendance.date)}
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
