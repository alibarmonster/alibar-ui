import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { pixelArtPaths, type PixelArtData } from "@/lib/pixel-art/icons";

export interface PixelArtProps extends Omit<ComponentProps<"svg">, "children"> {
  /** The pixel map to draw. */
  art: PixelArtData;
  /** Colors to swap, by map character. */
  colors?: Readonly<Record<string, string>>;
  /** Accessible name. Without it the art is decorative (aria-hidden). */
  label?: string;
}

/** Draws pixel art as a crisp, scalable SVG (one path per color). Size it with CSS. */
export function PixelArt({ art, colors, label, className, ...props }: PixelArtProps) {
  return (
    <svg
      viewBox={`0 0 ${art.width} ${art.height}`}
      shapeRendering="crispEdges"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("[image-rendering:pixelated]", className)}
      {...props}
    >
      {pixelArtPaths(art, colors).map((p) => (
        <path key={p.color} fill={p.color} d={p.d} />
      ))}
    </svg>
  );
}
