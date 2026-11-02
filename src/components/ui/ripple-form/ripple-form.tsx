"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";
import { createGrid, createProgram, drawMesh, PROJECT_GLSL, rgb, type Mesh, type Program } from "@/lib/html-canvas/gl";
import { createElementTexture, uploadElementTexture, type ElementTexture } from "@/lib/html-canvas/texture-webgl";
import { syncElementGeometry } from "@/lib/html-canvas/sync-geometry";
import { useHtmlCanvas, type HtmlCanvasMode } from "@/lib/html-canvas/use-html-canvas";

export interface RippleFormValues {
  name: string;
  email: string;
  updates: boolean;
}

export interface RippleFormProps {
  /** Heading above the fields. @default "Join the waitlist" */
  title?: string;
  /** Line under the heading. */
  description?: string;
  /** Submit button label. @default "Request access" */
  submitLabel?: string;
  /** Message shown after a successful submit. @default "You're on the list." */
  successMessage?: string;
  /** Called with the values on submit. Return a promise to show a pending state; reject to show an error. */
  onSubmit?: (values: RippleFormValues) => void | Promise<void>;
  /** Tint of the water's highlights. @default "#2563eb" */
  waterColor?: string;
  /** Ripple strength, 0–2. @default 1 */
  strength?: number;
  /** "auto" uses HTML-in-Canvas when available, "fallback" never does. @default "auto" */
  rendering?: HtmlCanvasMode;
  /** Called when the rendering mode is known. */
  onModeChange?: (native: boolean) => void;
  /** Classes for the root. */
  className?: string;
}

const MAX_RIPPLES = 10;
const RIPPLE_LIFE = 2.6;

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
uniform float u_time;
uniform vec4 u_ripples[${MAX_RIPPLES}];
uniform vec4 u_focus;
uniform vec3 u_tint;
uniform float u_strength;
out vec4 outColor;

void main() {
  vec2 px = v_uv * u_size;
  vec2 disp = vec2(0.0);
  float height = 0.0;
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 r = u_ripples[i];
    float age = u_time - r.z;
    if (r.w <= 0.0 || age < 0.0 || age > ${RIPPLE_LIFE.toFixed(1)}) continue;
    // r.w > 1.5 marks a slow, wide "calm" wave.
    bool calm = r.w > 1.5;
    float speed = calm ? 170.0 : 300.0;
    float width = calm ? 60.0 : 22.0;
    float k = calm ? 0.05 : 0.17;
    vec2 d = px - r.xy;
    float dist = length(d);
    float x = dist - age * speed;
    float env = exp(-x * x / (2.0 * width * width)) * exp(-age * (calm ? 1.1 : 1.8)) * min(r.w, 1.0);
    vec2 dir = dist > 0.001 ? d / dist : vec2(0.0);
    disp += dir * sin(x * k) * env * 7.0;
    height += cos(x * k) * env;
  }
  // Keep the field being typed in crisp: ripples fade out near the focused input.
  if (u_focus.z > 0.0) {
    vec2 c = u_focus.xy + u_focus.zw * 0.5;
    vec2 q = abs(px - c) - u_focus.zw * 0.5;
    float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
    float keep = smoothstep(0.0, 48.0, sd);
    disp *= keep;
    height *= keep;
  }
  disp *= u_strength;
  vec4 color = texture(u_tex, (px + disp) / u_size);
  // Light catches the crests; troughs darken slightly.
  float h = height * u_strength;
  color.rgb += color.a * (u_tint * max(h, 0.0) * 0.10 + vec3(max(h, 0.0) * 0.05) - vec3(max(-h, 0.0) * 0.03));
  outColor = color;
}`;

type Ripple = { x: number; y: number; t: number; amp: number };

/** Caret position inside a text input, in the input's own px. */
function caretOffset(input: HTMLInputElement) {
  const style = getComputedStyle(input);
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return { x: input.clientWidth / 2, y: input.clientHeight / 2 };
  ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const before = input.value.slice(0, input.selectionStart ?? input.value.length);
  const x = Number.parseFloat(style.paddingLeft) + ctx.measureText(input.type === "password" ? "•".repeat(before.length) : before).width - input.scrollLeft;
  return { x: Math.min(input.clientWidth - 4, Math.max(4, x)), y: input.clientHeight / 2 };
}

/**
 * A real sign-up form (labels, inputs, checkbox, submit) rendered through HTML-in-Canvas on a water
 * surface: clicks and keystrokes send ripples from the pointer or the caret, the field being typed in
 * stays crisp, and submitting sends one calm wave. Without the API, or with reduced motion, it is the
 * same form as plain DOM with a ripple on the button.
 */
export function RippleForm({
  title = "Join the waitlist",
  description = "Early access opens in waves. We'll email you when it's your turn.",
  submitLabel = "Request access",
  successMessage = "You're on the list.",
  onSubmit,
  waterColor = "#2563eb",
  strength = 1,
  rendering = "auto",
  onModeChange,
  className,
}: RippleFormProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const formRef = useRef<HTMLFormElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [state, setState] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [animating, setAnimating] = useState(false);
  const ripples = useRef<Ripple[]>([]);
  const clock = useRef({ start: 0 });
  const gl = useRef<{ program: Program; mesh: Mesh; texture: ElementTexture } | null>(null);
  const [buttonRipple, setButtonRipple] = useState<{ x: number; y: number; key: number } | null>(null);

  const now = () => (performance.now() - clock.current.start) / 1000;

  const { native, canvasRef, canvasProps, invalidate } = useHtmlCanvas({
    context: "webgl2",
    mode: rendering,
    animating,
    setup: (ctx) => {
      clock.current.start = performance.now();
      const program = createProgram(ctx, VERT, FRAG);
      gl.current = { program, mesh: createGrid(ctx), texture: createElementTexture(ctx) };
      return () => {
        ctx.deleteProgram(program.program);
        ctx.deleteTexture(gl.current?.texture.texture ?? null);
        gl.current = null;
      };
    },
    render: ({ ctx, canvas, width, height: h, reason }) => {
      const form = formRef.current;
      const g = gl.current;
      if (!form || !g) return;
      if (reason === "paint" || reason === "resize" || reason === "request" || !g.texture.width) {
        uploadElementTexture(ctx, g.texture, form);
        syncElementGeometry(canvas, form, new DOMMatrix());
      }
      const t = now();
      ripples.current = ripples.current.filter((r) => t - r.t < RIPPLE_LIFE);
      const data = new Float32Array(MAX_RIPPLES * 4);
      ripples.current.slice(-MAX_RIPPLES).forEach((r, i) => data.set([r.x, r.y, r.t, r.amp], i * 4));
      const focused = document.activeElement;
      let focus = [0, 0, 0, 0];
      if (focused instanceof HTMLElement && form.contains(focused) && focused.matches("input:not([type=checkbox]), textarea")) {
        const a = focused.getBoundingClientRect();
        const b = canvas.getBoundingClientRect();
        focus = [a.left - b.left, a.top - b.top, a.width, a.height];
      }

      ctx.viewport(0, 0, canvas.width, canvas.height);
      ctx.clearColor(0, 0, 0, 0);
      ctx.clear(ctx.COLOR_BUFFER_BIT);
      ctx.enable(ctx.BLEND);
      ctx.blendFunc(ctx.ONE, ctx.ONE_MINUS_SRC_ALPHA);
      ctx.useProgram(g.program.program);
      const { u } = g.program;
      ctx.uniform2f(u("u_canvas"), width, h);
      ctx.uniform2f(u("u_size"), g.texture.width || width, g.texture.height || h);
      ctx.uniform1f(u("u_time"), t);
      ctx.uniform4fv(u("u_ripples"), data);
      ctx.uniform4f(u("u_focus"), focus[0], focus[1], focus[2], focus[3]);
      ctx.uniform3f(u("u_tint"), ...rgb(waterColor));
      ctx.uniform1f(u("u_strength"), Math.max(0, Math.min(2, strength)));
      ctx.activeTexture(ctx.TEXTURE0);
      ctx.bindTexture(ctx.TEXTURE_2D, g.texture.texture);
      ctx.uniform1i(u("u_tex"), 0);
      drawMesh(ctx, g.mesh);

      if (!ripples.current.length && animating) window.setTimeout(() => setAnimating(false), 0);
    },
  });

  useEffect(() => onModeChange?.(native), [native, onModeChange]);

  // The canvas is as tall as the form inside it.
  useEffect(() => {
    const form = formRef.current;
    if (!native || !form) return;
    const observer = new ResizeObserver(() => setHeight(form.offsetHeight));
    observer.observe(form);
    return () => observer.disconnect();
  }, [native]);

  const ripple = (x: number, y: number, amp = 1) => {
    if (!native) return;
    ripples.current.push({ x, y, t: now(), amp });
    if (ripples.current.length > MAX_RIPPLES) ripples.current.shift();
    setAnimating(true);
    invalidate();
  };

  const local = (clientX: number, clientY: number) => {
    const rect = formRef.current?.parentElement?.getBoundingClientRect();
    return rect ? { x: clientX - rect.left, y: clientY - rect.top } : { x: 0, y: 0 };
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLFormElement>) => {
    const p = local(event.clientX, event.clientY);
    ripple(p.x, p.y);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type === "checkbox" || (event.key.length > 1 && event.key !== "Backspace")) return;
    // Measure after the key lands.
    requestAnimationFrame(() => {
      const box = target.getBoundingClientRect();
      const caret = caretOffset(target);
      const p = local(box.left + caret.x, box.top + caret.y);
      ripple(p.x, p.y, 0.55);
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === "pending") return;
    const data = new FormData(event.currentTarget);
    const values = { name: String(data.get("name") ?? ""), email: String(data.get("email") ?? ""), updates: data.get("updates") === "on" };
    setState("pending");
    setError("");
    try {
      await onSubmit?.(values);
      setState("done");
      const form = formRef.current;
      if (form) ripple(form.offsetWidth / 2, form.offsetHeight / 2, 2);
    } catch (reason) {
      setState("error");
      setError(reason instanceof Error ? reason.message : "Something went wrong. Try again.");
    }
  };

  const onButtonPointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (native || reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setButtonRipple({ x: event.clientX - rect.left, y: event.clientY - rect.top, key: Date.now() });
  };

  const field = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

  const form = (
    <form
      ref={formRef}
      onSubmit={submit}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      aria-labelledby={`${id}-title`}
      className="block w-full rounded-2xl border border-border bg-background p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === "done" ? (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: duration.base, ease: ease.out }}
            className="flex flex-col items-center py-8 text-center"
            role="status"
          >
            <span className="grid size-11 place-items-center rounded-full bg-success/12 text-[color-mix(in_oklab,var(--success)_80%,var(--foreground))]">
              <Check className="size-5" aria-hidden="true" />
            </span>
            <h3 id={`${id}-title`} className="mt-3 text-base font-semibold text-foreground">
              {successMessage}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">Watch your inbox for the next wave.</p>
            <button type="button" onClick={() => setState("idle")} className="mt-4 cursor-pointer rounded-md text-[13px] font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Use another email
            </button>
          </motion.div>
        ) : (
          <motion.div key="fields" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: duration.quick }}>
            <h3 id={`${id}-title`} className="text-base font-semibold text-foreground">
              {title}
            </h3>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
            <div className="mt-5 space-y-3">
              <div>
                <label htmlFor={`${id}-name`} className="mb-1.5 block text-[13px] font-medium text-foreground">
                  Name
                </label>
                <input id={`${id}-name`} name="name" autoComplete="name" placeholder="Ada Lovelace" className={field} />
              </div>
              <div>
                <label htmlFor={`${id}-email`} className="mb-1.5 block text-[13px] font-medium text-foreground">
                  Email
                </label>
                <input id={`${id}-email`} name="email" type="email" required autoComplete="email" placeholder="ada@example.com" className={field} aria-invalid={state === "error" || undefined} aria-describedby={error ? `${id}-error` : undefined} />
              </div>
              <label className="flex cursor-pointer items-center gap-2.5 py-1 text-[13px] text-foreground">
                <input type="checkbox" name="updates" defaultChecked className="size-4 cursor-pointer accent-[var(--primary)]" />
                Send me occasional product updates
              </label>
            </div>
            {error ? (
              <p id={`${id}-error`} role="alert" className="mt-3 text-[13px] text-destructive">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={state === "pending"}
              onPointerDown={onButtonPointer}
              className="relative mt-5 h-10 w-full cursor-pointer overflow-hidden rounded-lg bg-foreground text-sm font-medium text-background outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
            >
              {buttonRipple ? (
                <motion.span
                  key={buttonRipple.key}
                  aria-hidden="true"
                  className="pointer-events-none absolute size-8 rounded-full bg-background/35"
                  style={{ left: buttonRipple.x - 16, top: buttonRipple.y - 16 }}
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 14, opacity: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              ) : null}
              <span className="relative">{state === "pending" ? "Sending…" : submitLabel}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );

  if (!native) {
    return <div className={cn("w-full max-w-sm", className)}>{form}</div>;
  }

  return (
    <div className={cn("relative w-full max-w-sm", className)} style={{ height: height ?? undefined }}>
      <canvas ref={canvasRef} {...canvasProps} className="absolute inset-0 block size-full">
        {form}
      </canvas>
    </div>
  );
}
