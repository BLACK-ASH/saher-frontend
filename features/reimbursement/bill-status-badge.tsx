import { Badge } from "@/components/ui/badge";
import { z } from "zod";

// D-08 status enum
export const billStatusSchema = z.enum(["pending", "accept", "reject", "on-hold"]);
export type BillStatus = z.infer<typeof billStatusSchema>;

export const getStatusColor = (status: BillStatus): "default" | "secondary" | "destructive" | "outline" | "success" => {
  switch (status) {
    case "pending":
      return "default";
    case "accept":
      return "success";
    case "reject":
      return "destructive";
    case "on-hold":
      return "secondary";
    default:
      return "default";
  }
};

export function BillStatusBadge({ status }: { status: BillStatus }) {
  return <Badge variant={getStatusColor(status)}>{status}</Badge>;
}

// D-11 settlement status enum
export const settlementStatusSchema = z.enum(["pending", "settle", "expired", "on-hold"]);
export type SettlementStatus = z.infer<typeof settlementStatusSchema>;

const getSettlementStatusColor = (
  status: SettlementStatus,
): "default" | "secondary" | "destructive" | "outline" | "success" => {
  switch (status) {
    case "pending":
      return "default";
    case "settle":
      return "success";
    case "expired":
      return "destructive";
    case "on-hold":
      return "secondary";
    default:
      return "default";
  }
};

export function SettlementStatusBadge({ status }: { status: SettlementStatus | null }) {
  if (!status) return <span className="text-sm text-muted-foreground">—</span>;
  return <Badge variant={getSettlementStatusColor(status)}>{status}</Badge>;
}