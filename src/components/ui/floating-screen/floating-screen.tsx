"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { cn } from "@/lib/utils";
import { createGrid, createProgram, drawMesh, PROJECT_GLSL, ROUND_RECT_GLSL, setMatrix, type Mesh, type Program } from "@/lib/html-canvas/gl";
import { createElementTexture, uploadElementTexture, type ElementTexture } from "@/lib/html-canvas/texture-webgl";
import { perspective, syncElementGeometry } from "@/lib/html-canvas/sync-geometry";
import { useHtmlCanvas, type HtmlCanvasMode } from "@/lib/html-canvas/use-html-canvas";

export interface FloatingScreenProps {
  /** The live mini-app on the screen. It is sized to the screen and stays fully clickable. */
  children: ReactNode;
  /** The device around the screen. @default "laptop" */
  device?: "laptop" | "phone";
  /** Most the device tilts toward the pointer, in degrees. @default 10 */
  tilt?: number;
  /** Follow the pointer. @default true */
  interactive?: boolean;
  /** "auto" uses HTML-in-Canvas when available, "fallback" never does. @default "auto" */
  rendering?: HtmlCanvasMode;
  /** Called when the rendering mode is known. */
  onModeChange?: (native: boolean) => void;
  /** Classes for the root. */
  className?: string;
}

const SIZES = {
  laptop: { w: 440, h: 276, bezel: 14, baseTilt: -6, stage: 420 },
  phone: { w: 210, h: 430, bezel: 10, baseTilt: 0, stage: 500 },
} as const;
const DISTANCE = 1100;

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

const SCREEN_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_glare;
out vec4 outColor;
void main() {
  vec4 c = texture(u_tex, v_uv);
  // A glossy reflection band that slides with the tilt.
  float band = smoothstep(0.35, 0.0, abs(v_uv.x * 0.8 + v_uv.y * 0.6 - 0.55 - u_glare.x * 0.6));
  c.rgb += band * 0.07 + (1.0 - v_uv.y) * 0.02;
  outColor = vec4(c.rgb, 1.0);
}`;

const BODY_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
uniform vec2 u_size;
uniform float u_kind; // 0 bezel (laptop), 1 deck, 2 phone body
uniform float u_radius;
out vec4 outColor;
${ROUND_RECT_GLSL}
void main() {
  vec2 p = v_uv * u_size - u_size * 0.5;
  if (u_kind < 0.5 || u_kind > 1.5) {
    float d = sdRoundRect(p, u_size * 0.5, u_radius);
    float a = 1.0 - smoothstep(-1.0, 0.5, d);
    vec3 col = u_kind > 1.5 ? vec3(0.12, 0.12, 0.14) : vec3(0.09, 0.09, 0.1);
    col += (1.0 - smoothstep(-2.5, 0.0, d)) * 0.25 * (u_kind > 1.5 ? 1.0 : 0.6);
    outColor = vec4(col * a, a);
    return;
  }
  // Keyboard deck, softened toward the near edge (depth of field: focus is on the screen).
  float soft = 0.5 + v_uv.y * 3.5;
  float d = sdRoundRect(p, u_size * 0.5, u_radius);
  float a = 1.0 - smoothstep(-soft, soft, d);
  vec3 col = mix(vec3(0.84, 0.85, 0.88), vec3(0.76, 0.77, 0.8), v_uv.y);
  vec2 keys = vec2(u_size.x * 0.82, u_size.y * 0.42);
  vec2 kp = p - vec2(0.0, -u_size.y * 0.16);
  if (abs(kp.x) < keys.x * 0.5 && abs(kp.y) < keys.y * 0.5) {
    vec2 cell = vec2(keys.x / 14.0, keys.y / 5.0);
    vec2 q = mod(kp + keys * 0.5, cell) - cell * 0.5;
    float kd = sdRoundRect(q, cell * 0.5 - 1.6, 1.8);
    col = mix(col, vec3(0.22, 0.22, 0.25), 1.0 - smoothstep(-soft * 0.4, soft * 0.4, kd));
  }
  vec2 tp = p - vec2(0.0, u_size.y * 0.3);
  float td = sdRoundRect(tp, vec2(u_size.x * 0.17, u_size.y * 0.13), 5.0);
  col = mix(col, vec3(0.79, 0.8, 0.83), (1.0 - smoothstep(-soft, soft, td)) * 0.9);
  outColor = vec4(col * a, a);
}`;

/**
 * A live DOM mini-app shown on a tilted 3D laptop or phone through HTML-in-Canvas, with a glossy screen
 * reflection and a softly defocused keyboard deck. The device leans toward the pointer and the app
 * stays fully clickable, because its geometry is synced through the same perspective matrix. Without
 * the API, the same device is built from CSS 3D transforms.
 */
export function FloatingScreen({ children, device = "laptop", tilt = 10, interactive = true, rendering = "auto", onModeChange, className }: FloatingScreenProps) {
  const reduceMotion = useReducedMotion();
  const spec = SIZES[device];
  const screenRef = useRef<HTMLDivElement>(null);
  const aim = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const [animating, setAnimating] = useState(false);
  const gl = useRef<{ screen: Program; body: Program; mesh: Mesh; texture: ElementTexture } | null>(null);
  // Fallback tilt follows the pointer through springs.
  const rx = useMotionValue<number>(spec.baseTilt);
  const ry = useMotionValue<number>(0);
  const srx = useSpring(rx, { stiffness: 120, damping: 18 });
  const sry = useSpring(ry, { stiffness: 120, damping: 18 });

  const { native, canvasRef, canvasProps } = useHtmlCanvas({
    context: "webgl2",
    mode: rendering,
    animating,
    setup: (ctx) => {
      gl.current = { screen: createProgram(ctx, VERT, SCREEN_FRAG), body: createProgram(ctx, VERT, BODY_FRAG), mesh: createGrid(ctx), texture: createElementTexture(ctx) };
      return () => {
        const g = gl.current;
        if (!g) return;
        ctx.deleteProgram(g.screen.program);
        ctx.deleteProgram(g.body.program);
        ctx.deleteTexture(g.texture.texture);
        gl.current = null;
      };
    },
    render: ({ ctx, canvas, width, height: h, reason, delta }) => {
      const g = gl.current;
      const screen = screenRef.current;
      if (!g || !screen) return;
      const a = aim.current;
      const k = reason === "frame" ? 1 - Math.exp(-delta * 7) : 0;
      a.x += (a.tx - a.x) * k;
      a.y += (a.ty - a.y) * k;
      const settled = Math.abs(a.tx - a.x) < 0.002 && Math.abs(a.ty - a.y) < 0.002;
      if (settled && animating) window.setTimeout(() => setAnimating(false), 0);

      const { w, h: sh, bezel, baseTilt } = spec;
      const lift = device === "laptop" ? -40 : 0;
      const plane = new DOMMatrix()
        .translate(width / 2, h / 2 + lift)
        .multiply(perspective(DISTANCE))
        .rotate(baseTilt - a.y * tilt * 0.8, a.x * tilt, 0)
        .translate(-w / 2, -sh / 2);
      if (reason !== "frame" || !g.texture.width) uploadElementTexture(ctx, g.texture, screen);
      syncElementGeometry(canvas, screen, plane);

      ctx.viewport(0, 0, canvas.width, canvas.height);
      ctx.clearColor(0, 0, 0, 0);
      ctx.clear(ctx.COLOR_BUFFER_BIT);
      ctx.enable(ctx.BLEND);
      ctx.blendFunc(ctx.ONE, ctx.ONE_MINUS_SRC_ALPHA);
      ctx.activeTexture(ctx.TEXTURE0);

      ctx.useProgram(g.body.program);
      ctx.uniform2f(g.body.u("u_canvas"), width, h);
      if (device === "laptop") {
        // Deck: hinged at the screen's bottom edge, folded toward the viewer.
        const deckW = w + bezel * 2 + 36;
        const deckH = 190;
        const deck = plane.translate(-(bezel + 18), sh + bezel).rotate(78, 0, 0);
        setMatrix(ctx, g.body.u("u_matrix"), deck);
        ctx.uniform2f(g.body.u("u_size"), deckW, deckH);
        ctx.uniform1f(g.body.u("u_kind"), 1);
        ctx.uniform1f(g.body.u("u_radius"), 14);
        drawMesh(ctx, g.mesh);
      }
      const frame = plane.translate(-bezel, -bezel);
      setMatrix(ctx, g.body.u("u_matrix"), frame);
      ctx.uniform2f(g.body.u("u_size"), w + bezel * 2, sh + bezel * 2 + (device === "laptop" ? 6 : 0));
      ctx.uniform1f(g.body.u("u_kind"), device === "laptop" ? 0 : 2);
      ctx.uniform1f(g.body.u("u_radius"), device === "laptop" ? 14 : 34);
      drawMesh(ctx, g.mesh);

      ctx.useProgram(g.screen.program);
      ctx.uniform2f(g.screen.u("u_canvas"), width, h);
      setMatrix(ctx, g.screen.u("u_matrix"), plane);
      ctx.uniform2f(g.screen.u("u_size"), w, sh);
      ctx.uniform2f(g.screen.u("u_glare"), a.x, a.y);
      ctx.bindTexture(ctx.TEXTURE_2D, g.texture.texture);
      ctx.uniform1i(g.screen.u("u_tex"), 0);
      drawMesh(ctx, g.mesh);
    },
  });

  useEffect(() => onModeChange?.(native), [native, onModeChange]);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    aim.current.tx = Math.max(-1, Math.min(1, x));
    aim.current.ty = Math.max(-1, Math.min(1, y));
    if (native) setAnimating(true);
    else if (!reduceMotion) {
      ry.set(aim.current.tx * tilt);
      rx.set(spec.baseTilt - aim.current.ty * tilt * 0.8);
    }
  };
  const onPointerLeave = () => {
    aim.current.tx = 0;
    aim.current.ty = 0;
    if (native) setAnimating(true);
    else {
      ry.set(0);
      rx.set(spec.baseTilt);
    }
  };

  const screen = (
    <div ref={screenRef} className="overflow-hidden bg-background" style={{ width: spec.w, height: spec.h, borderRadius: device === "phone" ? 26 : 4 }}>
      {children}
    </div>
  );

  return (
    <div
      className={cn("relative w-full max-w-2xl overflow-hidden", className)}
      style={{ height: spec.stage }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {native ? (
        <canvas ref={canvasRef} {...canvasProps} className="absolute inset-0 block size-full">
          {screen}
        </canvas>
      ) : (
        <div className="absolute inset-0 grid place-items-center [perspective:1100px]">
          <motion.div style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d", y: device === "laptop" ? -40 : 0 }} className="relative">
            <div className={cn("bg-[#17171a] shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.12)]", device === "phone" ? "rounded-[34px] p-2.5" : "rounded-[14px] p-3.5 pb-5")}>{screen}</div>
            {device === "laptop" ? (
              <div
                aria-hidden="true"
                className="absolute top-full left-1/2 h-[190px] origin-top rounded-[14px] bg-[linear-gradient(#d6d7db,#c2c4c9)]"
                style={{ width: spec.w + spec.bezel * 2 + 36, transform: "translateX(-50%) rotateX(78deg)" }}
              />
            ) : null}
          </motion.div>
        </div>
      )}
    </div>
  );
}
