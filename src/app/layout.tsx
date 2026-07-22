import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWAProvider from "../components/PWAProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#9E7D3B",
};

export const metadata: Metadata = {
  title: "KMB Boutique - Tailoring & Client Management",
  description: "Boutique tailoring measurement management and client gallery portal",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KMB Boutique",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <PWAProvider>
          <div className="flex-grow flex flex-col">{children}</div>
          <footer className="w-full bg-white border-t border-slate-100 py-4 sm:py-6 text-center text-xs sm:text-sm text-slate-400 font-bold select-none mt-auto flex-none">
            ©️ 2026 KMB Boutique. All Rights Reserved. Designed & Developed by
            Sivora Digital
          </footer>
        </PWAProvider>
      </body>
    </html>
  );
}
