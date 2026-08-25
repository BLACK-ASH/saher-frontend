"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { useLeave } from "@/hooks/use-leave";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";

import { Check, Eye, User, X } from "lucide-react";

import { LeaveT } from "@/services/leave.api";
import LeaveStatusBadge from "./leave-status-badge";
import ReviewLeaveDialog from "./review-leave-dialog";
import LeaveDetailsDialog from "./leave-details-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminLeavePage() {
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? 1);

  const limit = Number(searchParams.get("limit") ?? 10);

  const { applications } = useLeave({
    page,
    limit,
    all: true,
  });

  const [reviewLeave, setReviewLeave] = useState<LeaveT>();

  const [viewLeave, setViewLeave] = useState<LeaveT>();

  return (
    <div className="container space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Leave Approval</h1>

        <p className="text-muted-foreground">
          Review and manage employee leave requests.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Leave Requests</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>

                <TableHead>Type</TableHead>

                <TableHead>Duration</TableHead>

                <TableHead>Status</TableHead>

                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {applications.data?.items.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-11 w-11">
                        {leave.user.image ? (
                          <>
                            <AvatarImage src={leave.user.image.src} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </>
                        ) : (
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {leave.user.displayName}
                        </p>

                        <p className="truncate text-xs text-muted-foreground">
                          {leave.user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>{leave.type.name}</TableCell>

                  <TableCell>
                    <div className="text-sm">
                      {new Date(leave.startDate).toLocaleDateString()}

                      {" - "}

                      {new Date(leave.endDate).toLocaleDateString()}
                    </div>
                  </TableCell>

                  <TableCell>
                    <LeaveStatusBadge status={leave.status} />
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setViewLeave(leave)}
                      >
                        <Eye />
                      </Button>

                      {leave.status === "pending" && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setReviewLeave(leave)}
                          >
                            <Check />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setReviewLeave(leave)}
                          >
                            <X />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ReviewLeaveDialog
        leave={reviewLeave}
        open={!!reviewLeave}
        onOpenChange={(open) => {
          if (!open) setReviewLeave(undefined);
        }}
      />

      <LeaveDetailsDialog
        leave={viewLeave}
        open={!!viewLeave}
        onOpenChange={(open) => {
          if (!open) setViewLeave(undefined);
        }}
      />
    </div>
  );
}
