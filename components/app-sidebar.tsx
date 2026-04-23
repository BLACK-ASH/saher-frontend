import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { NavUser } from "./sidebar/nav-user";
import { NavItem } from "./sidebar/nav-list";
import Link from "next/link";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center">
            <Image
              src={"/saher-logo.png"}
              alt="saher-logo"
              width={35}
              height={35}
            />
            <Link href={"/"}>
              <span className="text-primary text-xl font-bold text-pretty">
                SAHER
              </span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavItem />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
