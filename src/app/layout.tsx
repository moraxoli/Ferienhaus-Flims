import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ferienhaus Flims",
  description: "Buchungskoordination für Ferienhaus Flims",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
