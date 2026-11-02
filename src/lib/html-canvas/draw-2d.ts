import { getHtmlCanvasSupport } from "@/lib/html-canvas/support";

/* eslint-disable @typescript-eslint/no-explicit-any -- the API is not in lib.dom yet */

export interface DrawElement2DOptions {
  /**
   * Leave the element's hit-testing geometry alone, e.g. because you will sync it yourself with
   * `syncElementGeometry`. @default false
   */
  preserveElementGeometry?: boolean;
}

/**
 * Draws a canvas child into a 2D context at (x, y) under the context's current transform, and keeps
 * clicks, focus rings and text selection where the element is drawn. On 155+ the browser syncs
 * hit-testing itself; on older versions the returned DOMMatrix is applied as the element's CSS
 * transform. Returns false when drawing is not supported.
 */
export function drawElement2D(ctx: CanvasRenderingContext2D, element: Element, x: number, y: number, options: DrawElement2DOptions = {}) {
  const c = ctx as any;
  if (typeof c.drawElementImage !== "function") return false;
  const support = getHtmlCanvasSupport();
  if (support.version === "155+") {
    c.drawElementImage(element, x, y, options.preserveElementGeometry ? { preserveElementGeometry: true } : undefined);
    return true;
  }
  const matrix: DOMMatrix | undefined = c.drawElementImage(element, x, y);
  if (matrix && !options.preserveElementGeometry && element instanceof HTMLElement) element.style.transform = matrix.toString();
  return true;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
