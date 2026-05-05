import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/sidebar/sidebar-header";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full h-full">
        <SiteHeader />
        {children}
      </main>
    </SidebarProvider>
  );
}
