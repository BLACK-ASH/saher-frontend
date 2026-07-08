"use client";

import Image from "next/image";

import { TableCell, TableRow } from "@/components/ui/table";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Badge } from "@/components/ui/badge";

import { User } from "lucide-react";

import { AttendanceRow } from "./types";
import AttendanceCell from "./attendance-cell";

type Props = {
  row: AttendanceRow;
  dates: string[];
};

export default function AttendanceRowComponent({ row, dates }: Props) {
  return (
    <TableRow>
      <TableCell className="sticky left-0 z-10 bg-background">
        <div className="flex items-center gap-4">
          <Avatar className="h-11 w-11">
            {row.user.image ? (
              <>
                <AvatarImage src={row.user.image.src} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </>
            ) : (
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            )}
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{row.user.displayName}</p>

            <p className="truncate text-xs text-muted-foreground">
              {row.user.email}
            </p>

            <Badge variant="secondary" className="mt-2 capitalize">
              {row.user.role}
            </Badge>
          </div>
        </div>
      </TableCell>

      {dates.map((date) => (
        <AttendanceCell key={date} attendance={row.attendance[date]} />
      ))}
    </TableRow>
  );
}
