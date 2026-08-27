"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BillResponse, getSettlementByBill } from "@/services/reimbursement.api";
import { LifecycleTimeline } from "./lifecycle-timeline";
import { SettleDialog } from "./settle-dialog";
import { formatIstDate } from "@/lib/date";

interface BillDetailDialogProps {
  bill: BillResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BillDetailDialog({ bill, open, onOpenChange }: BillDetailDialogProps) {
  const [settleOpen, setSettleOpen] = useState(false);

  const { data: settlement, isLoading: loadingSettlement } = useQuery({
    queryKey: ["settlement", bill?.id],
    queryFn: () => getSettlementByBill(bill!.id),
    enabled: open && bill?.status === "accept",
  });

  if (!bill) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bill Details — {bill.id.slice(-6)}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Description:</span> {bill.description}
              </div>
              <div>
                <span className="font-medium">Amount:</span> ₹{bill.amount.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Submitted:</span> {formatIstDate(bill.date)}
              </div>
              <div>
                <span className="font-medium">Status:</span> {bill.status}
              </div>
            </div>

            {bill.image && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Receipts</h4>
                <div className="flex gap-2">
                  <a href={bill.image} target="_blank" rel="noopener noreferrer" className="group">
                    <img src={bill.image} alt="Receipt" className="h-32 w-32 object-cover rounded-md border group-hover:opacity-80" />
                  </a>
                </div>
              </div>
            )}

            <LifecycleTimeline bill={bill} />

            {bill.status === "accept" && (
              <div className="pt-4 border-t">
                {loadingSettlement ? (
                  <p className="text-sm text-muted-foreground">Loading settlement...</p>
                ) : settlement ? (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm">Pending Settlement</p>
                      <p className="text-xs text-muted-foreground">
                        Expires: {formatIstDate(settlement.expiredAt)}
                      </p>
                    </div>
                    <Button onClick={() => setSettleOpen(true)} disabled={settlement.status === "settle"}>
                      {settlement.status === "settle" ? "Completed" : "Record Settlement"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-destructive">Settlement record missing</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SettleDialog settlement={settlement ?? null} open={settleOpen} onOpenChange={setSettleOpen} />
    </>
  );
}
