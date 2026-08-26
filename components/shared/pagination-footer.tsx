"use client";
import { Button } from "@/components/ui/button";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";

type PaginationFooterProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function PaginationFooter({
  page,
  totalPages,
  onPageChange,
}: PaginationFooterProps) {
  const safe =
    Number.isFinite(totalPages) && totalPages >= 1;
  const max = safe ? totalPages : 1;
  const readout = safe ? `${page} of ${totalPages}` : "1 of --";

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">Page {readout}</span>
      <Button
        variant="outline"
        size="icon"
        disabled={page <= 1 || !safe}
        onClick={() => onPageChange(1)}
      >
        <ChevronsLeft />
      </Button>
      <Button
        variant="outline"
        size="icon"
        disabled={page <= 1 || !safe}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft />
      </Button>
      <Button
        variant="outline"
        size="icon"
        disabled={page >= max || !safe}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight />
      </Button>
      <Button
        variant="outline"
        size="icon"
        disabled={page >= max || !safe}
        onClick={() => onPageChange(max)}
      >
        <ChevronsRight />
      </Button>
    </div>
  );
}
