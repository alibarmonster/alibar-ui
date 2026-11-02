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
 * clicks, focus rings and text selection where the element is drawn. Work in CSS px (scale the context
 * by the pixel ratio as usual): the API renders elements at device-pixel size, so the adapter scales
 * them back down. On 155+ the browser syncs hit-testing itself; on older versions the returned
 * DOMMatrix is applied as the element's CSS transform. Returns false when drawing is not supported or
 * the element has not been painted yet (a paint event follows).
 */
export function drawElement2D(ctx: CanvasRenderingContext2D, element: Element, x: number, y: number, options: DrawElement2DOptions = {}) {
  const c = ctx as any;
  if (typeof c.drawElementImage !== "function") return false;
  const canvas = ctx.canvas as HTMLCanvasElement;
  const ratio = canvas.clientWidth ? canvas.width / canvas.clientWidth : 1;
  const support = getHtmlCanvasSupport();
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1 / ratio, 1 / ratio);
  try {
    if (support.version === "155+") {
      c.drawElementImage(element, 0, 0, options.preserveElementGeometry ? { preserveElementGeometry: true } : undefined);
      return true;
    }
    const matrix: DOMMatrix | undefined = c.drawElementImage(element, 0, 0);
    if (matrix && !options.preserveElementGeometry && element instanceof HTMLElement) element.style.transform = matrix.toString();
    return true;
  } catch {
    // Not painted yet ("No cached paint record"): the canvas fires a paint event once it is.
    return false;
  } finally {
    ctx.restore();
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
