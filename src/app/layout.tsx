import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { siteConfig } from "@/config/site";
import { caveat, geistMono, geistPixel, geistSerif } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} · Animated React components`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: ["React components", "animated components", "Motion", "Tailwind CSS", "shadcn", "Next.js", "accessible UI", "UI library", "micro-interactions"],
  authors: [{ name: siteConfig.shortName, url: siteConfig.github }],
  creator: siteConfig.shortName,
  // Each page's canonical URL is its own path.
  alternates: { canonical: "./" },
  // No title/description here: Next fills them from each page's own title and description.
  openGraph: { type: "website", siteName: siteConfig.name, locale: "en_US" },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

const originTrialToken = process.env.NEXT_PUBLIC_HTML_IN_CANVAS_OT_TOKEN;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn(GeistSans.variable, geistMono.variable, geistSerif.variable, geistPixel.variable, caveat.variable)}>
      {/* Opts the site into the HTML-in-Canvas origin trial when a token is configured. */}
      {originTrialToken ? (
        <head>
          <meta httpEquiv="origin-trial" content={originTrialToken} />
        </head>
      ) : null}
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">{children}</body>
    </html>
  );
}
