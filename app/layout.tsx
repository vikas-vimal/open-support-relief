import type { Metadata, Viewport } from "next";
import { Bowlby_One, Inter } from "next/font/google";

import { QueryProvider } from "@/components/providers/query-provider";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import { appConfig } from "@/config/app.config";
import { buildThemeBootstrapScript, buildThemeCss } from "@/lib/theme/theme-css";
import "./globals.css";

const bowlbyOne = Bowlby_One({
  variable: "--font-bowlby",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: appConfig.brand.name,
  description: appConfig.brand.description,
  applicationName: appConfig.brand.name,
  appleWebApp: {
    capable: true,
    title: appConfig.brand.shortName,
    statusBarStyle: "default",
  },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  // Matches --header-bg per scheme, so the browser chrome blends with the masthead.
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: appConfig.theme.light.headerBg,
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: appConfig.theme.dark.headerBg,
    },
  ],
  width: "device-width",
  initialScale: 1,
  // Never block zoom — accessibility requirement, and the board is dense on small screens.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bowlbyOne.variable} ${inter.variable} h-full antialiased`}
      // The bootstrap script sets data-theme before React hydrates, so the
      // attribute legitimately differs from the server-rendered markup.
      suppressHydrationWarning
    >
      <head>
        {/* Generated from config/app.config.ts at build time — this is what
            makes the palette editable in one file. */}
        <style
          id="app-theme"
          dangerouslySetInnerHTML={{ __html: buildThemeCss() }}
        />
        {/* Must run before first paint: otherwise a dark-mode user gets a
            full-screen white flash before the stored choice applies. */}
        <script
          dangerouslySetInnerHTML={{ __html: buildThemeBootstrapScript() }}
        />
      </head>
      <body className="bg-canvas text-fg flex min-h-full flex-col">
        <a
          href="#airdrop-board"
          className="focus:border-border-strong focus:bg-primary focus:text-brand-ink sr-only font-semibold focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-card focus:border-2 focus:px-4 focus:py-2 focus:text-sm"
        >
          Skip to airdrop board
        </a>
        <QueryProvider>{children}</QueryProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
