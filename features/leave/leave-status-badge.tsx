"use client";

import { Badge } from "@/components/ui/badge";

import { CheckCircle2, Clock3, XCircle, Ban } from "lucide-react";

import { LeaveStatus } from "@/services/leave.api";

type Props = {
  status: LeaveStatus;
};

export default function LeaveStatusBadge({ status }: Props) {
  switch (status) {
    case "approved":
      return (
        <Badge className="gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Approved
        </Badge>
      );

    case "pending":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock3 className="h-3.5 w-3.5" />
          Pending
        </Badge>
      );

    case "rejected":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3.5 w-3.5" />
          Rejected
        </Badge>
      );

    case "cancelled":
      return (
        <Badge variant="outline" className="gap-1">
          <Ban className="h-3.5 w-3.5" />
          Cancelled
        </Badge>
      );

    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
