import type { Metadata } from "next";
import { Capriola, Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import Providers from "./provider";
import { SiteHeader } from "@/components/sidebar/sidebar-header";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const capirola = Capriola({ weight: "400" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SAHER India.",
  description:
    "Society For Awareness Harmony And Equal Right - SAHER is an organization for the people.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${capirola} ${geistMono.variable} antialiased`}>
        <Providers>
          <TooltipProvider>
            <SidebarProvider>
              <AppSidebar />
              <main className="w-full h-full">
                <SiteHeader />
                {children}
                <Toaster />
              </main>
            </SidebarProvider>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
