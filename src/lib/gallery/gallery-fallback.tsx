import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/lib/gallery/types";

export interface GalleryFallbackProps {
  items: GalleryItem[];
  /** Names the list. */
  label: string;
  /** CSS aspect ratio of each image. @default "4 / 5" */
  aspect?: string;
  onSelect?: (item: GalleryItem, index: number) => void;
  className?: string;
}

/** What a gallery shows without WebGL: the same items as a plain, swipeable scroll-snap list. */
export function GalleryFallback({ items, label, aspect = "4 / 5", onSelect, className }: GalleryFallbackProps) {
  return (
    <ul aria-label={label} className={cn("flex size-full snap-x snap-mandatory items-center gap-4 overflow-x-auto px-6 py-6 [scrollbar-width:thin]", className)}>
      {items.map((item, i) => (
        <li key={`${item.src}-${i}`} className="w-[min(70%,15rem)] shrink-0 snap-center">
          <figure>
            {onSelect ? (
              <button type="button" onClick={() => onSelect(item, i)} className="block w-full cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {/* eslint-disable-next-line @next/next/no-img-element -- plain img keeps the component framework-agnostic */}
                <img src={item.src} alt={item.alt} loading="lazy" decoding="async" className="w-full rounded-xl object-cover shadow-md" style={{ aspectRatio: aspect }} />
              </button>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- plain img keeps the component framework-agnostic
              <img src={item.src} alt={item.alt} loading="lazy" decoding="async" className="w-full rounded-xl object-cover shadow-md" style={{ aspectRatio: aspect }} />
            )}
            {item.title ? (
              <figcaption className="mt-2 text-sm">
                <span className="font-medium text-foreground">{item.title}</span>
                {item.subtitle ? <span className="block text-muted-foreground">{item.subtitle}</span> : null}
              </figcaption>
            ) : null}
          </figure>
        </li>
      ))}
    </ul>
  );
}
