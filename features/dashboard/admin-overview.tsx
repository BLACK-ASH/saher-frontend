"use client";
import { useMemo } from "react";
import Link from "next/link";
import {
  Users,
  ClipboardCheck,
  ClockAlert,
  CalendarCheck,
  Wallet,
  UserPlus,
  UserCheck,
  UserX,
  Clock4,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMe } from "@/hooks/use-me";
import { useAdminUsers } from "@/hooks/use-admin";
import { useTodayAttendance } from "@/hooks/use-admin-attendance";
import { useLeave } from "@/hooks/use-leave";
import { useSearchBills } from "@/hooks/use-reimbursement";
import { TodayAttendanceTable } from "./today-attendance-table";

type Stat = {
  label: string;
  value: number;
  icon: typeof Users;
  href?: string;
  tone: "default" | "success" | "danger" | "warn";
};

const toneClass: Record<Stat["tone"], string> = {
  default: "text-foreground",
  success: "text-emerald-600",
  danger: "text-red-600",
  warn: "text-amber-600",
};

const quickActions = [
  { label: "All Attendance", url: "/attendance/all", icon: ClipboardCheck },
  { label: "Users", url: "/users", icon: Users },
  { label: "Attendance Correction", url: "/attendance-correction", icon: ClockAlert },
  { label: "Leave Management", url: "/leave-management", icon: CalendarCheck },
  { label: "Payroll", url: "/payroll", icon: Wallet },
  { label: "Register User", url: "/register", icon: UserPlus },
];

function StatCard({ stat }: { stat: Stat }) {
  const Icon = stat.icon;
  const inner = (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{stat.label}</p>
        <p className={`text-3xl font-bold ${toneClass[stat.tone]}`}>{stat.value}</p>
      </div>
      <div className="rounded-lg bg-muted p-3">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );

  if (stat.href) {
    return (
      <Link href={stat.href} className="transition-opacity hover:opacity-80">
        <Card className="h-full hover:shadow-sm">{inner}</Card>
      </Link>
    );
  }
  return <Card className="h-full">{inner}</Card>;
}

export function AdminOverview() {
  const { data: user } = useMe();
  const { list } = useAdminUsers();
  const today = useTodayAttendance(1);
  const leave = useLeave({ page: 1, limit: 5, all: true });
  const bills = useSearchBills({ status: "pending" }, 1);

  const stats = useMemo<Stat[]>(() => {
    const items = today.data?.items ?? [];
    const present = items.filter((a) => a.status === "present").length;
    const absent = items.filter((a) => a.status === "absent").length;
    const pendingLeave =
      leave.applications.data?.items?.filter((l) => l.status === "pending").length ?? 0;
    const pendingBills = bills.data?.totalRecords ?? 0;

    return [
      {
        label: "Total Employees",
        value: list.data?.items?.length ?? 0,
        icon: Users,
        href: "/users",
        tone: "default",
      },
      {
        label: "Present Today",
        value: present,
        icon: UserCheck,
        href: "/attendance/all",
        tone: "success",
      },
      {
        label: "Absent Today",
        value: absent,
        icon: UserX,
        href: "/attendance/all",
        tone: "danger",
      },
      {
        label: "Pending Leave",
        value: pendingLeave,
        icon: CalendarCheck,
        href: "/leave-management",
        tone: "warn",
      },
      {
        label: "Pending Reimbursements",
        value: pendingBills,
        icon: Clock4,
        href: "/reimbursement/management",
        tone: "warn",
      },
    ];
  }, [today.data, list.data, leave.applications.data, bills.data]);

  const name = user?.displayName || user?.name || "there";

  return (
    <div className="space-y-8 py-8">
      {/* ===== HEADER ===== */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Quick overview of your organisation today
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LayoutDashboard className="h-4 w-4" />
          <span>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
        </div>
      </div>

      {/* ===== STATS ===== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {quickActions.map(({ label, url, icon: Icon }) => (
              <Button key={url} variant="outline" className="justify-between" asChild>
                <Link href={url}>
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <TodayAttendanceTable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
