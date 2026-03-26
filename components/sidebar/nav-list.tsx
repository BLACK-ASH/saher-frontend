import Link from "next/link";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import { Home, Plus } from "lucide-react";

const navItems = [
  {
    label: "Home",
    url: "/",
    icon: Home
  },
  {
    label: "Register",
    url: "/register",
    icon: Plus
  },
]

export function NavItem() {
  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Admin</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {navItems.map((item) => {
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
    </>
  )
}
