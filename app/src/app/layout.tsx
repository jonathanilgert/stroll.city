import type { Metadata } from "next";
import { Archivo, Public_Sans } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], display: "swap" });
const publicSans = Public_Sans({ variable: "--font-public-sans", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Stroll — friendlier city maps",
  description: "Illustrated local discovery maps with real streets, rooftops, and business mini-apps.",
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${publicSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
