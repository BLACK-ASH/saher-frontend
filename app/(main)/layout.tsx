import Footer from "@/components/app-footer";
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

      <main className="flex min-h-screen max-h-screen w-full flex-col">
        <SiteHeader />

        <main className="flex-1 max-sm:min-h-screen overflow-y-scroll">
          {children}
        </main>

        <Footer />
      </main>
    </SidebarProvider>
  );
}
