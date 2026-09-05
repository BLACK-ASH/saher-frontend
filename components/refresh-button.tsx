"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function RefreshButton({
  onClick,
  refreshing = false,
}: {
  onClick: () => void;
  refreshing?: boolean;
}) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={refreshing}
      className="gap-2"
      aria-label="Refresh data"
    >
      <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
      Refresh
    </Button>
  );
}