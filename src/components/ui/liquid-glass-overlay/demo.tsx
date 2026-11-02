"use client";

import { useState } from "react";
import { Bold, Heart, Italic, Link2, Share2 } from "lucide-react";
import { HtmlCanvasDemo } from "@/components/site/html-canvas-demo";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay/liquid-glass-overlay";

const tool = "grid size-8 cursor-pointer place-items-center rounded-full text-foreground outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-foreground aria-pressed:text-background";

function Article() {
  return (
    <article className="rounded-2xl border border-border bg-background p-6">
      <div className="mb-4 h-28 rounded-xl bg-[linear-gradient(120deg,#fde68a,#f9a8d4_40%,#93c5fd)]" />
      <h3 className="text-lg font-semibold text-foreground">Notes from the glass studio</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Light bends where glass gets thin. That is why the rim of a lens shows the world pulled outward with a fringe of color, while the middle stays clear enough to read through. Drag the toolbar across this text to see it.
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Every word here is still real text: <a href="#" onClick={(e) => e.preventDefault()} className="font-medium text-primary underline underline-offset-4">links work</a>, and you can select a sentence right under the glass.
      </p>
    </article>
  );
}

export function Default() {
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(true);
  return (
    <HtmlCanvasDemo>
      {({ rendering, onModeChange }) => (
        <LiquidGlassOverlay
          rendering={rendering}
          onModeChange={onModeChange}
          className="max-w-lg"
          defaultPosition={{ x: 140, y: 150 }}
          label="Formatting"
          toolbar={
            <>
              <button type="button" aria-label="Bold" aria-pressed={bold} onClick={() => setBold((b) => !b)} className={tool}>
                <Bold className="size-4" aria-hidden="true" />
              </button>
              <button type="button" aria-label="Italic" aria-pressed={italic} onClick={() => setItalic((i) => !i)} className={tool}>
                <Italic className="size-4" aria-hidden="true" />
              </button>
              <button type="button" aria-label="Link" className={tool}>
                <Link2 className="size-4" aria-hidden="true" />
              </button>
            </>
          }
        >
          <Article />
        </LiquidGlassOverlay>
      )}
    </HtmlCanvasDemo>
  );
}

export function Strong() {
  const [liked, setLiked] = useState(false);
  return (
    <HtmlCanvasDemo>
      {({ rendering, onModeChange }) => (
        <LiquidGlassOverlay
          rendering={rendering}
          onModeChange={onModeChange}
          className="max-w-lg"
          refraction={1}
          defaultPosition={{ x: 40, y: 60 }}
          label="Post actions"
          toolbar={
            <>
              <button type="button" aria-label="Like" aria-pressed={liked} onClick={() => setLiked((l) => !l)} className={tool}>
                <Heart className="size-4" aria-hidden="true" />
              </button>
              <button type="button" aria-label="Share" className={tool}>
                <Share2 className="size-4" aria-hidden="true" />
              </button>
            </>
          }
        >
          <Article />
        </LiquidGlassOverlay>
      )}
    </HtmlCanvasDemo>
  );
}
