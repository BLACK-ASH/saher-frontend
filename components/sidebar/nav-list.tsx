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
import {
  Calendar,
  CalendarCheck,
  ClockAlert,
  ClockCheck,
  Home,
  LayoutDashboard,
  Mailbox,
  User,
  UserPlus,
  Users,
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
    label: "Program",
    url: "/program",
    icon: CalendarCheck,
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
];

const adminRoutes = [
  {
    label: "Register",
    url: "/register",
    icon: UserPlus,
  },
];

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

  // 🔄 Loading state
  if (isLoading) {
    return <NavSkeleton />;
  }

  // ❌ Not logged in (extra safety)
  if (!user) {
    return null;
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>User</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {userRoutes.map((item) => (
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
      {user?.role === "manager" ||
        (user?.role === "admin" && (
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
        ))}
      {user?.role === "admin" && (
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
