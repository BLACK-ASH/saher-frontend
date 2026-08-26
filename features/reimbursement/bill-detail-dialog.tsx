import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BillResponse } from "@/services/reimbursement.api";

interface BillDetailDialogProps {
  bill: BillResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BillDetailDialog({ bill, open, onOpenChange }: BillDetailDialogProps) {
  if (!bill) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bill Details</DialogTitle>
        </DialogHeader>
        <p>Description: {bill.description}</p>
        <p>Amount: {bill.amount}</p>
        <p>Date: {bill.date}</p>
        {/* Receipt lightbox would go here */}
      </DialogContent>
    </Dialog>
  );
}
