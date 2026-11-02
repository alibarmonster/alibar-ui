/**
 * Feature detection for the experimental HTML-in-Canvas API (WICG html-in-canvas). The API is a
 * Chrome origin trial, not a standard, and its shape changed in Chrome 150 and 155. Nothing outside
 * `src/lib/html-canvas/` may touch it: every call goes through these adapters.
 *
 * - 155+: `content="drawable"`, `drawable` descendants, `texElementSubImage2D`,
 *   `canvas.updateElementGeometry()` and automatic hit-testing for 2D draws.
 * - 150–154: `layoutsubtree`, `drawElementImage()` returning a DOMMatrix, `texElementImage2D(target,
 *   internalformat, element)` and `canvas.getElementTransform(element, drawTransform)`.
 * - legacy (< 150): `texElementImage2D(target, level, internalformat, format, type, element)`.
 */

export type HtmlCanvasVersion = "155+" | "150-154" | "legacy" | "none";

export interface HtmlCanvasSupport {
  /** `drawElementImage` on 2D contexts. */
  twoD: boolean;
  /** Element textures in WebGL2. */
  webgl: boolean;
  /** Element textures in WebGPU. */
  webgpu: boolean;
  version: HtmlCanvasVersion;
}

export const NO_SUPPORT: HtmlCanvasSupport = { twoD: false, webgl: false, webgpu: false, version: "none" };

/* eslint-disable @typescript-eslint/no-explicit-any -- the API is not in lib.dom yet */
let cached: HtmlCanvasSupport | null = null;

/** What this browser supports. Always "none" on the server. Cached after the first call. */
export function getHtmlCanvasSupport(): HtmlCanvasSupport {
  if (typeof window === "undefined" || typeof HTMLCanvasElement === "undefined") return NO_SUPPORT;
  if (cached) return cached;
  const canvasProto = HTMLCanvasElement.prototype as any;
  const ctx2d = typeof CanvasRenderingContext2D !== "undefined" ? (CanvasRenderingContext2D.prototype as any) : {};
  const gl2 = typeof WebGL2RenderingContext !== "undefined" ? (WebGL2RenderingContext.prototype as any) : {};
  const gpuQueue = typeof (window as any).GPUQueue !== "undefined" ? (window as any).GPUQueue.prototype : {};

  const twoD = "drawElementImage" in ctx2d;
  const sub = "texElementSubImage2D" in gl2;
  const tex = "texElementImage2D" in gl2;
  const webgpu = "drawElementImageToTexture" in gpuQueue || "copyElementImageToTexture" in gpuQueue;

  let version: HtmlCanvasVersion = "none";
  if (sub || "content" in canvasProto || "updateElementGeometry" in canvasProto) version = "155+";
  else if (tex) version = typeof gl2.texElementImage2D === "function" && gl2.texElementImage2D.length >= 6 ? "legacy" : "150-154";
  else if (twoD || "layoutSubtree" in canvasProto) version = "150-154";

  cached = { twoD, webgl: sub || tex, webgpu, version };
  return cached;
}

/** True when the API can draw into the given context type. */
export function supportsContext(support: HtmlCanvasSupport, context: "2d" | "webgl2") {
  return support.version !== "none" && (context === "2d" ? support.twoD : support.webgl);
}

/** A short label for status chips: "Chrome 150–154 API". */
export function describeSupport(support: HtmlCanvasSupport) {
  if (support.version === "none") return "Not supported";
  return { "155+": "Chrome 155+ API", "150-154": "Chrome 150–154 API", legacy: "Pre-150 API" }[support.version];
}
/* eslint-enable @typescript-eslint/no-explicit-any */
