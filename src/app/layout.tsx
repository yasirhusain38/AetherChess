import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { Shell } from "@/components/layout/Shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aether.chess"),
  title: {
    default: "Free Chess Analysis & AI Chess Coach | Aether",
    template: "%s | Aether",
  },
  description:
    "Aether is the free-first chess platform: unlimited analysis, opponent scouting, Twin Bot practice, and an AI coach. Play free. Scout deeper.",
  applicationName: "Aether",
  manifest: "/manifest.webmanifest",
  keywords: ["chess", "free chess analysis", "AI chess coach", "opponent scouting", "chess training"],
  authors: [{ name: "Aether" }],
  openGraph: {
    type: "website",
    siteName: "Aether Chess",
    title: "Free Chess Analysis & AI Chess Coach | Aether",
    description:
      "Unlimited free chess tools with pro-level opponent scouting and Twin Bot training.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Chess Analysis & AI Chess Coach | Aether",
    description:
      "Unlimited free chess tools with pro-level opponent scouting and Twin Bot training.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Aether",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0d12",
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SessionProvider>
          <Shell>{children}</Shell>
        </SessionProvider>
      </body>
    </html>
  );
}
