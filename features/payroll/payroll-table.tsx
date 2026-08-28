"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PaginationFooter } from "@/components/pagination-footer";
import { Wallet, History } from "lucide-react";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import { PayrollResponse } from "@/services/payroll.api";
import { formatIstDate } from "@/lib/date";
import { NormalizedList } from "@/lib/normalize-list";
import { useUserMap } from "@/hooks/use-user-map";

interface PayrollTableProps {
  data?: NormalizedList<PayrollResponse>;
  isLoading?: boolean;
  page: number;
  onPageChange: (page: number) => void;
  onRecordPayment: (payroll: PayrollResponse) => void;
  onViewHistory: (payroll: PayrollResponse) => void;
}

function getStatusColor(status: PayrollResponse["status"]): "default" | "secondary" | "destructive" | "outline" | "success" {
  switch (status) {
    case "paid":
      return "success";
    case "approved":
      return "secondary";
    case "partially-paid":
      return "outline";
    case "unpaid":
      return "default";
    default:
      return "default";
  }
}

export function PayrollBadge({ status }: { status: PayrollResponse["status"] }) {
  return <Badge variant={getStatusColor(status)}>{status.replace("-", " ")}</Badge>;
}

export function PayrollTable({
  data,
  isLoading,
  page,
  onPageChange,
  onRecordPayment,
  onViewHistory,
}: PayrollTableProps) {
  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const { resolveName } = useUserMap();

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Expected ₹</TableHead>
            <TableHead>Paid ₹</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={7} className="py-10 text-center">
              <DefaultLoader />
            </TableCell>
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
            <TableHead>Employee</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Expected ₹</TableHead>
            <TableHead>Paid ₹</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={7} className="py-10 text-center">
              <NoData title="No payroll records" description="No payroll records found for the selected filters." />
            </TableCell>
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
            <TableHead>Employee</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Expected ₹</TableHead>
            <TableHead>Paid ₹</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((payroll) => {
            const paid = payroll.paidSalary ?? 0;
            const pct = payroll.expectedSalary > 0
              ? Math.min(Math.max((paid / payroll.expectedSalary) * 100, 0), 100)
              : 0;
            return (
              <TableRow key={payroll.id}>
                <TableCell className="font-medium">{resolveName(payroll.user)}</TableCell>
                <TableCell>{formatIstDate(payroll.dateOfCreation)}</TableCell>
                <TableCell>₹{payroll.expectedSalary.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <span>₹{paid.toLocaleString()}</span>
                    {payroll.expectedSalary > 0 && (
                      <Progress value={pct} className="h-1.5" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <PayrollBadge status={payroll.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewHistory(payroll)}
                      aria-label="View history"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    {payroll.status !== "paid" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRecordPayment(payroll)}
                        aria-label="Record payment"
                      >
                        <Wallet className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex justify-end px-4 py-4">
          <PaginationFooter
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}