import { getHtmlCanvasSupport } from "@/lib/html-canvas/support";

/* eslint-disable @typescript-eslint/no-explicit-any -- the API is not in lib.dom yet */

/**
 * Tells the browser where an element is drawn, so clicks, text selection, focus rings and screen
 * reader focus land on the drawn pixels. `canvasTransform` maps the element's own CSS px (origin at
 * its top-left) to the canvas's CSS px, and may include perspective.
 *
 * For non-affine warps (ripples, curls, cloth), pass the closest affine approximation and calm the
 * warp while an input inside the element has focus.
 */
export function syncElementGeometry(canvas: HTMLCanvasElement, element: HTMLElement, canvasTransform: DOMMatrix) {
  const c = canvas as any;
  const support = getHtmlCanvasSupport();
  try {
    if (support.version === "155+" && typeof c.updateElementGeometry === "function") {
      c.updateElementGeometry(element, { canvasTransform });
      return;
    }
    if (typeof c.getElementTransform === "function") {
      element.style.transform = c.getElementTransform(element, canvasTransform).toString();
      return;
    }
  } catch {
    // Fall through to the manual mapping below.
  }
  // Manual: undo the element's layout offset inside the canvas, then apply the draw transform.
  const offset = new DOMMatrix().translate(-element.offsetLeft, -element.offsetTop);
  element.style.transformOrigin = "0 0";
  element.style.transform = offset.multiply(canvasTransform).toString();
}

/** Clears geometry set by `syncElementGeometry` or a legacy `drawElement2D`. */
export function clearElementGeometry(element: HTMLElement) {
  element.style.transform = "";
  element.style.transformOrigin = "";
}

/** A CSS-px perspective matrix, like `perspective(d)` in CSS. */
export function perspective(distance: number) {
  return new DOMMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1 / distance, 0, 0, 0, 1]);
}
/* eslint-enable @typescript-eslint/no-explicit-any */
