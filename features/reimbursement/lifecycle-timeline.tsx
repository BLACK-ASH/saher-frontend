"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIstDateTime } from "@/lib/date";
import { BillResponse, SettlementResponse } from "@/services/reimbursement.api";
import { BillStatusBadge } from "./bill-status-badge";

interface LifecycleTimelineProps {
  bill: BillResponse;
  settlement?: SettlementResponse | null;
}

const modeLabel = (mode: SettlementResponse["mode"]) =>
  mode === "-" ? "Other" : mode.toUpperCase();

export function LifecycleTimeline({ bill, settlement }: LifecycleTimelineProps) {
  const handled = bill.status !== "pending";
  const settled = settlement?.status === "settle";

  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Lifecycle</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative ml-3 border-l-2 border-muted pb-4 space-y-6">
          {/* Submitted — always recorded */}
          <div className="relative">
            <div className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-muted-foreground" />
            <div className="ml-4">
              <p className="text-sm font-medium">Submitted</p>
              <p className="text-xs text-muted-foreground">
                {formatIstDateTime(bill.date)}
              </p>
            </div>
          </div>

          {/* Handled — only when backend recorded it (bill.status !== pending) */}
          {handled && (
            <div className="relative">
              <div className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-muted-foreground" />
              <div className="ml-4">
                <p className="text-sm font-medium flex items-center gap-2">
                  Handled <BillStatusBadge status={bill.status} />
                </p>
                {bill.reason && (
                  <p className="text-xs text-muted-foreground">{bill.reason}</p>
                )}
              </div>
            </div>
          )}

          {/* Settled — driven solely by settlement data (D-17, no fabrication) */}
          {settled && (
            <div className="relative">
              <div className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium">
                  Settled via {modeLabel(settlement!.mode)}
                </p>
                {settlement!.settleDate && (
                  <p className="text-xs text-muted-foreground">
                    {formatIstDateTime(settlement!.settleDate)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Pending settlement node (D-21) */}
          {settlement && settlement.status === "pending" && (
            <div className="relative">
              <div className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium">Settlement Pending</p>
              </div>
            </div>
          )}

          {/* Terminal state when nothing further was recorded */}
          {!handled && !settlement && (
            <div className="relative">
              <div className="ml-4 text-xs text-muted-foreground">
                Not settled yet
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}