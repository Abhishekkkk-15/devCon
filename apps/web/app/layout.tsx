import "./globals.css";
import type { Metadata } from "next";
import { Suspense } from "react";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { AppProviders } from "@/components/providers/app-providers";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Local Developer Platform",
  description: "Cloud Control Plane for Local Development",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} font-sans`}>
        <AppProviders>
          <div className="flex min-h-screen bg-background text-foreground">
            <Suspense fallback={<div className="hidden w-[290px] shrink-0 border-r border-white/10 bg-[#0f1724]/95 xl:flex" />}>
              <Sidebar />
            </Suspense>
            <div className="relative flex min-h-screen flex-1 flex-col overflow-hidden">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_28%)]" />
              <Header />
              <main className="relative flex-1 overflow-auto">{children}</main>
            </div>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
