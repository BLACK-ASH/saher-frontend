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
import { ArrowLeft, ArrowRight, MoreHorizontal, RotateCw } from "lucide-react";
import { useState } from "react";
import { attendanceStatusVariant } from "../attendance/attendance-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { imageUrl } from "@/lib/image-url";
import { useQuery } from "@tanstack/react-query";
import { getTodayAttendance } from "@/services/attendance.api";
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

export function TodayAttendanceTable({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [limit, setLimit] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [sort, setSort] = useState<"asc" | "desc">("desc");

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["attendance", "today", "list", limit, page, sort],
    queryFn: () => getTodayAttendance({ limit, page, sort }),
  });
  if (isLoading) return <DefaultLoader className={className} />;
  if (!data?.data)
    return (
      <NoData
        className={className}
        title="No Recent Attendances"
        description="Please Refresh or You Don't Have Any Recent Attendances."
      />
    );

  const submitHandler = async (
    status: "absent" | "present" | "half-day",
    late: boolean,
  ) => {
    toast.info("Feature Coming Soon...");
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Today Users Attendances</CardTitle>
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
            {data?.data.map((attendance) => (
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
                          onClick={() => submitHandler("absent", false)}
                        >
                          Absent
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => submitHandler("half-day", false)}
                        >
                          Half Day
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => submitHandler("present", false)}
                        >
                          Present
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Late</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => submitHandler("present", true)}
                        >
                          Late
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => submitHandler("present", false)}
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
