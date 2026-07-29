import type { Metadata } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-display", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });
const plexMono = IBM_Plex_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500"], display: "swap" });

export const metadata: Metadata = {
  title: "Stroll — friendlier city maps",
  description: "Illustrated local discovery maps with real streets, rooftops, and business mini-apps.",
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
