"use client";

import { Badge } from "@/components/ui/badge";

type ExpiryStatus = "active" | "expiring" | "expired";

// D-03: green (>3 days), yellow (≤3 days), red (expired).
export const getExpiryStatus = (expiresAt: string): ExpiryStatus => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  if (expiry <= now) return "expired";
  const daysRemaining = Math.ceil(
    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysRemaining <= 3) return "expiring";
  return "active";
};

const variantMap: Record<
  ExpiryStatus,
  "outline-success" | "outline-warn" | "destructive"
> = {
  active: "outline-success",
  expiring: "outline-warn",
  expired: "destructive",
};

const labelMap: Record<ExpiryStatus, string> = {
  active: "Active",
  expiring: "Expiring Soon",
  expired: "Expired",
};

export function NoticeExpiryBadge({ expiresAt }: { expiresAt: string }) {
  const status = getExpiryStatus(expiresAt);
  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>;
}
