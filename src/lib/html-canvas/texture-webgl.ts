import { getHtmlCanvasSupport } from "@/lib/html-canvas/support";

/* eslint-disable @typescript-eslint/no-explicit-any -- the API is not in lib.dom yet */

/** A WebGL texture that holds a live element's pixels. */
export interface ElementTexture {
  texture: WebGLTexture;
  /** Natural size of the last upload, in CSS px. */
  width: number;
  height: number;
  /** Allocated size on 155+, where the storage is reused until the element resizes. */
  allocated: { width: number; height: number } | null;
}

/** Creates an empty, linearly filtered, edge-clamped texture for `uploadElementTexture`. */
export function createElementTexture(gl: WebGL2RenderingContext): ElementTexture {
  const texture = gl.createTexture();
  if (!texture) throw new Error("Could not create a texture");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return { texture, width: 0, height: 0, allocated: null };
}

/**
 * Uploads an element's current rendering into `target`. Call it from the canvas `paint` event or on
 * resize, never every frame. Returns false when the element could not be uploaded.
 *
 * - 155+: measures with `captureElementImage`, allocates once with `texImage2D(…, null)` (again only
 *   when the size changes), then copies with `texElementSubImage2D`.
 * - 150–154: `texElementImage2D(target, internalformat, element)`.
 * - legacy: `texElementImage2D(target, level, internalformat, format, type, element)`.
 */
export function uploadElementTexture(gl: WebGL2RenderingContext, target: ElementTexture, element: Element) {
  const g = gl as any;
  const support = getHtmlCanvasSupport();
  const box = element.getBoundingClientRect();
  const html = element as HTMLElement;
  // Layout size, unaffected by the CSS transform used for hit-testing.
  const width = html.offsetWidth || box.width;
  const height = html.offsetHeight || box.height;
  if (!width || !height) return false;
  gl.bindTexture(gl.TEXTURE_2D, target.texture);
  try {
    if (support.version === "155+" && typeof g.texElementSubImage2D === "function") {
      const canvas = gl.canvas as any;
      let natural = { width, height };
      if (typeof canvas.captureElementImage === "function") {
        const image = canvas.captureElementImage(element);
        natural = { width: image.width, height: image.height };
        image.close?.();
      }
      if (!target.allocated || target.allocated.width !== natural.width || target.allocated.height !== natural.height) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, natural.width, natural.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        target.allocated = natural;
      }
      g.texElementSubImage2D(gl.TEXTURE_2D, 0, 0, 0, element);
    } else if (support.version === "legacy") {
      g.texElementImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, element);
    } else if (typeof g.texElementImage2D === "function") {
      g.texElementImage2D(gl.TEXTURE_2D, gl.RGBA8, element);
    } else {
      return false;
    }
  } catch {
    return false;
  }
  target.width = width;
  target.height = height;
  return true;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
