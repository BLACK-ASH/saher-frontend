"use client";

import { useState, useEffect, useCallback } from "react";

import RoleGuard from "@/components/role-guard";
import { can } from "@/lib/permissions";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

import { useReimbursement, useSearchBills, type HandleStatus } from "@/hooks/use-reimbursement";
import { useUserMap } from "@/hooks/use-user-map";
import { BillResponse } from "@/services/reimbursement.api";

import { FinanceBillTable } from "@/features/reimbursement/finance-bill-table";
import HandleBillDialog from "@/features/reimbursement/handle-bill-dialog";
import { BulkActionBar } from "@/features/reimbursement/bulk-action-bar";
import { RecycleBin } from "@/features/reimbursement/recycle-bin";
import { BillDetailDialog } from "@/features/reimbursement/bill-detail-dialog";

const DEBOUNCE_MS = 300;

export default function ReimbursementManagementPage() {
  const {
    handleMany,
    bulkProgress,
  } = useReimbursement();

  const { userMap } = useUserMap();

  const [activeTab, setActiveTab] = useState<"queue" | "recycle">("queue");
  const [page, setPage] = useState(1);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("pending");
  const [userId, setUserId] = useState("");
  const [date, setDate] = useState("");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dialogs
  const [handleDialog, setHandleDialog] = useState<{ bill: BillResponse | null; status: HandleStatus }>({ bill: null, status: "accept" });
  const [detailBill, setDetailBill] = useState<BillResponse | null>(null);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchText), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchText]);

  // Build filters
  const filters = {
    description: debouncedSearch || undefined,
    amount: /^\d+$/.test(debouncedSearch) ? Number(debouncedSearch) : undefined,
    status: status === "all" ? undefined : status,
    user: userId || undefined,
    date: date || undefined,
    isDeleted: "false" as const,
  };

  const searchQuery = useSearchBills(filters, page);
  const data = searchQuery.data;
  const isLoading = searchQuery.isLoading;

  // Reset page when filters change
  // Note: This is intentional - we only want to reset page when filters change
  // The exhaustive-deps warning is expected and acceptable here
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status, userId, date]);

  // Clear selection when data changes significantly
  useEffect(() => {
    if (selectedIds.size > 0 && data?.items) {
      const stillValid = data.items.some((bill) => selectedIds.has(bill.id));
      if (!stillValid) setSelectedIds(new Set());
    }
  }, [data?.items, selectedIds]);

  const handleToggleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback((checked: boolean) => {
    if (checked && data?.items) {
      setSelectedIds(new Set(data.items.map((b) => b.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [data?.items]);

  const handleRowHandle = useCallback((bill: BillResponse, status: HandleStatus) => {
    setHandleDialog({ bill, status });
  }, []);

  const handleOpenDetail = useCallback((bill: BillResponse) => {
    setDetailBill(bill);
  }, []);

  const handleBulkAction = useCallback(async (status: "accept" | "reject", reason: string) => {
    if (selectedIds.size === 0) return;
    await handleMany(
      Array.from(selectedIds).map((billId) => ({ billId, status, reason }))
    );
    setSelectedIds(new Set());
  }, [selectedIds, handleMany]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return (
    <RoleGuard allow={(r) => can(r, "read", "preReimbursement")}>
      <div className="container space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Bill Management</h1>
          <p className="text-muted-foreground">
            Process bills: approve, reject, hold, and manage deleted items.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "queue" | "recycle")} className="space-y-4">
          <TabsList>
            <TabsTrigger value="queue">Handle Queue</TabsTrigger>
            <TabsTrigger value="recycle">Recycle Bin</TabsTrigger>
          </TabsList>

          <TabsContent value="queue">
            <div className="flex flex-wrap gap-4 p-4 border rounded-lg bg-card">
              {/* Search Input */}
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search description or amount…"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  aria-label="Search bills"
                />
              </div>

              {/* Status Select */}
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accept">Accepted</SelectItem>
                  <SelectItem value="reject">Rejected</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>

              {/* User Select */}
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Users</SelectItem>
                  {Array.from(userMap.entries()).map(([id, name]) => (
                    <SelectItem key={id} value={id}>
                      {name} ({id.slice(-6)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Input */}
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-[160px]"
                aria-label="Filter by date"
              />

              {/* Export placeholder */}
              <Button variant="outline" disabled className="ml-auto gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>

            <FinanceBillTable
              data={data}
              isLoading={isLoading}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleAll={handleToggleAll}
              onHandle={handleRowHandle}
              onOpen={handleOpenDetail}
              bulkProgress={bulkProgress}
            />

            {selectedIds.size > 0 && (
              <BulkActionBar
                count={selectedIds.size}
                bulkProgress={bulkProgress}
                onAction={handleBulkAction}
                onClear={handleClearSelection}
              />
            )}
          </TabsContent>

          <TabsContent value="recycle">
            <RecycleBin />
          </TabsContent>
        </Tabs>

        {/* Handle Bill Dialog */}
        <HandleBillDialog
          bill={handleDialog.bill}
          initialStatus={handleDialog.status}
          open={!!handleDialog.bill}
          onOpenChange={(open: boolean) => {
            if (!open) setHandleDialog({ bill: null, status: "accept" });
          }}
        />

        {/* Bill Detail Dialog */}
        <BillDetailDialog
          bill={detailBill}
          open={!!detailBill}
          onOpenChange={(open: boolean) => {
            if (!open) setDetailBill(null);
          }}
        />
      </div>
    </RoleGuard>
  );
}