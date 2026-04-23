"use client";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useMe } from "@/hooks/use-me";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "../ui/breadcrumb";
import { Home } from "lucide-react";

export function SiteHeader() {
  const path = usePathname();

  const segments = path.split("/").filter(Boolean);

  const last = segments.at(-1);
  const parents = segments.slice(0, -1);

  const { data: user, isLoading, error } = useMe();

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 p-1 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-8"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <Home className="size-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>

            {parents.map((segment, index) => {
              const href = "/" + segments.slice(0, index + 1).join("/");

              return (
                <BreadcrumbItem key={href}>
                  <BreadcrumbSeparator />
                  <BreadcrumbLink href={href}>{segment}</BreadcrumbLink>
                </BreadcrumbItem>
              );
            })}

            {last && (
              <BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbPage>{last}</BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <p className="text-base font-medium">{user?.displayName}</p>
        </div>
      </div>
    </header>
  );
}
