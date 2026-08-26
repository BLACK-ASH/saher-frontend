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
