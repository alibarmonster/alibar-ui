import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactNode } from "react";
import { siteConfig } from "@/config/site";

/** Open Graph images are 1200 × 630. */
export const OG_SIZE = { width: 1200, height: 630 };

const font = (file: string) => readFile(join(process.cwd(), "node_modules/geist/dist/fonts", file));

/** The site's own typeface (Geist), for next/og images. */
export async function ogFonts() {
  const [regular, semibold, mono] = await Promise.all([
    font("geist-sans/Geist-Regular.ttf"),
    font("geist-sans/Geist-SemiBold.ttf"),
    font("geist-mono/GeistMono-Regular.ttf"),
  ]);
  return [
    { name: "Geist", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Geist", data: semibold, weight: 600 as const, style: "normal" as const },
    { name: "Geist Mono", data: mono, weight: 400 as const, style: "normal" as const },
  ];
}

const host = siteConfig.url.replace(/^https?:\/\//, "");

/** White canvas with the dot grid, the logo top-left and the site address bottom-right. */
export function OgFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: "#ffffff",
        fontFamily: "Geist",
        color: "#09090b",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle, #e4e4e7 1.6px, transparent 1.6px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.2), #ffffff 75%)" }} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: "64px 72px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <svg width="44" height="44" viewBox="0 0 24 24">
            <rect width="24" height="24" rx="7" fill="#09090b" />
            <path d="M6.5 16.75c2.6 0 3.7-1.5 4.6-4.1l.5-1.4c.9-2.5 2-4 4.9-4" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="16.75" cy="16.25" r="1.75" fill="#ffffff" />
          </svg>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }}>
            alibar<span style={{ color: "#71717a" }}>/ui</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>{children}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", fontFamily: "Geist Mono", fontSize: 22, color: "#71717a" }}>{host}</div>
      </div>
    </div>
  );
}
