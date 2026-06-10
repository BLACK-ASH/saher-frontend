import RoleGuard from "@/components/role-guard";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RoleGuard allowedRoles={["admin"]}> {children}</RoleGuard>;
}
