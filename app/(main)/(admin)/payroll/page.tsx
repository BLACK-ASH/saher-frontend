"use client";

import { useState, useEffect } from "react";

import RoleGuard from "@/components/role-guard";
import { can } from "@/lib/permissions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Loader2, Play } from "lucide-react";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import { usePayroll } from "@/hooks/use-payroll";
import { PayrollResponse } from "@/services/payroll.api";

import { PayrollTable } from "@/features/payroll/payroll-table";
import PayrollHistoryDialog from "@/features/payroll/payroll-history-dialog";
import RecordPaymentDialog from "@/features/payroll/record-payment-dialog";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = [
  { label: "All", value: 0 },
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },
];

export default function AdminPayrollPage() {
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(0);
  const [page, setPage] = useState(1);
  const [recordPaymentPayroll, setRecordPaymentPayroll] = useState<PayrollResponse | null>(null);
  const [viewHistoryPayroll, setViewHistoryPayroll] = useState<PayrollResponse | null>(null);
  const [runConfirmOpen, setRunConfirmOpen] = useState(false);

  const { data, isLoading, run } = usePayroll(year === 0 ? 0 : year, month, page);

  // Reset page when filters change
  useEffect(() => {
    // eslint-disable-next-line
    setPage(1);
  }, [year, month]);

  const handleRecordPayment = (payroll: PayrollResponse) => {
    setRecordPaymentPayroll(payroll);
  };

  const handleViewHistory = (payroll: PayrollResponse) => {
    setViewHistoryPayroll(payroll);
  };

  const handleRunNow = async () => {
    setRunConfirmOpen(false);
    await run.mutateAsync();
  };

  return (
    <RoleGuard allow={(r) => can(r, "read", "payroll")}>
      <div className="container space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Payroll</h1>
          <p className="text-muted-foreground">
            Manage payroll records, record installments, and trigger generation.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle>Payroll Records</CardTitle>
              <div className="flex flex-wrap items-center gap-4">
                <Select value={year.toString()} onValueChange={(v) => setYear(Number(v))}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">All Years</SelectItem>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={month.toString()} onValueChange={(v) => setMonth(Number(v))}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <AlertDialog open={runConfirmOpen} onOpenChange={setRunConfirmOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={run.isPending}
                      className="gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Run Now
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Generate Payroll?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Generate payroll for all employees now? This may take a while.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleRunNow}
                        disabled={run.isPending}
                      >
                        {run.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating…
                          </>
                        ) : (
                          "Confirm"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <PayrollTable
              data={data}
              isLoading={isLoading}
              filters={{ year: year === 0 ? undefined : year, month: month === 0 ? undefined : month }}
              page={page}
              onPageChange={setPage}
              onRecordPayment={handleRecordPayment}
              onViewHistory={handleViewHistory}
            />
          </CardContent>
        </Card>

        <RecordPaymentDialog
          payroll={recordPaymentPayroll}
          open={!!recordPaymentPayroll}
          onOpenChange={(open: boolean) => {
            if (!open) setRecordPaymentPayroll(null);
          }}
        />

        <PayrollHistoryDialog
          payrollId={viewHistoryPayroll?.id ?? null}
          open={!!viewHistoryPayroll}
          onOpenChange={(open: boolean) => {
            if (!open) setViewHistoryPayroll(null);
          }}
        />
      </div>
    </RoleGuard>
  );
}