"use client";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "../ui/sidebar";
import { useMe } from "@/hooks/use-me";
import { can } from "@/lib/permissions";
import type { UserRole } from "@/lib/permissions";
import {
  Bell,
  Calendar,
  CalendarCheck,
  ClipboardCheck,
  ClockAlert,
  ClockCheck,
  Home,
  LayoutDashboard,
  Mailbox,
  NotebookPen,
  ReceiptText,
  User,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const userRoutes = [
  {
    label: "Home",
    url: "/",
    icon: Home,
  },
  {
    label: "Profile",
    url: "/profile",
    icon: User,
  },
  {
    label: "Attendance",
    url: "/attendance",
    icon: ClockCheck,
  },
  {
    label: "Calendar",
    url: "/calendar",
    icon: Calendar,
  },
  {
    label: "Mails",
    url: "/mail",
    icon: Mailbox,
  },
  {
    label: "Leave",
    url: "/leave",
    icon: NotebookPen,
  },
  {
    label: "Program",
    url: "/program",
    icon: CalendarCheck,
  },
  {
    label: "Noticeboard",
    url: "/noticeboard",
    icon: Bell,
  },
  {
    label: "My Bills",
    url: "/reimbursement/my-bills",
    icon: ReceiptText,
  },
  {
    label: "Bill Management",
    url: "/reimbursement/management",
    icon: ReceiptText,
  },
];

const managerRoutes = [
  {
    label: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Users",
    url: "/users",
    icon: Users,
  },
  {
    label: "Attendance Correction",
    url: "/attendance-correction",
    icon: ClockAlert,
  },
  {
    label: "Leave Management",
    url: "/leave-management",
    icon: NotebookPen,
  },
  {
    label: "All Attendance",
    url: "/attendance/all",
    icon: ClipboardCheck,
  },
];

const adminRoutes = [
  {
    label: "Register",
    url: "/register",
    icon: UserPlus,
  },
  {
    label: "Payroll",
    url: "/payroll",
    icon: Wallet,
  },
];

const canSeeManagerGroup = (role: UserRole): boolean => {
  return managerRoutes.some((r) => {
    if (r.url === "/dashboard") return can(role, "read", "user");
    if (r.url === "/users") return can(role, "read", "user");
    if (r.url === "/attendance-correction")
      return can(role, "read", "attendance-correction");
    if (r.url === "/leave-management") return can(role, "read", "leave");
    if (r.url === "/attendance/all") return role === "admin" || role === "manager";
    return false;
  });
};

const canSeeAdminGroup = (role: UserRole): boolean => {
  return can(role, "delete", "account");
};

const NavSkeleton = () => {
  return (
    <>
      <SidebarMenuSkeleton />
      <SidebarMenuSkeleton />
      <SidebarMenuSkeleton />
      <SidebarMenuSkeleton />
      <SidebarMenuSkeleton />
      <SidebarMenuSkeleton />
    </>
  );
};

export function NavItem() {
  const { data: user, isLoading } = useMe();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === "/login";
  if (isAuthPage) return null;

  const isActive = (url: string) => {
    if (url === "/") return pathname === "/";

    return pathname === url || pathname.startsWith(url + "/");
  };

  const navigateLink = (url: string) => {
    router.push(url);
  };

  if (isLoading) {
    return <NavSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>User</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {userRoutes
              .filter((item) => item.url !== "/reimbursement/management" || can(user.role, "read", "preReimbursement"))
              .map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  isActive={isActive(item.url)}
                  onClick={() => navigateLink(item.url)}
                  tooltip={item.label}
                >
                  {item.icon && <item.icon />}
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {canSeeManagerGroup(user.role) && (
        <SidebarGroup>
          <SidebarGroupLabel>Manager</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managerRoutes.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    isActive={isActive(item.url)}
                    onClick={() => navigateLink(item.url)}
                    tooltip={item.label}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
      {canSeeAdminGroup(user.role) && (
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminRoutes.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    isActive={isActive(item.url)}
                    onClick={() => navigateLink(item.url)}
                    tooltip={item.label}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  );
}
