import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const outfit = localFont({
  src: "./fonts/Outfit-Variable.ttf",
  variable: "--font-outfit",
  display: "swap",
  weight: "100 900",
});

const sora = localFont({
  src: "./fonts/Sora-Variable.ttf",
  variable: "--font-sora",
  display: "swap",
  weight: "100 800",
});

const plexMono = localFont({
  src: [
    {
      path: "./fonts/IBMPlexMono-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/IBMPlexMono-Medium.ttf",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kontrak Central Saga",
  description:
    "Dashboard awal untuk sistem pengelolaan kontrak klien dan pembayaran PT Central Saga Mandala.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${outfit.variable} ${sora.variable} ${plexMono.variable} h-full antialiased font-sans`}
    >
      <head />
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
          <Toaster closeButton position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
