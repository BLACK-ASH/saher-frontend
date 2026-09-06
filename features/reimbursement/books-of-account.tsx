"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/refresh-button";
import { PaginationFooter } from "@/components/pagination-footer";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import { useAuditLog } from "@/hooks/use-audit-log";
import { exportAuditLogReport } from "@/services/reimbursement.api";
import { toastExportMessage } from "@/lib/export-message";
import { formatIstDateTime } from "@/lib/date";

const PAGE_SIZE = 10;

export function BooksOfAccountTable() {
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const { data, isFetching, refetch } = useAuditLog(page, PAGE_SIZE);

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleExport = async () => {
    setExporting(true);
    try {
      const { message } = await exportAuditLogReport("xlsx");
      toastExportMessage(message, toast);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start report generation";
      toast.error(message);
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <RefreshButton onClick={() => refetch()} refreshing={isFetching} />
        <Button variant="outline" onClick={handleExport} disabled={exporting} className="gap-2">
          <Download className="h-4 w-4" />
          {exporting ? "Requesting…" : "Export"}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead className="text-right">Amount ₹</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isFetching && !items.length ? (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center"><DefaultLoader /></TableCell>
            </TableRow>
          ) : !items.length ? (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center">
                <NoData title="No ledger entries" description="No money movements recorded yet." />
              </TableCell>
            </TableRow>
          ) : (
            items.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap">{formatIstDateTime(entry.date)}</TableCell>
                <TableCell className="max-w-[280px] truncate">{entry.description}</TableCell>
                <TableCell>{entry.from}</TableCell>
                <TableCell>{entry.to}</TableCell>
                <TableCell className="text-right">
                  ₹{entry.amount.toLocaleString("en-IN")}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex justify-end">
          <PaginationFooter page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}