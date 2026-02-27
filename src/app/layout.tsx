import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eden — Dein digitaler Garten",
  description: "Verwalte deine Pflanzen, erhalte Pflegehinweise und entdecke Gartenwissen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
