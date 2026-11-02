"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { createGrid, createProgram, drawMesh, PROJECT_GLSL, type Mesh, type Program } from "@/lib/html-canvas/gl";
import { createElementTexture, uploadElementTexture, type ElementTexture } from "@/lib/html-canvas/texture-webgl";
import { syncElementGeometry } from "@/lib/html-canvas/sync-geometry";
import { useHtmlCanvas, type HtmlCanvasMode } from "@/lib/html-canvas/use-html-canvas";

export interface MagnifierLensProps {
  /** The live content to magnify. It stays fully interactive under the lens. */
  children: ReactNode;
  /** Magnification. @default 2 */
  zoom?: number;
  /** Lens diameter in px. @default 140 */
  size?: number;
  /** Barrel distortion toward the rim, 0–1. @default 0.35 */
  distortion?: number;
  /** "auto" uses HTML-in-Canvas when available, "fallback" never does. @default "auto" */
  rendering?: HtmlCanvasMode;
  /** Called when the rendering mode is known. */
  onModeChange?: (native: boolean) => void;
  /** Classes for the root. */
  className?: string;
}

const VERT = /* glsl */ `#version 300 es
in vec2 a_pos;
uniform vec2 u_size;
out vec2 v_uv;
${PROJECT_GLSL}
void main() {
  v_uv = a_pos;
  gl_Position = projectCss(vec4(a_pos * u_size, 0.0, 1.0));
}`;

const FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_size;
uniform vec2 u_lens;
uniform float u_radius;
uniform float u_zoom;
uniform float u_distortion;
uniform float u_show;
out vec4 outColor;

void main() {
  vec2 px = v_uv * u_size;
  vec4 base = texture(u_tex, v_uv);
  float r = u_radius * u_show;
  vec2 d = px - u_lens;
  float dist = length(d);
  if (r < 1.0 || dist > r + 22.0) { outColor = base; return; }
  // Soft drop shadow under the lens.
  float shadow = (1.0 - smoothstep(r - 4.0, r + 20.0, length(d - vec2(0.0, 6.0)))) * 0.22;
  if (dist > r) {
    outColor = vec4(base.rgb * (1.0 - shadow * base.a), max(base.a, shadow));
    return;
  }
  // Inside: magnify around the lens center, pushing harder toward the rim (barrel).
  float n = dist / r;
  float bend = 1.0 + u_distortion * n * n * 1.6;
  vec2 src = u_lens + d / u_zoom * bend;
  vec4 lens = texture(u_tex, clamp(src / u_size, 0.0, 1.0));
  // Glass: a white fill behind the content, a bright rim and a highlight up and to the left.
  vec3 col = mix(vec3(1.0), lens.rgb, lens.a);
  float rim = smoothstep(r - 5.0, r - 1.0, dist);
  col = mix(col, vec3(0.86, 0.88, 0.92), rim * 0.85);
  float edge = 1.0 - smoothstep(r - 1.5, r, dist);
  float hi = smoothstep(0.55, 0.0, length((d / r) - vec2(-0.38, -0.42))) * 0.22;
  col += hi;
  col *= 1.0 - smoothstep(0.75, 1.0, n) * 0.08;
  outColor = vec4(col * edge + base.rgb * (1.0 - edge), 1.0);
}`;

/**
 * A loupe that follows the pointer (or is dragged on touch) over live DOM content, drawn through
 * HTML-in-Canvas: a zoomed, slightly barrel-distorted view inside a glass circle with a rim and soft
 * shadow. The content under the lens stays clickable. Without the API, a scaled clone of the content
 * is shown inside a clip-path circle.
 */
export function MagnifierLens({ children, zoom = 2, size = 140, distortion = 0.35, rendering = "auto", onModeChange, className }: MagnifierLensProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const show = useRef({ value: 0, target: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const [animating, setAnimating] = useState(false);
  const gl = useRef<{ program: Program; mesh: Mesh; texture: ElementTexture } | null>(null);
  const radius = size / 2;

  const { native, canvasRef, canvasProps, invalidate } = useHtmlCanvas({
    context: "webgl2",
    mode: rendering,
    animating,
    setup: (ctx) => {
      gl.current = { program: createProgram(ctx, VERT, FRAG), mesh: createGrid(ctx), texture: createElementTexture(ctx) };
      return () => {
        if (!gl.current) return;
        ctx.deleteProgram(gl.current.program.program);
        ctx.deleteTexture(gl.current.texture.texture);
        gl.current = null;
      };
    },
    render: ({ ctx, canvas, width, height: h, reason, delta }) => {
      const g = gl.current;
      const content = contentRef.current;
      if (!g || !content) return;
      if (reason === "paint" || reason === "resize" || !g.texture.width) {
        uploadElementTexture(ctx, g.texture, content);
        syncElementGeometry(canvas, content, new DOMMatrix());
      }
      // The lens grows in and shrinks away.
      const s = show.current;
      s.value = reason === "frame" ? s.value + (s.target - s.value) * (1 - Math.exp(-delta * 18)) : s.value;
      if (Math.abs(s.target - s.value) < 0.01) {
        s.value = s.target;
        if (animating) window.setTimeout(() => setAnimating(false), 0);
      }
      ctx.viewport(0, 0, canvas.width, canvas.height);
      ctx.clearColor(0, 0, 0, 0);
      ctx.clear(ctx.COLOR_BUFFER_BIT);
      ctx.useProgram(g.program.program);
      const { u } = g.program;
      ctx.uniform2f(u("u_canvas"), width, h);
      ctx.uniform2f(u("u_size"), width, h);
      ctx.uniform2f(u("u_lens"), pos.current.x, pos.current.y);
      ctx.uniform1f(u("u_radius"), radius);
      ctx.uniform1f(u("u_zoom"), Math.max(1, zoom));
      ctx.uniform1f(u("u_distortion"), Math.max(0, Math.min(1, distortion)));
      ctx.uniform1f(u("u_show"), s.value);
      ctx.activeTexture(ctx.TEXTURE0);
      ctx.bindTexture(ctx.TEXTURE_2D, g.texture.texture);
      ctx.uniform1i(u("u_tex"), 0);
      drawMesh(ctx, g.mesh);
    },
  });

  useEffect(() => onModeChange?.(native), [native, onModeChange]);

  useEffect(() => {
    const el = contentRef.current;
    if (!native || !el) return;
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, [native]);

  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    // On touch the lens only follows while a finger is down.
    if (event.pointerType === "touch" && event.type === "pointermove" && event.buttons === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const p = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    pos.current = p;
    setLens(p);
    if (show.current.target !== 1) {
      show.current.target = 1;
      setAnimating(true);
    }
    invalidate();
  };
  const leave = () => {
    setLens(null);
    show.current.target = 0;
    setAnimating(true);
  };

  if (!native) {
    return (
      <div className={cn("relative w-full", className)} onPointerMove={move} onPointerDown={move} onPointerLeave={leave} onPointerCancel={leave}>
        <div ref={contentRef}>{children}</div>
        {lens ? (
          <div
            aria-hidden="true"
            inert
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{ clipPath: `circle(${radius}px at ${lens.x}px ${lens.y}px)` }}
          >
            <div className="absolute inset-0 bg-background" style={{ transformOrigin: `${lens.x}px ${lens.y}px`, transform: `scale(${zoom})` }}>
              {children}
            </div>
            <span
              className="absolute rounded-full shadow-[inset_0_0_0_4px_rgb(220_224_232),inset_8px_8px_24px_rgb(255_255_255/0.4)]"
              style={{ left: lens.x - radius, top: lens.y - radius, width: size, height: size }}
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("relative w-full touch-pan-y", className)} style={{ height: height ?? undefined }} onPointerMove={move} onPointerDown={move} onPointerLeave={leave} onPointerCancel={leave}>
      <canvas ref={canvasRef} {...canvasProps} className="absolute inset-0 block size-full">
        <div ref={contentRef} className="w-full">
          {children}
        </div>
      </canvas>
    </div>
  );
}
