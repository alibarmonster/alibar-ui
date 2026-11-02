"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { createGrid, createProgram, drawMesh, PROJECT_GLSL, ROUND_RECT_GLSL, setMatrix, type Mesh, type Program } from "@/lib/html-canvas/gl";
import { createElementTexture, uploadElementTexture, type ElementTexture } from "@/lib/html-canvas/texture-webgl";
import { syncElementGeometry } from "@/lib/html-canvas/sync-geometry";
import { useHtmlCanvas, type HtmlCanvasMode } from "@/lib/html-canvas/use-html-canvas";

export interface LiquidGlassOverlayProps {
  /** The live content under the glass. */
  children: ReactNode;
  /** Real controls inside the glass, e.g. buttons. */
  toolbar: ReactNode;
  /** Starting position of the glass's top-left corner, in px within the content. @default { x: 24, y: 24 } */
  defaultPosition?: { x: number; y: number };
  /** How strongly the edges bend the content beneath, 0–1. @default 0.6 */
  refraction?: number;
  /** Accessible name for the toolbar. @default "Toolbar" */
  label?: string;
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
uniform mat4 u_matrix;
out vec2 v_uv;
${PROJECT_GLSL}
void main() {
  v_uv = a_pos;
  gl_Position = projectCss(u_matrix * vec4(a_pos * u_size, 0.0, 1.0));
}`;

const CONTENT_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_size;
uniform vec4 u_glass;
uniform float u_refraction;
out vec4 outColor;
${ROUND_RECT_GLSL}

void main() {
  vec2 px = v_uv * u_size;
  vec2 half_ = u_glass.zw * 0.5;
  vec2 center = u_glass.xy + half_;
  float radius = min(half_.x, half_.y);
  vec2 p = px - center;
  float d = sdRoundRect(p, half_, radius);
  vec4 base = texture(u_tex, v_uv);
  if (d > 0.0) {
    // A soft shadow under the glass.
    float shadow = (1.0 - smoothstep(0.0, 18.0, sdRoundRect(p - vec2(0.0, 6.0), half_, radius))) * 0.16;
    outColor = vec4(base.rgb * (1.0 - shadow * base.a), max(base.a, shadow));
    return;
  }
  // Edge band: the content is pushed outward near the rim, more for red than for blue.
  float band = 1.0 - smoothstep(0.0, min(10.0, radius * 0.6), -d);
  float e = 0.01;
  vec2 grad = normalize(vec2(sdRoundRect(p + vec2(e, 0.0), half_, radius) - sdRoundRect(p - vec2(e, 0.0), half_, radius), sdRoundRect(p + vec2(0.0, e), half_, radius) - sdRoundRect(p - vec2(0.0, e), half_, radius)) + 1e-5);
  float bend = band * band * 14.0 * u_refraction;
  vec2 o = -grad * bend;
  float r = texture(u_tex, (px + o * 1.12) / u_size).r;
  float g = texture(u_tex, (px + o) / u_size).g;
  float b = texture(u_tex, (px + o * 0.88) / u_size).b;
  float a = texture(u_tex, (px + o) / u_size).a;
  vec3 col = mix(vec3(1.0), vec3(r, g, b), a);
  // Glass tint, a specular rim along the top and a faint inner edge.
  col = mix(col, vec3(1.0), 0.18);
  float rim = 1.0 - smoothstep(0.0, 1.6, -d);
  float top = smoothstep(0.2, -1.0, p.y / half_.y);
  col += rim * (0.35 + 0.4 * top);
  col += band * 0.06 * top;
  outColor = vec4(col, 1.0);
}`;

const TOOL_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_tex;
out vec4 outColor;
void main() { outColor = texture(u_tex, v_uv); }`;

/**
 * A draggable liquid-glass toolbar floating over live DOM content through HTML-in-Canvas: the content
 * beneath is refracted at the glass's edges with a chromatic fringe and a specular rim, while the
 * middle stays readable and the glass holds real buttons. Without the API, the glass is a
 * backdrop-filter blur with a gradient rim.
 */
export function LiquidGlassOverlay({ children, toolbar, defaultPosition = { x: 24, y: 24 }, refraction = 0.6, label = "Toolbar", rendering = "auto", onModeChange, className }: LiquidGlassOverlayProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(defaultPosition);
  const posRef = useRef(defaultPosition);
  const [height, setHeight] = useState<number | null>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const gl = useRef<{ content: Program; tool: Program; mesh: Mesh; tc: ElementTexture; tt: ElementTexture } | null>(null);

  const { native, canvasRef, canvasProps, invalidate } = useHtmlCanvas({
    context: "webgl2",
    mode: rendering,
    setup: (ctx) => {
      gl.current = { content: createProgram(ctx, VERT, CONTENT_FRAG), tool: createProgram(ctx, VERT, TOOL_FRAG), mesh: createGrid(ctx), tc: createElementTexture(ctx), tt: createElementTexture(ctx) };
      return () => {
        const g = gl.current;
        if (!g) return;
        ctx.deleteProgram(g.content.program);
        ctx.deleteProgram(g.tool.program);
        ctx.deleteTexture(g.tc.texture);
        ctx.deleteTexture(g.tt.texture);
        gl.current = null;
      };
    },
    render: ({ ctx, canvas, width, height: h, reason, changed }) => {
      const g = gl.current;
      const content = contentRef.current;
      const glass = glassRef.current;
      if (!g || !content || !glass) return;
      const at = new DOMMatrix().translate(posRef.current.x, posRef.current.y);
      const all = reason === "resize" || reason === "request" || !g.tc.width;
      if (all || changed.some((el) => el === content || content.contains(el))) {
        uploadElementTexture(ctx, g.tc, content);
        syncElementGeometry(canvas, content, new DOMMatrix());
      }
      if (all || changed.some((el) => el === glass || glass.contains(el))) uploadElementTexture(ctx, g.tt, glass);
      syncElementGeometry(canvas, glass, at);

      ctx.viewport(0, 0, canvas.width, canvas.height);
      ctx.clearColor(0, 0, 0, 0);
      ctx.clear(ctx.COLOR_BUFFER_BIT);
      ctx.enable(ctx.BLEND);
      ctx.blendFunc(ctx.ONE, ctx.ONE_MINUS_SRC_ALPHA);
      ctx.activeTexture(ctx.TEXTURE0);

      ctx.useProgram(g.content.program);
      ctx.uniform2f(g.content.u("u_canvas"), width, h);
      ctx.uniform2f(g.content.u("u_size"), width, h);
      setMatrix(ctx, g.content.u("u_matrix"), new DOMMatrix());
      ctx.uniform4f(g.content.u("u_glass"), posRef.current.x, posRef.current.y, glass.offsetWidth, glass.offsetHeight);
      ctx.uniform1f(g.content.u("u_refraction"), Math.max(0, Math.min(1, refraction)));
      ctx.bindTexture(ctx.TEXTURE_2D, g.tc.texture);
      ctx.uniform1i(g.content.u("u_tex"), 0);
      drawMesh(ctx, g.mesh);

      ctx.useProgram(g.tool.program);
      ctx.uniform2f(g.tool.u("u_canvas"), width, h);
      ctx.uniform2f(g.tool.u("u_size"), g.tt.width || glass.offsetWidth, g.tt.height || glass.offsetHeight);
      setMatrix(ctx, g.tool.u("u_matrix"), at);
      ctx.bindTexture(ctx.TEXTURE_2D, g.tt.texture);
      ctx.uniform1i(g.tool.u("u_tex"), 0);
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

  const bounds = () => {
    const content = contentRef.current;
    const glass = glassRef.current;
    return { w: (content?.offsetWidth ?? 0) - (glass?.offsetWidth ?? 0), h: (content?.offsetHeight ?? 0) - (glass?.offsetHeight ?? 0) };
  };
  const moveTo = (x: number, y: number) => {
    const b = bounds();
    const next = { x: Math.max(0, Math.min(b.w, x)), y: Math.max(0, Math.min(b.h, y)) };
    posRef.current = next;
    setPos(next);
    invalidate();
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // Buttons inside the glass keep their clicks; the rest of the glass drags it.
    if ((event.target as HTMLElement).closest("button:not([data-glass-handle]), a, input")) return;
    drag.current = { dx: event.clientX - posRef.current.x, dy: event.clientY - posRef.current.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    moveTo(event.clientX - drag.current.dx, event.clientY - drag.current.dy);
  };
  const onPointerUp = () => {
    drag.current = null;
  };
  const onHandleKey = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const step = event.shiftKey ? 40 : 10;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const m = moves[event.key];
    if (!m) return;
    event.preventDefault();
    moveTo(posRef.current.x + m[0], posRef.current.y + m[1]);
  };

  const glass = (
    <div
      ref={glassRef}
      role="toolbar"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn(
        "flex w-max cursor-grab touch-none items-center gap-1 rounded-full p-1.5 active:cursor-grabbing",
        native ? "" : "absolute border border-white/60 bg-white/35 shadow-[0_8px_24px_-8px_rgb(0_0_0/0.3),inset_0_1px_0_rgb(255_255_255/0.9)] backdrop-blur-md backdrop-saturate-150",
      )}
      style={native ? undefined : { left: pos.x, top: pos.y }}
    >
      <button
        type="button"
        data-glass-handle
        aria-label="Move toolbar (arrow keys)"
        onKeyDown={onHandleKey}
        className="grid size-8 cursor-grab place-items-center rounded-full text-foreground/60 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </button>
      {toolbar}
    </div>
  );

  if (!native) {
    return (
      <div className={cn("relative w-full", className)}>
        <div ref={contentRef}>{children}</div>
        {glass}
      </div>
    );
  }

  return (
    <div className={cn("relative w-full", className)} style={{ height: height ?? undefined }}>
      <canvas ref={canvasRef} {...canvasProps} className="absolute inset-0 block size-full">
        <div ref={contentRef} className="w-full">
          {children}
        </div>
        {glass}
      </canvas>
    </div>
  );
}
