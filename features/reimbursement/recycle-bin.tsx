"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { NoData } from "@/components/no-data";
import { BillResponse } from "@/services/reimbursement.api";
import { formatIstDate } from "@/lib/date";
import { useReimbursement, useRecycleBills } from "@/hooks/use-reimbursement";
import { TrashTabPattern } from "@/components/shared/trash-tab-pattern";
import { useUserMap } from "@/hooks/use-user-map";

export function RecycleBin() {
  const { restore } = useReimbursement();
  const { data: items = [], isLoading } = useRecycleBills();
  const { resolveName } = useUserMap();

  const handleRestore = (billId: string) => {
    restore.mutate(billId);
  };

  return (
    <TrashTabPattern
      title="Recycle Bin"
      description="Deleted bills can be restored here."
    >
      {isLoading ? (
        <div className="py-10 text-center">Loading…</div>
      ) : items.length === 0 ? (
        <NoData title="Recycle Bin Empty" description="No deleted bills found." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount ₹</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell>{resolveName(bill.user)}</TableCell>
                <TableCell className="max-w-[200px] truncate">{bill.description}</TableCell>
                <TableCell>₹{bill.amount.toLocaleString()}</TableCell>
                <TableCell>{formatIstDate(bill.date)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRestore(bill.id)}
                    disabled={restore.isPending}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restore
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </TrashTabPattern>
  );
}