"use client";

import { useState } from "react";

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
import { PaginationFooter } from "@/components/pagination-footer";

import { Check, Eye, User, X } from "lucide-react";

import { LeaveT } from "@/services/leave.api";
import LeaveStatusBadge from "./leave-status-badge";
import ReviewLeaveDialog from "./review-leave-dialog";
import LeaveDetailsDialog from "./leave-details-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatIstDate } from "@/lib/date";

// Backend GET /application/all returns every application unpaginated, so both
// filtering and paging happen client-side here.
const PAGE_SIZE = 10;

export default function AdminLeavePage() {
  const { applications } = useLeave({ all: true });

  const [reviewLeave, setReviewLeave] = useState<LeaveT>();

  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">(
    "approved",
  );

  const [viewLeave, setViewLeave] = useState<LeaveT>();

  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const [page, setPage] = useState(1);

  const filteredItems =
    applications.data?.items?.filter(
      (item) => !statusFilter || item.status === statusFilter,
    ) ?? [];

  const totalPages = Math.max(Math.ceil(filteredItems.length / PAGE_SIZE), 1);

  const pageItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 🔥 auto-clamp when filtering shrinks the list
  if (page > totalPages) {
    setPage(totalPages);
  }

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
          <CardTitle>Leave Requests</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {/* Status filter */}

          <div className="flex flex-wrap gap-2 px-4 py-2">
            {[
              { label: "All", value: null },
              { label: "Pending", value: "pending" },
              { label: "Approved", value: "approved" },
              { label: "Rejected", value: "rejected" },
            ].map(({ label, value }) => (
              <Button
                key={label}
                size="sm"
                variant={statusFilter === value ? "default" : "outline"}
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>

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
              {applications.isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No leave applications found.
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((leave) => (
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
                      {formatIstDate(leave.startDate)}

                      {" - "}

                      {formatIstDate(leave.endDate)}
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
                            aria-label="Approve"
                            onClick={() => {
                              setReviewStatus("approved");
                              setReviewLeave(leave);
                            }}
                          >
                            <Check />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Reject"
                            onClick={() => {
                              setReviewStatus("rejected");
                              setReviewLeave(leave);
                            }}
                          >
                            <X />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}

      {totalPages > 1 && (
        <div className="flex justify-end px-4 py-4">
          <PaginationFooter
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      <ReviewLeaveDialog
        leave={reviewLeave}
        initialStatus={reviewStatus}
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
