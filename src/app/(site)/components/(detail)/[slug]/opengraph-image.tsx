import { ImageResponse } from "next/og";
import { categories, getComponent, readyComponents } from "@/content/components";
import { OG_SIZE, OgFrame, ogFonts } from "@/lib/og";

export const alt = "Component preview from alibar/ui";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return readyComponents.map((entry) => ({ slug: entry.slug }));
}

export default async function ComponentImage({ params }: { params: Promise<{ slug: string }> }) {
  const entry = getComponent((await params).slug);
  const category = categories.find((c) => c.id === entry?.category)?.name ?? "Component";
  return new ImageResponse(
    (
      <OgFrame>
        <div style={{ display: "flex", fontSize: 24, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2563eb" }}>{category}</div>
        <div style={{ display: "flex", marginTop: 14, fontSize: 92, fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.02 }}>{entry?.name ?? "alibar/ui"}</div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 32, color: "#71717a", maxWidth: 940, lineHeight: 1.35 }}>{entry?.description ?? ""}</div>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            marginTop: 40,
            padding: "12px 20px",
            borderRadius: 12,
            border: "1px solid #e4e4e7",
            background: "#fafafa",
            fontFamily: "Geist Mono",
            fontSize: 22,
            color: "#09090b",
          }}
        >
          <span style={{ color: "#a1a1aa" }}>$&nbsp;</span>npx shadcn@latest add …/r/{entry?.slug}.json
        </div>
      </OgFrame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
