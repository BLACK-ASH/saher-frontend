"use client";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
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
import { Button } from "@/components/ui/button";
import { getCoreRowModel, useReactTable, flexRender } from "@tanstack/react-table";
import { RotateCw } from "lucide-react";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import type { NormalizedList } from "@/lib/normalize-list";
import type { AttendanceResponse } from "@/services/attendance.api";
import { getAdminAttendanceColumns } from "./admin-attendance-columns";

type Props = {
  data: NormalizedList<AttendanceResponse> | undefined;
  isLoading: boolean;
  isRefetching: boolean;
  refetch: () => void;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onRowClick: (attendance: AttendanceResponse) => void;
};

export function AdminAttendanceTable({
  data,
  isLoading,
  isRefetching,
  refetch,
  page,
  totalPages,
  onPageChange,
  onRowClick,
}: Props) {
  const table = useReactTable({
    data: data?.items ?? [],
    columns: getAdminAttendanceColumns(onRowClick),
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between">
        <CardTitle>All Attendance</CardTitle>
        <CardAction className="flex flex-wrap gap-2 items-center">
          <Button variant="outline" disabled={isRefetching} onClick={() => refetch()}>
            <RotateCw />
          </Button>
          <PaginationFooter page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </CardAction>
      </CardHeader>
      <CardContent className="p-0 overflow-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length}>
                  <DefaultLoader />
                </TableCell>
              </TableRow>
            ) : !data?.items.length ? (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length}>
                  <NoData
                    title="No attendance records"
                    description="No records match the selected filters. Adjust the date range or employee filter."
                  />
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="cursor-pointer" onClick={() => onRowClick(row.original)}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
