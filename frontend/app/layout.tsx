import type { Metadata } from "next";
import { Geist, Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/wallet/Providers";
import { AppLoader } from "@/components/layout/AppLoader";
import { Navbar } from "@/components/layout/Navbar";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { Footer } from "@/components/layout/Footer";
import { CustomCursor } from "@/components/ui/CustomCursor";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-geist",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

/**
 * Every OG, Twitter and canonical URL resolves against this. Set
 * NEXT_PUBLIC_SITE_URL to the real origin; on Vercel the deployment URL is a
 * good enough fallback, and locally it keeps `next build` from throwing.
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Clixo — Decentralised Opinion Market",
    template: "%s — Clixo",
  },
  description:
    "Post anything that needs real human judgment. Stake ETH. Get answers from real people who get paid to give a damn.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  openGraph: {
    title: "Clixo — Decentralised Opinion Market",
    description:
      "Post anything that needs real human judgment. Stake ETH. Get answers from real people who get paid to give a damn.",
    siteName: "Clixo",
    type: "website",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Clixo — Decentralised Opinion Market",
    description:
      "Post anything that needs real human judgment. Stake ETH. Get answers from real people who get paid to give a damn.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased cursor-none">
        <AppLoader />
        <CustomCursor />
        <Providers>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <Breadcrumb />
            <main className="flex-1 w-full flex flex-col">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
