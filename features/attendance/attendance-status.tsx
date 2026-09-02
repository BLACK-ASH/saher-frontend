"use client";

import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAttendance, AttendanceStatus as AttendanceStatusEnum } from "@/hooks/use-attendance";
import { formatIstDate, formatHours, istTime } from "@/lib/date";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ClockIcon,
  CalendarX2,
  BriefcaseBusiness,
} from "lucide-react";

const AttendanceStatus = () => {
  const {
    today,
    status,
    isCheckedIn,
    isCheckedOut,
    checkIn,
    checkOut,
    overtimeCheckIn,
    weekOff,
  } = useAttendance();

  const { data, isLoading } = today;

  if (isLoading) return <DefaultLoader />;

  if (!data) {
    return (
      <NoData
        title="No Attendance Created"
        description="Please refresh the page or contact the administrator."
      />
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{formatIstDate(data.date)}</CardTitle>

        <CardAction className="flex flex-wrap items-center gap-2">
          <Badge
            variant={
              status === AttendanceStatusEnum.CHECKED_IN
                ? "outline-success"
                : status === AttendanceStatusEnum.LATE
                  ? "outline-warn"
                  : status === AttendanceStatusEnum.CHECKED_OUT
                    ? "default"
                    : "outline"
            }
          >
            {status === AttendanceStatusEnum.NOT_CHECKED_IN
              ? "Not Checked In"
              : status === AttendanceStatusEnum.CHECKED_IN
                ? "Checked In"
                : status === AttendanceStatusEnum.LATE
                  ? "Late"
                  : "Checked Out"}
          </Badge>
          {data.overtime === true && (
            <Badge variant="verify">Overtime</Badge>
          )}
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-[150px_1fr] items-center gap-3">
          <span className="flex items-center gap-2">
            <ArrowDownLeft className="h-4 w-4" />
            Check In
          </span>

          <Input disabled type="time" value={istTime(data.inTime)} />
        </div>

        <div className="grid grid-cols-[150px_1fr] items-center gap-3">
          <span className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4" />
            Check Out
          </span>

          <Input disabled type="time" value={istTime(data.outTime)} />
        </div>

        <div className="grid grid-cols-[150px_1fr] items-center gap-3">
          <span className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4" />
            Work Hours
          </span>

          <Input disabled value={formatHours(data.workHours)} />
        </div>
      </CardContent>

      <CardFooter className="grid grid-cols-2 gap-3">
        <Button
          disabled={isCheckedIn || checkIn.isPending}
          onClick={() => checkIn.mutate()}
        >
          <ArrowDownLeft className="mr-2 h-4 w-4" />
          Check In
        </Button>

        <Button
          disabled={!isCheckedIn || isCheckedOut || checkOut.isPending}
          onClick={() => checkOut.mutate()}
        >
          <ArrowUpRight className="mr-2 h-4 w-4" />
          Check Out
        </Button>

        <Button
          variant="secondary"
          disabled={isCheckedIn || weekOff.isPending}
          onClick={() => weekOff.mutate()}
        >
          <CalendarX2 className="mr-2 h-4 w-4" />
          Week Off
        </Button>

        <Button
          variant="outline"
          disabled={isCheckedIn || overtimeCheckIn.isPending}
          onClick={() => overtimeCheckIn.mutate()}
        >
          <BriefcaseBusiness className="mr-2 h-4 w-4" />
          Overtime
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AttendanceStatus;
