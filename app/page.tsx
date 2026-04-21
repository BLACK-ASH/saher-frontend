import AttendanceStatus from "@/features/attendance/attendance-status";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  User,
  FileText,
  Calendar,
  CreditCard,
  Clock,
  AlertCircle,
} from "lucide-react";

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
      <AttendanceStatus />

      {/* ===== STATS ===== */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Days Present" value="18" icon={Calendar} />
        <StatCard title="Leaves Taken" value="2" icon={FileText} />
        <StatCard title="Late Entries" value="3" icon={Clock} />
        <StatCard title="Pending Requests" value="1" icon={AlertCircle} />
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Quick Actions</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard icon={User} label="View Profile" />
          <ActionCard icon={FileText} label="Request Correction" />
          <ActionCard icon={Calendar} label="Apply Leave" />
          <ActionCard icon={CreditCard} label="Bank Details" />
        </div>
      </div>

      {/* ===== MAIN GRID ===== */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* ACTIVITY */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recent Activity
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            <ActivityItem text="Checked in at 9:02 AM" />
            <ActivityItem text="Profile updated" />
            <ActivityItem text="Leave request submitted" />
            <ActivityItem text="Attendance corrected" />
          </CardContent>
        </Card>

        {/* ALERTS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alerts & Tasks
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            <AlertItem text="1 pending approval request" />
            <AlertItem text="Update your bank details" />
            <AlertItem text="Incomplete profile information" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: any;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-lg font-semibold mt-1">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function ActionCard({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <Button
      variant="outline"
      className="h-20 flex flex-col items-center justify-center gap-2"
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs">{label}</span>
    </Button>
  );
}

function ActivityItem({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{text}</span>
      <span className="text-muted-foreground text-xs">Just now</span>
    </div>
  );
}

function AlertItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <AlertCircle className="h-4 w-4 text-muted-foreground" />
      <span>{text}</span>
    </div>
  );
}
