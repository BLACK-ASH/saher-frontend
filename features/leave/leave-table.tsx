"use client";

import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";

import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";

import { CalendarRange, Eye, FileCheck, Pencil } from "lucide-react";

import { MetaResponse } from "@/lib/api-wrapper";
import { LeaveT } from "@/services/leave.api";

import { PaginationFooter } from "@/components/pagination-footer";

import LeaveStatusBadge from "./leave-status-badge";
import LeaveDetailsDialog from "./leave-details-dialog";
import { formatIstDate } from "@/lib/date";

type Props = {
  data: LeaveT[];
  loading?: boolean;
  meta?: MetaResponse;
  onEdit?: (leave: LeaveT) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
};

export default function LeaveTable({
  data,
  loading,
  onEdit,
  page,
  totalPages,
  onPageChange,
}: Props) {
  const [selected, setSelected] = useState<LeaveT>();

  if (loading) {
    return (
      <Card>
        <CardContent className="py-20 text-center text-muted-foreground">
          Loading leave applications...
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <CardContent className="py-20 text-center text-muted-foreground">
          No leave applications found.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leave</TableHead>

                <TableHead>Duration</TableHead>

                <TableHead>Days</TableHead>

                <TableHead>Status</TableHead>

                <TableHead>Proof</TableHead>

                <TableHead className="w-24 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{leave.type.name}</p>

                      <p className="text-xs text-muted-foreground">
                        {leave.reason}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarRange className="h-4 w-4 text-muted-foreground" />

                      <span>
                        {formatIstDate(leave.startDate)}
                      </span>

                      <span>—</span>

                      <span>
                        {formatIstDate(leave.endDate)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>{leave.totalDays}</TableCell>

                  <TableCell>
                    <LeaveStatusBadge status={leave.status} />
                  </TableCell>

                  <TableCell>
                    {leave.proof ? (
                      <FileCheck className="h-5 w-5 text-primary" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setSelected(leave)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {leave.status === "pending" && onEdit && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onEdit(leave)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages && totalPages > 1 && (
        <div className="flex justify-end py-4">
          <PaginationFooter
            page={page ?? 1}
            totalPages={totalPages}
            onPageChange={onPageChange ?? (() => {})}
          />
        </div>
      )}

      <LeaveDetailsDialog
        leave={selected}
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(undefined);
        }}
      />
    </>
  );
}
