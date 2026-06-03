import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import Providers from "./provider";

// Configure with explicit standard-to-bold weight ranges
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"], // Forcefully drop weights 100-300
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  weight: ["400", "500", "600", "700"], // Avoids Vercel's default thin-rendering bug
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
    <html
      lang="en"
      className={`${geist.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className={`font-sans font-normal antialiased`}>
        <Providers>
          <TooltipProvider>
            <main className="w-full h-full">
              {children}
              <Toaster />
            </main>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
