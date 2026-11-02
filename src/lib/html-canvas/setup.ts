import type { HtmlCanvasSupport } from "@/lib/html-canvas/support";

/* eslint-disable @typescript-eslint/no-explicit-any -- the API is not in lib.dom yet */

/**
 * Attributes that make a canvas lay out and paint its children, for use in JSX so the canvas is
 * drawable from its first layout: `content="drawable"` on 155+, `layoutsubtree` before that.
 */
export function drawableCanvasAttributes(support: HtmlCanvasSupport): Record<string, string> {
  if (support.version === "155+") return { content: "drawable" };
  if (support.version === "none") return {};
  return { layoutsubtree: "" };
}

/** Makes a canvas drawable after the fact (idempotent). */
export function prepareDrawableCanvas(canvas: HTMLCanvasElement) {
  const c = canvas as any;
  if ("content" in HTMLCanvasElement.prototype) {
    if (canvas.getAttribute("content") !== "drawable") canvas.setAttribute("content", "drawable");
  } else if (!canvas.hasAttribute("layoutsubtree")) {
    canvas.setAttribute("layoutsubtree", "");
    if ("layoutSubtree" in c) c.layoutSubtree = true;
  }
}

/**
 * Attributes for an element the canvas draws on its own. On 155+ it must carry `drawable`; on older
 * versions it must instead be a direct child of the canvas, which callers arrange in their markup.
 */
export function drawableElementAttributes(support: HtmlCanvasSupport): Record<string, string> {
  return support.version === "155+" ? { drawable: "" } : {};
}

/** Asks the canvas for a `paint` event on the next frame, where supported. */
export function requestCanvasPaint(canvas: HTMLCanvasElement) {
  const c = canvas as any;
  if (typeof c.requestPaint === "function") c.requestPaint();
}
/* eslint-enable @typescript-eslint/no-explicit-any */
