"use client";

// Client layout: RoleGuard's allow() callback cannot be serialized across the
// server->client boundary during prerender (broke static builds of every
// (admin) page, e.g. /register).
import RoleGuard from "@/components/role-guard";
import { can } from "@/lib/permissions";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RoleGuard allow={(r) => can(r, "write", "user")}> {children}</RoleGuard>;
}
