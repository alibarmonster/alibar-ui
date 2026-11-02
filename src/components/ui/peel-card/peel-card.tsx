"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { createGrid, createProgram, drawMesh, PROJECT_GLSL, rgb, type Mesh, type Program } from "@/lib/html-canvas/gl";
import { createElementTexture, uploadElementTexture, type ElementTexture } from "@/lib/html-canvas/texture-webgl";
import { syncElementGeometry } from "@/lib/html-canvas/sync-geometry";
import { useHtmlCanvas, type HtmlCanvasMode } from "@/lib/html-canvas/use-html-canvas";

export interface PeelCardProps {
  /** The face on top. */
  front: ReactNode;
  /** The face revealed underneath. */
  back: ReactNode;
  /** Revealed state (controlled). */
  revealed?: boolean;
  /** Starting state when uncontrolled. @default false */
  defaultRevealed?: boolean;
  /** Called when the card is peeled off or covered again. */
  onRevealChange?: (revealed: boolean) => void;
  /** Color of the paper's underside. @default "#f4f1ea" */
  paperColor?: string;
  /** Accessible names for the corner control. */
  labels?: { reveal?: string; cover?: string };
  /** "auto" uses HTML-in-Canvas when available, "fallback" never does. @default "auto" */
  rendering?: HtmlCanvasMode;
  /** Called when the rendering mode is known. */
  onModeChange?: (native: boolean) => void;
  /** Classes for the root. */
  className?: string;
}

/** Room around the card for the flap to swing into, in px. */
const PAD = 48;
const RADIUS = 18;
const HINT = 22;

const FRONT_VERT = /* glsl */ `#version 300 es
in vec2 a_pos;
uniform vec2 u_size;
uniform vec2 u_offset;
uniform vec2 u_corner;
uniform vec2 u_point;
uniform float u_radius;
out vec2 v_uv;
out float v_angle;
${PROJECT_GLSL}
void main() {
  vec2 x = a_pos * u_size;
  vec3 pos = vec3(x, 0.0);
  float angle = 0.0;
  vec2 cp = u_point - u_corner;
  float len = length(cp);
  if (len > 0.5) {
    // Fold line: the perpendicular bisector of corner → pointer, shifted so the flap lands on the pointer.
    vec2 n = -cp / len;
    float pi = 3.14159265;
    vec2 m = (u_corner + u_point) * 0.5 - n * pi * u_radius * 0.5;
    float s = dot(x - m, n);
    if (s > 0.0) {
      float r = u_radius;
      float s2;
      float z;
      if (s < pi * r) {
        angle = s / r;
        s2 = r * sin(angle);
        z = r * (1.0 - cos(angle));
      } else {
        angle = pi;
        s2 = -(s - pi * r);
        z = 2.0 * r;
      }
      pos = vec3(x - n * s + n * s2, z);
    }
  }
  v_uv = a_pos;
  v_angle = angle;
  vec4 clip = projectCss(vec4(u_offset + pos.xy, 0.0, 1.0));
  clip.z = (0.4 - pos.z * 0.004) * clip.w;
  gl_Position = clip;
}`;

const FRONT_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
in float v_angle;
uniform sampler2D u_tex;
uniform vec3 u_paper;
uniform float u_alpha;
out vec4 outColor;
void main() {
  vec4 c = texture(u_tex, v_uv);
  if (c.a < 0.01) discard;
  if (v_angle > 1.5708) {
    // The flap shows the paper's underside, lit by how far it has turned.
    float light = 0.82 + 0.18 * -cos(v_angle);
    outColor = vec4(u_paper * light, 1.0) * c.a * u_alpha;
  } else {
    float light = 1.0 - sin(v_angle) * 0.18;
    outColor = vec4(c.rgb * light, c.a) * u_alpha;
  }
}`;

const BACK_VERT = /* glsl */ `#version 300 es
in vec2 a_pos;
uniform vec2 u_size;
uniform vec2 u_offset;
out vec2 v_px;
out vec2 v_uv;
${PROJECT_GLSL}
void main() {
  v_uv = a_pos;
  v_px = a_pos * u_size;
  vec4 clip = projectCss(vec4(u_offset + v_px, 0.0, 1.0));
  clip.z = 0.9 * clip.w;
  gl_Position = clip;
}`;

const BACK_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_px;
in vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_corner;
uniform vec2 u_point;
uniform float u_radius;
out vec4 outColor;
void main() {
  vec4 c = texture(u_tex, v_uv);
  vec2 cp = u_point - u_corner;
  float len = length(cp);
  if (len > 0.5) {
    // A soft shadow cast by the curl onto the face below, strongest along the fold.
    vec2 n = -cp / len;
    vec2 m = (u_corner + u_point) * 0.5 - n * 3.14159265 * u_radius * 0.5;
    float s = dot(v_px - m, n);
    float shadow = s > 0.0 ? exp(-s / (u_radius * 1.6)) * 0.35 : 0.0;
    c.rgb *= 1.0 - shadow;
  }
  outColor = c;
}`;

/**
 * A DOM card (a coupon, a profile, real links) that peels like paper through HTML-in-Canvas: drag the
 * lifted corner to curl it back and reveal a second live face underneath. Released past halfway it
 * peels off; otherwise it springs back. Without the API, the corner button flips the card in CSS 3D.
 */
export function PeelCard({
  front,
  back,
  revealed: revealedProp,
  defaultRevealed = false,
  onRevealChange,
  paperColor = "#f4f1ea",
  labels,
  rendering = "auto",
  onModeChange,
  className,
}: PeelCardProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const [inner, setInner] = useState(defaultRevealed);
  const revealed = revealedProp ?? inner;
  const rootRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [animating, setAnimating] = useState(false);
  const peel = useRef({ x: 0, y: 0, tx: 0, ty: 0, dragging: false, ready: false, startX: 0, startY: 0, moved: false });
  const gl = useRef<{ front: Program; back: Program; mesh: Mesh; quad: Mesh; tf: ElementTexture; tb: ElementTexture } | null>(null);

  const setRevealed = (next: boolean) => {
    if (revealedProp === undefined) setInner(next);
    onRevealChange?.(next);
  };

  const { native, canvasRef, canvasProps, invalidate } = useHtmlCanvas({
    context: "webgl2",
    mode: rendering,
    animating,
    contextAttributes: { depth: true },
    setup: (ctx) => {
      gl.current = {
        front: createProgram(ctx, FRONT_VERT, FRONT_FRAG),
        back: createProgram(ctx, BACK_VERT, BACK_FRAG),
        mesh: createGrid(ctx, 28, 28),
        quad: createGrid(ctx),
        tf: createElementTexture(ctx),
        tb: createElementTexture(ctx),
      };
      return () => {
        const g = gl.current;
        if (!g) return;
        ctx.deleteProgram(g.front.program);
        ctx.deleteProgram(g.back.program);
        ctx.deleteTexture(g.tf.texture);
        ctx.deleteTexture(g.tb.texture);
        gl.current = null;
      };
    },
    render: ({ ctx, canvas, width, height: h, reason, delta }) => {
      const g = gl.current;
      const f = frontRef.current;
      const b = backRef.current;
      if (!g || !f || !b) return;
      if (reason !== "frame" || !g.tf.width) {
        uploadElementTexture(ctx, g.tf, f);
        uploadElementTexture(ctx, g.tb, b);
        const at = new DOMMatrix().translate(PAD, PAD);
        syncElementGeometry(canvas, f, at);
        syncElementGeometry(canvas, b, at);
      }
      const w = g.tf.width || f.offsetWidth;
      const hh = g.tf.height || f.offsetHeight;
      const corner = { x: w, y: hh };
      const p = peel.current;
      if (!p.ready) {
        p.x = p.tx = corner.x - HINT;
        p.y = p.ty = corner.y - HINT;
        p.ready = true;
      }
      // Ease toward the target (the pointer while dragging).
      const k = p.dragging ? 1 - Math.exp(-delta * 30) : 1 - Math.exp(-delta * 9);
      p.x += (p.tx - p.x) * (reason === "frame" ? k : 0);
      p.y += (p.ty - p.y) * (reason === "frame" ? k : 0);
      const settled = Math.hypot(p.tx - p.x, p.ty - p.y) < 0.5;
      if (settled) {
        p.x = p.tx;
        p.y = p.ty;
        if (!p.dragging && animating) window.setTimeout(() => setAnimating(false), 0);
      }

      ctx.viewport(0, 0, canvas.width, canvas.height);
      ctx.clearColor(0, 0, 0, 0);
      ctx.clearDepth(1);
      ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);
      ctx.enable(ctx.DEPTH_TEST);
      ctx.depthFunc(ctx.LEQUAL);
      ctx.enable(ctx.BLEND);
      ctx.blendFunc(ctx.ONE, ctx.ONE_MINUS_SRC_ALPHA);
      ctx.activeTexture(ctx.TEXTURE0);

      ctx.useProgram(g.back.program);
      ctx.uniform2f(g.back.u("u_canvas"), width, h);
      ctx.uniform2f(g.back.u("u_size"), g.tb.width || w, g.tb.height || hh);
      ctx.uniform2f(g.back.u("u_offset"), PAD, PAD);
      ctx.uniform2f(g.back.u("u_corner"), corner.x, corner.y);
      ctx.uniform2f(g.back.u("u_point"), p.x, p.y);
      ctx.uniform1f(g.back.u("u_radius"), RADIUS);
      ctx.bindTexture(ctx.TEXTURE_2D, g.tb.texture);
      ctx.uniform1i(g.back.u("u_tex"), 0);
      drawMesh(ctx, g.quad);

      const gone = revealed && settled;
      if (!gone) {
        ctx.useProgram(g.front.program);
        ctx.uniform2f(g.front.u("u_canvas"), width, h);
        ctx.uniform2f(g.front.u("u_size"), w, hh);
        ctx.uniform2f(g.front.u("u_offset"), PAD, PAD);
        ctx.uniform2f(g.front.u("u_corner"), corner.x, corner.y);
        ctx.uniform2f(g.front.u("u_point"), p.x, p.y);
        ctx.uniform1f(g.front.u("u_radius"), RADIUS);
        ctx.uniform3f(g.front.u("u_paper"), ...rgb(paperColor));
        ctx.uniform1f(g.front.u("u_alpha"), 1);
        ctx.bindTexture(ctx.TEXTURE_2D, g.tf.texture);
        ctx.uniform1i(g.front.u("u_tex"), 0);
        drawMesh(ctx, g.mesh);
      }
      ctx.disable(ctx.DEPTH_TEST);
    },
  });

  useEffect(() => onModeChange?.(native), [native, onModeChange]);

  // The canvas wraps the taller face.
  useEffect(() => {
    if (!native) return;
    // Canvas children shrink to fit, so the faces take the root's width explicitly.
    const measure = () => {
      const f = frontRef.current;
      const b = backRef.current;
      const root = rootRef.current;
      if (f && b && root) setSize({ w: root.clientWidth, h: Math.max(f.offsetHeight, b.offsetHeight) });
    };
    const observer = new ResizeObserver(measure);
    if (rootRef.current) observer.observe(rootRef.current);
    if (frontRef.current) observer.observe(frontRef.current);
    if (backRef.current) observer.observe(backRef.current);
    measure();
    return () => observer.disconnect();
  }, [native]);

  // Revealed: the flap swings past the opposite corner. Covered: it rests on the corner with a small lift.
  const aim = (next: boolean) => {
    const f = frontRef.current;
    if (!f) return;
    const w = f.offsetWidth;
    const h = f.offsetHeight;
    const p = peel.current;
    p.tx = next ? w - 2.3 * w : w - HINT;
    p.ty = next ? h - 2.3 * h : h - HINT;
    setAnimating(true);
    invalidate();
  };

  useEffect(() => {
    if (native) aim(revealed);
    // aim reads refs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, native]);

  const local = (event: React.PointerEvent) => {
    const rect = frontRef.current?.getBoundingClientRect();
    const f = frontRef.current;
    if (!rect || !f) return { x: 0, y: 0 };
    // The front's box is synced to the card; its layout size is unscaled.
    return { x: ((event.clientX - rect.left) / rect.width) * f.offsetWidth, y: ((event.clientY - rect.top) / rect.height) * f.offsetHeight };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    // Peeling is a drag on the front; covering again is a click.
    if (!native || revealed) return;
    const p = peel.current;
    p.dragging = true;
    p.moved = false;
    p.startX = event.clientX;
    p.startY = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const p = peel.current;
    if (!p.dragging) return;
    if (Math.hypot(event.clientX - p.startX, event.clientY - p.startY) > 4) p.moved = true;
    if (!p.moved) return;
    const q = local(event);
    p.tx = q.x;
    p.ty = q.y;
    setAnimating(true);
  };
  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const p = peel.current;
    if (!p.dragging) return;
    p.dragging = false;
    if (!p.moved) return;
    event.preventDefault();
    const f = frontRef.current;
    if (!f) return;
    // Past halfway along the diagonal it peels off; otherwise it springs back.
    const w = f.offsetWidth;
    const h = f.offsetHeight;
    const travelled = Math.hypot(w - p.tx, h - p.ty) / Math.hypot(w, h);
    if (travelled > 0.5) setRevealed(true);
    else aim(false);
  };
  const onClick = () => {
    if (peel.current.moved) {
      peel.current.moved = false;
      return;
    }
    setRevealed(!revealed);
  };

  const corner = (
    <button
      type="button"
      aria-label={revealed ? (labels?.cover ?? "Cover the back again") : (labels?.reveal ?? "Peel to reveal the back")}
      aria-controls={`${id}-faces`}
      aria-expanded={revealed}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (peel.current.dragging = false)}
      onClick={onClick}
      className={cn(
        "absolute z-10 size-12 cursor-grab touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing",
        native ? (revealed ? "top-1 right-1" : "right-0 bottom-0") : "right-1 bottom-1 grid place-items-center bg-background/80 shadow-sm",
      )}
    >
      {!native ? (
        <svg viewBox="0 0 16 16" className="size-4 text-foreground" aria-hidden="true">
          <path d="M3 13L13 3M13 3H7M13 3v6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </button>
  );

  if (!native) {
    return (
      <div className={cn("relative w-full max-w-sm [perspective:1200px]", className)}>
        <motion.div
          id={`${id}-faces`}
          className="relative grid [transform-style:preserve-3d] [&>*]:[grid-area:1/1]"
          initial={false}
          animate={{ rotateY: revealed ? 180 : 0 }}
          transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 22 }}
        >
          <div className="[backface-visibility:hidden]" aria-hidden={revealed} inert={revealed}>
            {front}
          </div>
          <div className="[transform:rotateY(180deg)] [backface-visibility:hidden]" aria-hidden={!revealed} inert={!revealed}>
            {back}
          </div>
        </motion.div>
        {corner}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={cn("relative w-full max-w-sm", className)} style={{ height: size?.h }}>
      <div className="absolute" style={{ inset: -PAD }}>
        <canvas ref={canvasRef} {...canvasProps} id={`${id}-faces`} className="pointer-events-none block size-full">
          <div ref={backRef} className="pointer-events-auto" style={{ width: size?.w ?? 320 }} aria-hidden={!revealed} inert={!revealed}>
            {back}
          </div>
          <div ref={frontRef} className="pointer-events-auto" style={{ width: size?.w ?? 320 }} aria-hidden={revealed} inert={revealed}>
            {front}
          </div>
        </canvas>
      </div>
      {corner}
    </div>
  );
}
