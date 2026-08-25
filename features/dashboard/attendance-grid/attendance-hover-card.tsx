"use client";

import { ReactNode } from "react";
import {
  Calendar,
  Clock3,
  LogIn,
  LogOut,
  Timer,
  TriangleAlert,
} from "lucide-react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { AttendanceResponse } from "@/services/attendance.api";
import { formatIstDate, formatIstDateTime } from "@/lib/date";

type Props = {
  attendance: AttendanceResponse;
  children: ReactNode;
};

function formatTime(date: Date | string | null) {
  if (!date) return "--";
  return formatIstDateTime(date);
}

function formatDate(date: string) {
  return formatIstDate(date);
}

function formatHours(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);

  if (!h && !m) return "--";

  return `${h}h ${m}m`;
}

export default function AttendanceHoverCard({ attendance, children }: Props) {
  return (
    <HoverCard openDelay={150}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>

      <HoverCardContent className="w-80 space-y-4">
        <div>
          <h4 className="font-semibold">{attendance.user.displayName}</h4>

          <p className="text-sm text-muted-foreground">
            {attendance.user.email}
          </p>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>

          <Badge className="capitalize">{attendance.status}</Badge>
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Date
            </div>

            <span className="text-sm">{formatDate(attendance.date)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <LogIn className="h-4 w-4" />
              In Time
            </div>

            <span>{formatTime(attendance.inTime)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <LogOut className="h-4 w-4" />
              Out Time
            </div>

            <span>{formatTime(attendance.outTime)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Timer className="h-4 w-4" />
              Work Hours
            </div>

            <span>{formatHours(attendance.workHours)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TriangleAlert className="h-4 w-4" />
              Late
            </div>

            <Badge variant={attendance.isLate ? "destructive" : "secondary"}>
              {attendance.isLate ? "Yes" : "No"}
            </Badge>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
