"use client";
import { useState } from "react";
import { BalanceCard } from "@/features/reimbursement/balance-card";
import { BillTable } from "@/features/reimbursement/bill-table";
import { CreateBillDialog } from "@/features/reimbursement/create-bill-dialog";
import { EditBillDialog } from "@/features/reimbursement/edit-bill-dialog";
import { useReimbursement } from "@/hooks/use-reimbursement";
import { BillResponse } from "@/services/reimbursement.api";
import { Button } from "@/components/ui/button";

export default function MyBillsPage() {
  const { bills } = useReimbursement();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editBill, setEditBill] = useState<BillResponse | null>(null);

  return (
    <div className="p-4 space-y-4">
      <BalanceCard />
      <Button onClick={() => setIsCreateOpen(true)}>New Bill</Button>
      <BillTable bills={bills.data ?? []} onView={() => {}} onEdit={(bill) => setEditBill(bill)} />
      <CreateBillDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <EditBillDialog bill={editBill} open={!!editBill} onOpenChange={(open) => { if (!open) setEditBill(null); }} />
    </div>
  );
}
