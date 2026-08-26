"use client";

import Image from "next/image";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import {
  CalendarDays,
  Clock3,
  FileImage,
  MessageSquare,
  Pencil,
  UserCheck,
} from "lucide-react";

import { LeaveT } from "@/services/leave.api";

import LeaveStatusBadge from "./leave-status-badge";
import { formatIstDate } from "@/lib/date";

type Props = {
  leave?: LeaveT;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (leave: LeaveT) => void;
};

export default function LeaveDetailsDialog({
  leave,
  open,
  onOpenChange,
  onEdit,
}: Props) {
  if (!leave) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Leave Application</DialogTitle>

          <DialogDescription>
            Review the details of your leave request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}

          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold">{leave.type.name}</h2>

              <p className="text-sm text-muted-foreground">{leave.type.code}</p>
            </div>

            <LeaveStatusBadge status={leave.status} />
          </div>

          <Separator />

          {/* Summary */}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 text-muted-foreground" />

              <div>
                <p className="font-medium">Duration</p>

                <p className="text-muted-foreground">
                  {formatIstDate(leave.startDate)} —{" "}
                  {formatIstDate(leave.endDate)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 text-muted-foreground" />

              <div>
                <p className="font-medium">Total Days</p>

                <p className="text-muted-foreground">
                  {leave.totalDays} day
                  {leave.totalDays > 1 && "s"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Reason */}

          <div className="space-y-2">
            <h3 className="flex items-center gap-2 font-semibold">
              <MessageSquare className="h-4 w-4" />
              Reason
            </h3>

            <div className="rounded-lg border bg-muted/40 p-4 whitespace-pre-wrap">
              {leave.reason}
            </div>
          </div>

          {/* Manager Comment */}

          {leave.managerComment && (
            <div className="space-y-2">
              <h3 className="font-semibold">Manager Comment</h3>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 whitespace-pre-wrap">
                {leave.managerComment}
              </div>
            </div>
          )}

          {/* Approved By */}

          {leave.approvedBy && (
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <UserCheck className="h-5 w-5 text-primary" />

              <div>
                <p className="text-sm text-muted-foreground">Approved By</p>

                <p className="font-medium">{leave.approvedBy}</p>
              </div>
            </div>
          )}

          {/* Proof */}

          {leave.proof && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-semibold">
                <FileImage className="h-4 w-4" />
                Proof
              </h3>

              <div className="relative overflow-hidden rounded-lg border aspect-video">
                <Image
                  src={leave.proof}
                  alt="Leave Proof"
                  fill
                  className="object-cover"
                />
              </div>

              <Button asChild variant="outline">
                <a href={leave.proof} target="_blank" rel="noopener noreferrer">
                  View Original
                </a>
              </Button>
            </div>
          )}

          {/* Actions */}

          {leave.status === "pending" && onEdit && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  onEdit(leave);

                  onOpenChange(false);
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
