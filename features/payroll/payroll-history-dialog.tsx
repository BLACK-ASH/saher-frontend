"use client";

import { useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationFooter } from "@/components/pagination-footer";
import { usePayrollByUser } from "@/hooks/use-payroll";
import { formatIstDate } from "@/lib/date";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import { useUserMap } from "@/hooks/use-user-map";

interface PayrollHistoryDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PayrollHistoryDialog({ userId, open, onOpenChange }: PayrollHistoryDialogProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePayrollByUser(open ? userId : null, page);
  const { resolveName } = useUserMap();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payroll history — {resolveName(userId ?? undefined)}</DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Expected ₹</TableHead>
              <TableHead>Paid ₹</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center">
                  <DefaultLoader />
                </TableCell>
              </TableRow>
            ) : !data?.items.length ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center">
                  <NoData title="No payroll history" description="No payroll records found for this employee." />
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{formatIstDate(item.dateOfCreation)}</TableCell>
                  <TableCell>₹{item.expectedSalary.toLocaleString()}</TableCell>
                  <TableCell>₹{(item.paidSalary ?? 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <span className="capitalize">{item.status.replace("-", " ")}</span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {(data?.totalPages ?? 0) > 1 && (
          <div className="flex justify-end px-4">
            <PaginationFooter page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}