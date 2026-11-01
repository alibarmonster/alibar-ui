import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categories, getComponent } from "@/content/components";
import { cn } from "@/lib/utils";
import { LiveTile, type TileName } from "./live-tile";

const TILES: { tile: TileName; slug: string; span: string; flush?: boolean }[] = [
  { tile: "dock", slug: "dock", span: "md:col-span-2" },
  { tile: "rotator", slug: "word-rotator", span: "md:col-span-2" },
  { tile: "chart", slug: "area-chart", span: "md:col-span-2" },
  { tile: "tilt", slug: "tilt-card", span: "" },
  { tile: "switch", slug: "spring-switch", span: "" },
  { tile: "hold", slug: "hold-to-confirm-button", span: "" },
  { tile: "thinking", slug: "thinking-states", span: "" },
  { tile: "otp", slug: "otp-input", span: "" },
  { tile: "island", slug: "dynamic-island", span: "" },
  { tile: "dots", slug: "dot-grid", span: "md:col-span-2", flush: true },
  { tile: "chat", slug: "chat-bubbles", span: "md:col-span-2" },
];

/** Live, interactive components on the landing page. Tile chrome is server-rendered; demos load on approach. */
export function FeaturedBento() {
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
      {TILES.map(({ tile, slug, span, flush }) => {
        const entry = getComponent(slug);
        if (!entry) return null;
        const category = categories.find((c) => c.id === entry.category)?.name;
        return (
          <li key={slug} className={cn("flex flex-col overflow-hidden rounded-[20px] border border-border bg-background", span)}>
            <div className={cn("relative h-64 overflow-hidden", !flush && "bg-dot-grid")}>
              <LiveTile name={tile} />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{entry.name}</p>
                <p className="truncate text-xs text-muted-foreground">{category}</p>
              </div>
              <Link
                href={`/components/${slug}`}
                aria-label={`Open ${entry.name}`}
                className="focus-ring inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              >
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
