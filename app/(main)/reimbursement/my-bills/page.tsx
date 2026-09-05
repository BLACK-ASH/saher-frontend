"use client";
import { useState } from "react";
import { BalanceCard } from "@/features/reimbursement/balance-card";
import { BillTable } from "@/features/reimbursement/bill-table";
import { CreateBillDialog } from "@/features/reimbursement/create-bill-dialog";
import { EditBillDialog } from "@/features/reimbursement/edit-bill-dialog";
import { BillDetailDialog } from "@/features/reimbursement/bill-detail-dialog";
import { useReimbursement } from "@/hooks/use-reimbursement";
import { BillResponse } from "@/services/reimbursement.api";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/refresh-button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function MyBillsPage() {
  const { bills, withdraw } = useReimbursement();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editBill, setEditBill] = useState<BillResponse | null>(null);
  const [detailBill, setDetailBill] = useState<BillResponse | null>(null);
  const [withdrawTarget, setWithdrawTarget] = useState<BillResponse | null>(null);

  const confirmWithdraw = () => {
    if (!withdrawTarget) return;
    withdraw.mutate(withdrawTarget.id, {
      onSuccess: () => {
        toast.success("Bill withdrawn");
        setWithdrawTarget(null);
      },
    });
  };

  return (
    <div className="p-4 space-y-4">
      <BalanceCard />
      <div className="flex gap-2">
        <Button onClick={() => setIsCreateOpen(true)}>New Bill</Button>
        <RefreshButton onClick={() => bills.refetch()} refreshing={bills.isFetching} />
      </div>
      <BillTable
        bills={bills.data ?? []}
        onView={(bill) => setDetailBill(bill)}
        onEdit={(bill) => setEditBill(bill)}
        onWithdraw={(bill) => setWithdrawTarget(bill)}
      />
      <CreateBillDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <EditBillDialog bill={editBill} open={!!editBill} onOpenChange={(open) => { if (!open) setEditBill(null); }} />
      <BillDetailDialog bill={detailBill} open={!!detailBill} onOpenChange={(open) => { if (!open) setDetailBill(null); }} />

      <AlertDialog open={!!withdrawTarget} onOpenChange={(open) => { if (!open) setWithdrawTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw this bill?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the bill to the recycle bin. This action can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmWithdraw} disabled={withdraw.isPending}>
              {withdraw.isPending ? "Withdrawing…" : "Withdraw"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
