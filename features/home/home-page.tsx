"use client";
import Link from "next/link";
import {
  User,
  FileText,
  Calendar,
  Mail,
  ReceiptText,
  NotebookPen,
  Bell,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";
import { AdminOverview } from "@/features/dashboard/admin-overview";
import AttendanceStatus from "@/features/attendance/attendance-status";
import NotificationBox from "@/features/notification/notification-box";

const staffActions = [
  { label: "View Profile", url: "/profile", icon: User },
  { label: "Attendance", url: "/attendance", icon: FileText },
  { label: "Attendance Correction", url: "/attendance-correction", icon: FileText },
  { label: "Calendar", url: "/calendar", icon: Calendar },
  { label: "Leave", url: "/leave", icon: NotebookPen },
  { label: "My Bills", url: "/reimbursement/my-bills", icon: ReceiptText },
  { label: "Mails", url: "/mail", icon: Mail },
  { label: "Noticeboard", url: "/noticeboard", icon: Bell },
];

function ActionCard({
  icon: Icon,
  label,
  url,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  label: string;
  url: string;
}) {
  return (
    <Button
      variant="outline"
      className="h-20 flex flex-col items-center justify-center gap-2"
      asChild
    >
      <Link href={url}>
        <Icon className="h-5 w-5" />
        <span className="text-xs">{label}</span>
      </Link>
    </Button>
  );
}

function StaffHome() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening today</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <AttendanceStatus />
        <NotificationBox />
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {staffActions.map((a) => (
            <ActionCard key={a.url} {...a} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const { data: user, isLoading } = useMe();

  if (isLoading || !user) return null;
  const isOverview = user.role === "admin" || user.role === "manager";

  return (
    <div className="max-w-7xl mx-auto px-6">
      {isOverview ? <AdminOverview /> : <StaffHome />}
    </div>
  );
}
