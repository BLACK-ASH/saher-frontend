"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PaginationFooter } from "@/components/pagination-footer";
import { CheckCircle2, XCircle, PauseCircle, Eye } from "lucide-react";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import { BillResponse } from "@/services/reimbursement.api";
import { BillStatusBadge } from "./bill-status-badge";
import { BillDetailDialog } from "./bill-detail-dialog";
import { formatIstDate } from "@/lib/date";
import { NormalizedList } from "@/lib/normalize-list";
import { useUserMap } from "@/hooks/use-user-map";

interface FinanceBillTableProps {
  data?: NormalizedList<BillResponse>;
  isLoading?: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onHandle: (bill: BillResponse, status: "accept" | "reject" | "on-hold") => void;
  onOpen?: (bill: BillResponse) => void;
  bulkProgress?: { done: number; total: number } | null;
}

function SelectAllCheckbox({ checked, onChange, disabled }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      aria-label="Select all"
    />
  );
}

export function FinanceBillTable({
  data,
  isLoading,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  onHandle,
  onOpen,
  bulkProgress,
}: FinanceBillTableProps) {
  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const { resolveName } = useUserMap();
  const isBulkRunning = !!bulkProgress;
  const allSelected = items.length > 0 && items.every((bill) => selectedIds.has(bill.id));

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><SelectAllCheckbox checked={false} onChange={() => {}} disabled /></TableHead>
            <TableHead>User</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount ₹</TableHead>
            <TableHead>Advance ₹</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={8} className="py-10 text-center"><DefaultLoader /></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  if (items.length === 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><SelectAllCheckbox checked={false} onChange={() => {}} disabled /></TableHead>
            <TableHead>User</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount ₹</TableHead>
            <TableHead>Advance ₹</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={8} className="py-10 text-center"><NoData title="No bills" description="No bills found for the selected filters." /></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><SelectAllCheckbox checked={allSelected} onChange={onToggleAll} disabled={isBulkRunning} /></TableHead>
            <TableHead>User</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount ₹</TableHead>
            <TableHead>Advance ₹</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((bill) => (
            <TableRow key={bill.id} onClick={() => onOpen?.(bill)} className="cursor-pointer hover:bg-muted/50">
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(bill.id)}
                  onCheckedChange={(checked: boolean) => onToggleSelect(bill.id, checked)}
                  disabled={isBulkRunning}
                  aria-label={`Select bill ${bill.id.slice(-6)}`}
                />
              </TableCell>
              <TableCell>{resolveName(bill.user)}</TableCell>
              <TableCell className="max-w-[200px] truncate">{bill.description}</TableCell>
              <TableCell>₹{bill.amount.toLocaleString()}</TableCell>
              <TableCell>₹{bill.advance.toLocaleString()}</TableCell>
              <TableCell>{formatIstDate(bill.date)}</TableCell>
              <TableCell><BillStatusBadge status={bill.status} /></TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onHandle(bill, "accept"); }}
                    disabled={isBulkRunning}
                    aria-label="Accept"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onHandle(bill, "reject"); }}
                    disabled={isBulkRunning}
                    aria-label="Reject"
                  >
                    <XCircle className="h-4 w-4 text-red-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onHandle(bill, "on-hold"); }}
                    disabled={isBulkRunning}
                    aria-label="Hold"
                  >
                    <PauseCircle className="h-4 w-4 text-yellow-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onOpen?.(bill); }}
                    aria-label="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex justify-end px-4 py-4">
          <PaginationFooter page={data?.page ?? 1} totalPages={totalPages} onPageChange={() => {}} />
        </div>
      )}
    </div>
  );
}