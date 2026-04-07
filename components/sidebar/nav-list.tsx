"use client"
import Link from "next/link";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton } from "../ui/sidebar";
import { useMe } from "@/hooks/use-me";
import { CalendarCheck, ClockCheck, Home, Mailbox, User, UserPlus, Users } from "lucide-react";

const userRoutes = [
  {
    label: "Home",
    url: "/",
    icon: Home
  },
  {
    label: "Profile",
    url: "/profile",
    icon: User
  },
  {
    label: "Attendance",
    url: "/attendance",
    icon: ClockCheck
  },
  {
    label: "Mails",
    url: "/mail",
    icon: Mailbox
  },
  {
    label: "Workshop",
    url: "/workshop",
    icon: CalendarCheck
  },
]

const adminRoutes = [
  {
    label: "Register",
    url: "/register",
    icon: UserPlus
  },
  {
    label: "Users",
    url: "/users",
    icon: Users
  },
]

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
  )
}

export function NavItem() {
  const { data: user, isLoading, error } = useMe();
  // 🔄 Loading state
  if (isLoading) {
    return <NavSkeleton />;
  }

  // ❌ Not logged in (extra safety)
  if (error || !user) {
    return null;
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>User</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {userRoutes.map((item) => {
              return (
                <SidebarMenuItem key={item.label}>
                  <Link href={item.url} className="flex items-center justify-center gap-2">
                    <SidebarMenuButton tooltip={item.label}>
                      {item.icon && <item.icon />}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {
        user?.role !== "user" && <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminRoutes.map((item) => {
                return (
                  <SidebarMenuItem key={item.label}>
                    <Link href={item.url} className="flex items-center justify-center gap-2">
                      <SidebarMenuButton tooltip={item.label}>
                        {item.icon && <item.icon />}
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      }
    </>
  )
}
