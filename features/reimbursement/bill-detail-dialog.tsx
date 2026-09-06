"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BillResponse, SettlementResponse, getSettlementByBill, getAuditLog, exportReport } from "@/services/reimbursement.api";
import { LifecycleTimeline } from "./lifecycle-timeline";
import { SettleDialog } from "./settle-dialog";
import { formatIstDate, formatIstDateTime } from "@/lib/date";
import { PaginationFooter } from "@/components/pagination-footer";
import { DefaultLoader } from "@/components/loading";
import { useUserMap } from "@/hooks/use-user-map";

interface BillDetailDialogProps {
  bill: BillResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewerCanAudit?: boolean;
}

const AUDIT_PAGE_SIZE = 5;

export function BillDetailDialog({ bill, open, onOpenChange, viewerCanAudit = false }: BillDetailDialogProps) {
  const [settleOpen, setSettleOpen] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const { resolveName } = useUserMap();

  const { data: settlement, isLoading: loadingSettlement } = useQuery({
    queryKey: ["bills", "detail", bill?.id],
    queryFn: () => getSettlementByBill(bill!.id),
    enabled: viewerCanAudit && open && !!bill,
  });

  const { data: audit, isLoading: loadingAudit } = useQuery({
    queryKey: ["audit-log", auditPage],
    queryFn: () => getAuditLog(auditPage, AUDIT_PAGE_SIZE),
    enabled: viewerCanAudit && open && !!bill,
  });

  if (!bill) return null;

  const handleSingleExport = async (format: "pdf" | "xlsx") => {
    try {
      await exportReport(format, { bill: bill.id });
      toast.success("Report generation started — check notifications for download");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start report generation";
      toast.error(message);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bill Details — {bill.id.slice(-6)}</DialogTitle>
          </DialogHeader>

          {viewerCanAudit && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => handleSingleExport("pdf")}>
                <FileDown className="h-4 w-4 mr-1" /> Export PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleSingleExport("xlsx")}>
                <FileSpreadsheet className="h-4 w-4 mr-1" /> Export Excel
              </Button>
            </div>
          )}

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">User:</span> {resolveName(bill.user)}
              </div>
              <div>
                <span className="font-medium">Description:</span> {bill.description}
              </div>
              <div>
                <span className="font-medium">Amount:</span> ₹{bill.amount.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Advance:</span> ₹{bill.advance.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Submitted:</span> {formatIstDate(bill.date)}
              </div>
              <div>
                <span className="font-medium">Status:</span> {bill.status}
              </div>
            </div>

            {bill.images.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Receipts</h4>
                <div className="flex gap-2 flex-wrap">
                  {bill.images.map((img) => (
                    <a key={img.id} href={img.src} target="_blank" rel="noopener noreferrer" className="group">
                      <img src={img.src} alt={img.alt || "Receipt"} className="h-32 w-32 object-cover rounded-md border group-hover:opacity-80" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Settlement + lifecycle only for finance viewers (endpoint requires preReimbursement:read) */}
            {viewerCanAudit && (
              <LifecycleTimeline bill={bill} settlement={settlement ?? null} />
            )}

            {viewerCanAudit && bill.status === "accept" && (
              <div className="pt-4 border-t">
                {loadingSettlement ? (
                  <p className="text-sm text-muted-foreground">Loading settlement...</p>
                ) : settlement ? (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {settlement.status === "settle" ? "Settlement complete" : "Pending Settlement"}
                      </p>
                      {settlement.status === "pending" && (
                        <p className="text-xs text-muted-foreground">
                          Expires: {formatIstDate(settlement.expiredAt)}
                        </p>
                      )}
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

            {viewerCanAudit && (
              <div className="pt-4 border-t">
                <h4 className="font-medium text-sm mb-2">Audit Log</h4>
                {loadingAudit ? (
                  <DefaultLoader />
                ) : !audit?.items.length ? (
                  <p className="text-sm text-muted-foreground">No audit entries.</p>
                ) : (
                  <>
                    <ul className="space-y-2 text-sm">
                      {audit!.items.map((entry) => (
                        <li key={entry.id} className="border rounded-md p-2">
                          <div className="flex justify-between">
                            <span className="font-medium">₹{entry.amount.toLocaleString("en-IN")}</span>
                            <span className="text-muted-foreground">{formatIstDateTime(entry.date)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{entry.description}</p>
                        </li>
                      ))}
                    </ul>
                    {(audit?.totalPages ?? 1) > 1 && (
                      <div className="flex justify-end pt-2">
                        <PaginationFooter
                          page={auditPage}
                          totalPages={audit?.totalPages ?? 1}
                          onPageChange={setAuditPage}
                        />
                      </div>
                    )}
                  </>
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