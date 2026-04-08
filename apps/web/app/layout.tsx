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
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} font-sans`}>
        <AppProviders>
          <div className="flex bg-background text-foreground h-screen overflow-hidden">
            <Suspense fallback={<div className="hidden w-[280px] shrink-0 border-r border-border bg-muted/20 xl:flex" />}>
              <Sidebar />
            </Suspense>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <Header />
              <main className="flex-1 shrink-0">{children}</main>
            </div>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
