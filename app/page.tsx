import AttendanceStatus from "@/features/attendance/attendance-status";
import { Button } from "@/components/ui/button";

import { User, FileText } from "lucide-react";
import NotificationBox from "@/features/profile/notification";
import Link from "next/link";

export default function Page() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Here’s what’s happening today
          </p>
        </div>

        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* ===== ATTENDANCE (PRIMARY) ===== */}

      <div className="grid lg:grid-cols-2 gap-6">
        <AttendanceStatus />
        {/* ALERTS */}
        <NotificationBox />
      </div>
      {/* ===== QUICK ACTIONS ===== */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Quick Actions</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard url="/profile" icon={User} label="View Profile" />
          <ActionCard
            url="attendance"
            icon={FileText}
            label="Request Correction"
          />
        </div>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

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
