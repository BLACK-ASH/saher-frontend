"use client";

import { Check, Clock3, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { TableCell } from "@/components/ui/table";

import { AttendanceResponse } from "@/services/attendance.api";
import AttendanceHoverCard from "./attendance-hover-card";

type Props = {
  attendance?: AttendanceResponse;
};

export default function AttendanceCell({ attendance }: Props) {
  if (!attendance) {
    return (
      <TableCell className="text-center">
        <span className="text-muted-foreground">—</span>
      </TableCell>
    );
  }

  let badge;

  switch (attendance.status) {
    case "present":
      badge = (
        <Badge className="gap-1">
          <Check className="h-3 w-3" />P
        </Badge>
      );
      break;

    case "half-day":
      badge = (
        <Badge variant="secondary" className="gap-1">
          <Clock3 className="h-3 w-3" />H
        </Badge>
      );
      break;

    case "absent":
      badge = (
        <Badge variant="destructive" className="gap-1">
          <X className="h-3 w-3" />A
        </Badge>
      );
      break;
  }

  return (
    <TableCell className="text-center">
      <AttendanceHoverCard attendance={attendance}>
        <div className="relative inline-flex">
          {badge}

          {attendance.isLate && (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-background" />
          )}
        </div>
      </AttendanceHoverCard>
    </TableCell>
  );
}
