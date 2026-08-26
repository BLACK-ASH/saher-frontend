"use client";

// Notice editing is gated by notice:update (held by role "user"), NOT the
// (admin) folder's user:write gate — no notice-authoring role holds it.
import RoleGuard from "@/components/role-guard";
import { can } from "@/lib/permissions";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RoleGuard allow={(r) => can(r, "update", "notice")}>{children}</RoleGuard>;
}
