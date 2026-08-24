import type { Metadata } from "next";
import { IBM_Plex_Mono, IM_Fell_English, Instrument_Sans, JetBrains_Mono, Outfit } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const outfit = Outfit({ variable: "--font-display", subsets: ["latin"], weight: ["200", "300", "400", "500", "600"], display: "swap" });
const plexMono = IBM_Plex_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400"], display: "swap" });
/* Landing-page pair (see landing.module.css) — the map app and portal stay on Outfit/Plex. */
const instrument = Instrument_Sans({ variable: "--font-instrument", subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["400", "500"], display: "swap" });
const treasure = IM_Fell_English({ variable: "--font-treasure", subsets: ["latin"], weight: ["400"], display: "swap" });

export const metadata: Metadata = {
  title: "Stroll — friendlier city maps",
  description: "Illustrated local discovery maps with real streets, rooftops, and business mini-apps.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/stroll-mark.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/brand/stroll-mark.png", type: "image/png", sizes: "512x512" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${outfit.variable} ${plexMono.variable} ${instrument.variable} ${jetbrains.variable} ${treasure.variable}`}>
      <body>{children}</body>
    </html>
  );
}
