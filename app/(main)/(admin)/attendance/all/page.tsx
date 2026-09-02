"use client";

import RoleGuard from "@/components/role-guard";
import { can } from "@/lib/permissions";
import { AdminAttendancePage } from "@/features/attendance/admin/admin-attendance-page";

export default function AllAttendancePage() {
  return (
    <RoleGuard allow={(r) => can(r, "read", "attendance")}>
      <AdminAttendancePage />
    </RoleGuard>
  );
}
