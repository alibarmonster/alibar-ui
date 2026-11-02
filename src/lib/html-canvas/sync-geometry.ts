import { getHtmlCanvasSupport } from "@/lib/html-canvas/support";

/* eslint-disable @typescript-eslint/no-explicit-any -- the API is not in lib.dom yet */

/**
 * Tells the browser where an element is drawn, so clicks, text selection, focus rings and screen
 * reader focus land on the drawn pixels. `canvasTransform` maps the element's own CSS px (origin at
 * its top-left) to the canvas's CSS px, and may include perspective; it is converted to the device
 * pixels the API expects.
 *
 * Canvas children are laid out at the canvas's top-left corner (they do not stack), so the transform
 * is the element's whole position.
 *
 * For non-affine warps (ripples, curls, cloth), pass the closest affine approximation and calm the
 * warp while an input inside the element has focus.
 */
export function syncElementGeometry(canvas: HTMLCanvasElement, element: HTMLElement, canvasTransform: DOMMatrix) {
  const c = canvas as any;
  const support = getHtmlCanvasSupport();
  const cssWidth = canvas.clientWidth || canvas.width;
  const cssHeight = canvas.clientHeight || canvas.height;
  // The API works in device pixels on both sides (the element's rendered image and the canvas's backing
  // store), so the CSS-px matrix is conjugated by the pixel ratio: S · M · S⁻¹.
  const toBackingStore = new DOMMatrix().scale(canvas.width / cssWidth, canvas.height / cssHeight, 1);
  const pixels = toBackingStore.multiply(canvasTransform).multiply(toBackingStore.inverse());
  try {
    if (support.version === "155+" && typeof c.updateElementGeometry === "function") {
      c.updateElementGeometry(element, { canvasTransform: pixels });
      return;
    }
    if (typeof c.getElementTransform === "function") {
      element.style.transform = c.getElementTransform(element, pixels).toString();
      return;
    }
  } catch {
    // Fall through to the manual mapping below.
  }
  // Manual: children sit at the canvas origin, so the CSS-px transform applies as is.
  element.style.transformOrigin = "0 0";
  element.style.transform = canvasTransform.toString();
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
