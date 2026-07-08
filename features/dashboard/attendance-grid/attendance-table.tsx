"use client";

import { Card, CardContent } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { AttendanceRow } from "./types";
import AttendanceRowComponent from "./attendance-row";

type Props = {
  loading: boolean;
  dates: string[];
  rows: AttendanceRow[];
};

export default function AttendanceTable({ loading, dates, rows }: Props) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-20 text-center text-muted-foreground">
          Loading attendance...
        </CardContent>
      </Card>
    );
  }

  if (!rows.length) {
    return (
      <Card>
        <CardContent className="py-20 text-center text-muted-foreground">
          No attendance found.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="overflow-auto p-0">
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-background">
            <TableRow>
              <TableHead className="sticky left-0 z-30 min-w-72 bg-background">
                Employee
              </TableHead>

              {dates.map((date) => (
                <TableHead key={date} className="min-w-20 text-center">
                  <div className="flex flex-col">
                    <span>
                      {new Date(date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                      })}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      {new Date(date).toLocaleDateString("en-IN", {
                        weekday: "short",
                      })}
                    </span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row) => (
              <AttendanceRowComponent
                key={row.user.id}
                row={row}
                dates={dates}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
