import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Suspense } from "react";
import { NavProgress } from "@/components/ui/nav-progress";
import { ThemeProvider } from "@/components/theme-provider";
import { SupportWidget } from "@/components/support/support-widget";
import { createAdminClient } from "@/lib/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KKhome - Google Sheets Templates",
  description: "Kho Google Sheets Templates chuyên nghiệp cho doanh nghiệp",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createAdminClient();
  const { data: settings } = await supabase.from("site_settings").select("zalo_url").limit(1).single();

  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Suspense>
            <NavProgress />
          </Suspense>
          {children}
          <Toaster position="top-right" richColors />
          <SupportWidget zaloUrl={settings?.zalo_url ?? null} />
        </ThemeProvider>
      </body>
    </html>
  );
}
