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
import { formatDate, formatHours, formatTime } from "@/lib/utils/time";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  RotateCw,
} from "lucide-react";
import { useState } from "react";
import { attendanceStatusVariant } from "../attendance/attendance-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { imageUrl } from "@/lib/image-url";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AttendanceResponse,
  getRangeAttendance,
  getTodayAttendance,
} from "@/services/attendance.api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import z from "zod";
import { changeAttendanceStatus } from "@/services/attendance-correction.api";
import { Input } from "@/components/ui/input";

const markSchema = z.object({
  id: z.string(),
  status: z.enum(["present", "absent", "half-day"]),
  isLate: z.boolean(),
  date: z.string(),
});

export type MarKAttendance = z.infer<typeof markSchema>;

export function RangeAttendanceTable({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const today = new Date().toISOString().split("T")[0];

  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["attendance", "range", limit, page, sort, startDate, endDate],
    queryFn: () =>
      getRangeAttendance({
        startDate,
        endDate,
        limit,
        page,
        sort,
      }),
    staleTime: 60 * 60 * 4,
  });

  const changeDay = (direction: "next" | "prev") => {
    setStartDate((prev) => {
      const date = new Date(prev);

      if (direction === "next") {
        date.setDate(date.getDate() + 1);
      } else {
        date.setDate(date.getDate() - 1);
      }

      const newDate = date.toISOString().split("T")[0];

      setEndDate(newDate);

      return newDate;
    });
  };

  const changeDate = (value: string) => {
    const date = new Date(value).toISOString().split("T")[0];
    setStartDate(date);
    setEndDate(date);
    return;
  };

  const attendances = data?.data;

  if (isLoading) return <DefaultLoader className={className} />;
  // if (!attendances || attendances.length === 0)
  //   return (
  //     <NoData
  //       className={className}
  //       title="No Recent Attendances"
  //       description="Please Refresh or You Don't Have Any Recent Attendances."
  //     />
  //   );

  const submitHandler = async (
    attendance: AttendanceResponse,
    status: "absent" | "present" | "half-day",
    late: boolean,
  ) => {
    const payload = markSchema.parse({
      date: attendance.date,
      id: attendance.user.id,
      status,
      isLate: late,
    });
    const res = await changeAttendanceStatus(payload);
    queryClient.invalidateQueries({
      queryKey: ["attendance", "today", "list"],
    });
    toast.info(res.message);
  };

  return (
    <Card className={className}>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Users Attendances</CardTitle>
        <div className="flex gap-4 items-center">
          <Button
            variant={"ghost"}
            className="flex gap-2 items-center"
            onClick={() => changeDay("prev")}
          >
            <ChevronLeft />
            Previous Day
          </Button>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => changeDate(e.target.value)}
          />
          <Button
            variant={"ghost"}
            className="flex gap-2 items-center"
            onClick={() => changeDay("next")}
          >
            Next Day
            <ChevronRight />
          </Button>
        </div>
        <CardAction className="flex gap-2">
          <Button
            variant={"outline"}
            disabled={isRefetching}
            onClick={() => refetch()}
          >
            <RotateCw />
          </Button>
          <Select></Select>
          <Button
            variant={"outline"}
            disabled={1 > page - 1}
            onClick={() => setPage((prev) => prev - 1)}
          >
            <ArrowLeft />
          </Button>
          <Button
            disabled={data?.meta?.total! < page + 1}
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
              <TableHead className="text-start">User</TableHead>
              <TableHead className="text-start">Date</TableHead>
              <TableHead className="text-center">Check In</TableHead>
              <TableHead className="text-center">Check Out</TableHead>
              <TableHead className="text-center">Work Hours</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Late</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendances?.map((attendance) => (
              <TableRow className="cursor-pointer" key={attendance.id}>
                <TableCell>
                  <div className="flex gap-3 items-center max-w-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={imageUrl(attendance?.user.image?.src)}
                        alt={attendance?.user.name}
                      />
                      <AvatarFallback className="rounded-lg">
                        {attendance?.user.name}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p>{attendance.user.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {attendance.user.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
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
                <TableCell className="font-medium text-center">
                  <Badge
                    className="mx-auto"
                    variant={attendanceStatusVariant[attendance.status]}
                  >
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Status</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() =>
                            submitHandler(
                              attendance,
                              "absent",
                              attendance.isLate,
                            )
                          }
                        >
                          Absent
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            submitHandler(
                              attendance,
                              "half-day",
                              attendance.isLate,
                            )
                          }
                        >
                          Half Day
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            submitHandler(
                              attendance,
                              "present",
                              attendance.isLate,
                            )
                          }
                        >
                          Present
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Late</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() =>
                            submitHandler(attendance, attendance.status, true)
                          }
                        >
                          Late
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            submitHandler(attendance, attendance.status, false)
                          }
                        >
                          On Time
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
