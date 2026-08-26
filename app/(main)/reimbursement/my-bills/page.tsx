"use client";
import { useState } from "react";
import { BalanceCard } from "@/features/reimbursement/balance-card";
import { BillTable } from "@/features/reimbursement/bill-table";
import { CreateBillDialog } from "@/features/reimbursement/create-bill-dialog";
import { useReimbursement } from "@/hooks/use-reimbursement";
import { Button } from "@/components/ui/button";

export default function MyBillsPage() {
  const { bills } = useReimbursement();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="p-4 space-y-4">
      <BalanceCard />
      <Button onClick={() => setIsCreateOpen(true)}>New Bill</Button>
      <BillTable bills={bills.data ?? []} onView={() => {}} />
      <CreateBillDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
