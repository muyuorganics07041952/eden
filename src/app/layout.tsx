import type { Metadata, Viewport } from "next";
import "./globals.css";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { InstallBanner } from "@/components/pwa/install-banner";

export const metadata: Metadata = {
  title: "Eden — Dein digitaler Garten",
  description:
    "Verwalte deine Pflanzen, erhalte Pflegehinweise und entdecke Gartenwissen.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Eden",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="antialiased">
        <OfflineBanner />
        {children}
        <InstallBanner />
      </body>
    </html>
  );
}
