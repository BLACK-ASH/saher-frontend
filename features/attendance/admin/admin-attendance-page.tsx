"use client";
import { useState } from "react";
import { Check, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserSearchPicker } from "@/components/user-search-picker";
import type { MailUser } from "@/services/mail.api";
import { apiFetch } from "@/lib/api-wrapper";
import { dateToIstDateOnly } from "@/lib/date";
import type { AttendanceResponse } from "@/services/attendance.api";
import {
  useAdminAttendance,
  useMonthlyAttendance,
  useTodayAttendance,
} from "@/hooks/use-admin-attendance";
import { AdminAttendanceTable } from "./admin-attendance-table";
import { EmployeeAttendanceSheet } from "./employee-attendance-sheet";

type View = "range" | "today" | "monthly";

const now = new Date();
const currentYear = new Date().getFullYear();
const currentMonth = now.getMonth() + 1;
const monthDefault = () => ({
  startDate: dateToIstDateOnly(new Date(now.getFullYear(), now.getMonth(), 1)),
  endDate: dateToIstDateOnly(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
});
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);

export function AdminAttendancePage() {
  const [view, setView] = useState<View>("range");
  const [startDate, setStartDate] = useState(monthDefault().startDate);
  const [endDate, setEndDate] = useState(monthDefault().endDate);
  const [page, setPage] = useState(1);
  const [employee, setEmployee] = useState<MailUser | null>(null);
  const [mYear, setMYear] = useState(currentYear);
  const [mMonth, setMMonth] = useState(currentMonth);
  const [selectedEmployee, setSelectedEmployee] = useState<AttendanceResponse | null>(null);
  const [format, setFormat] = useState<"pdf" | "xlsx">("pdf");
  const [isGenerating, setIsGenerating] = useState(false);

  const employeeId = employee?.id ?? "";

  const handleViewChange = (next: View) => {
    setView(next);
    setPage(1);
  };

  const filterByEmployee = (items: AttendanceResponse[]) =>
    employeeId ? items.filter((a) => a.user.id === employeeId) : items;

  const range = useAdminAttendance({ startDate, endDate }, page);
  const today = useTodayAttendance(page);
  const monthly = useMonthlyAttendance(mYear, mMonth, page);

  let data;
  if (view === "today") data = today;
  else if (view === "monthly") data = monthly;
  else data = range;

  const items = data.data ? filterByEmployee(data.data.items) : [];
  const tableData = data.data ? { ...data.data, items } : undefined;

  const handleApply = () => {
    setPage(1);
  };

  const handleReset = () => {
    const d = monthDefault();
    setStartDate(d.startDate);
    setEndDate(d.endDate);
    setEmployee(null);
    setPage(1);
  };

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      const userId = employeeId || "all";
      const res = await apiFetch(
        `/api/attendance/export/report?type=month&format=${format}&userId=${userId}`,
        { method: "GET" },
      );
      if (!res.success) toast.error(res.message);
      else toast.success("Report generation started — check notifications for the download.");
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">All Attendance</h1>
          <p className="text-muted-foreground">
            View all employees&apos; attendance, filter by employee, and export reports.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={isGenerating} className="gap-2">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem checked={format === "pdf"} onCheckedChange={() => setFormat("pdf")}>
              {format === "pdf" && <Check className="h-4 w-4" />}
              PDF
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={format === "xlsx"} onCheckedChange={() => setFormat("xlsx")}>
              {format === "xlsx" && <Check className="h-4 w-4" />}
              Excel (XLSX)
            </DropdownMenuCheckboxItem>
            <div className="border-t pt-1">
              <Button variant="default" size="sm" className="w-full gap-2" onClick={handleExport} disabled={isGenerating}>
                Generate
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { value: "range", label: "Range" },
            { value: "today", label: "Today" },
            { value: "monthly", label: "Monthly" },
          ] as { value: View; label: string }[]
        ).map(({ value, label }) => (
          <Button
            key={value}
            variant={view === value ? "secondary" : "ghost"}
            onClick={() => handleViewChange(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {view !== "today" && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
          {view === "range" && (
            <>
              <Field>
                <FieldLabel htmlFor="start-date">Start Date</FieldLabel>
                <Input id="start-date" type="date" value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="end-date">End Date</FieldLabel>
                <Input id="end-date" type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
              </Field>
            </>
          )}
          {view === "monthly" && (
            <>
              <Field>
                <FieldLabel>Year</FieldLabel>
                <Select value={mYear.toString()} onValueChange={(v) => setMYear(Number(v))}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Month</FieldLabel>
                <Select value={mMonth.toString()} onValueChange={(v) => setMMonth(Number(v))}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m} value={m.toString()}>{new Date(0, m, 0).toLocaleString("en", { month: "long" })}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}
          <div className="min-w-[220px]">
            <UserSearchPicker
              value={employee ? [employee] : []}
              onChange={(users) => setEmployee(users[0] ?? null)}
              label="Employee"
              placeholder="Search employee..."
              multiple={false}
            />
          </div>
          <Button variant="outline" onClick={handleApply}>Apply</Button>
          <Button variant="ghost" onClick={handleReset}>Reset</Button>
        </div>
      )}

      <AdminAttendanceTable
        data={tableData}
        isLoading={data.isLoading}
        isRefetching={data.isRefetching}
        refetch={data.refetch}
        page={data.data?.page ?? page}
        totalPages={data.data?.totalPages ?? 0}
        onPageChange={setPage}
        onRowClick={setSelectedEmployee}
      />

      <EmployeeAttendanceSheet
        userId={selectedEmployee?.user.id ?? ""}
        userName={selectedEmployee?.user.name ?? ""}
        userEmail={selectedEmployee?.user.email ?? ""}
        userImage={selectedEmployee?.user.image?.src}
        open={!!selectedEmployee}
        onOpenChange={(open) => {
          if (!open) setSelectedEmployee(null);
        }}
      />
    </div>
  );
}
