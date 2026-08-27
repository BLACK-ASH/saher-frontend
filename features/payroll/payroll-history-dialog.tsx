"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePayrollHistory } from "@/hooks/use-payroll";
import { PayrollHistoryResponse } from "@/services/payroll.api";
import { formatIstDate } from "@/lib/date";
import { DefaultLoader } from "@/components/loading";

interface PayrollHistoryDialogProps {
  payrollId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PayrollHistoryDialog({ payrollId, open, onOpenChange }: PayrollHistoryDialogProps) {
  const { data, isLoading } = usePayrollHistory(payrollId ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payroll history</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-10 text-center">
              <DefaultLoader />
            </div>
          ) : !data?.length ? (
            <div className="py-10 text-center text-muted-foreground">No payroll history found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Mode</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.map((item: PayrollHistoryResponse) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatIstDate(item.date)}</TableCell>
                      <TableCell>₹{item.amount.toLocaleString()}</TableCell>
                      <TableCell>{item.mode === "-" ? "Other" : item.mode}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}