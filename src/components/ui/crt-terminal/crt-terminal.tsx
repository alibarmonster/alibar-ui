"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import { createGrid, createProgram, drawMesh, PROJECT_GLSL, type Mesh, type Program } from "@/lib/html-canvas/gl";
import { createElementTexture, uploadElementTexture, type ElementTexture } from "@/lib/html-canvas/texture-webgl";
import { syncElementGeometry } from "@/lib/html-canvas/sync-geometry";
import { useHtmlCanvas, type HtmlCanvasMode } from "@/lib/html-canvas/use-html-canvas";

export type TerminalCommand = (args: string[]) => string | string[];

export interface CrtTerminalProps {
  /** "crt" glows green on black; "paper" is a light e-ink terminal with grain. @default "crt" */
  variant?: "crt" | "paper";
  /** Prompt before the input. @default "guest@alibar:~$" */
  prompt?: string;
  /** Lines printed after boot. */
  welcome?: string[];
  /** Extra commands by name, added to help, clear, about, theme and echo. */
  commands?: Record<string, TerminalCommand>;
  /** Text for `about`. */
  about?: string;
  /** Height in px. @default 320 */
  height?: number;
  /** Called when `theme` switches the variant. */
  onVariantChange?: (variant: "crt" | "paper") => void;
  /** "auto" uses HTML-in-Canvas when available, "fallback" never does. @default "auto" */
  rendering?: HtmlCanvasMode;
  /** Called when the rendering mode is known. */
  onModeChange?: (native: boolean) => void;
  /** Classes for the root. */
  className?: string;
}

const BOOT = 1.4;

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
uniform float u_paper;
out vec4 outColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  // Barrel curvature: sample further out toward the corners.
  vec2 c = v_uv - 0.5;
  float k = mix(0.045, 0.012, u_paper);
  vec2 uv = 0.5 + c * (1.0 + k * dot(c, c) * 4.0);
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) { outColor = vec4(0.0); return; }

  // Boot: the picture opens from a bright line, flickering, then settles.
  float boot = clamp(u_time / ${BOOT.toFixed(1)}, 0.0, 1.0);
  float open = smoothstep(0.0, 0.45, boot);
  float band = abs(uv.y - 0.5) * 2.0;
  if (u_paper < 0.5 && band > open + 0.02) { outColor = vec4(0.0, 0.0, 0.0, 1.0); return; }

  vec2 px = 1.0 / u_size;
  float ab = mix(1.4, 0.0, u_paper) * (0.4 + length(c));
  vec4 base = texture(u_tex, uv);
  float r = texture(u_tex, uv + vec2(ab, 0.0) * px).r;
  float b = texture(u_tex, uv - vec2(ab, 0.0) * px).b;
  vec3 col = vec3(r, base.g, b);

  if (u_paper < 0.5) {
    // Phosphor glow: a cheap 8-tap halo added on top.
    vec3 glow = vec3(0.0);
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.785398;
      glow += texture(u_tex, uv + vec2(cos(a), sin(a)) * px * 2.6).rgb;
    }
    col += glow / 8.0 * 0.45;
    // Scanlines and a soft vignette.
    float scan = 0.82 + 0.18 * sin(uv.y * u_size.y * 3.14159);
    col *= scan;
    col *= 1.0 - dot(c, c) * 0.9;
    float flicker = boot < 1.0 ? 0.75 + 0.35 * hash(vec2(floor(u_time * 24.0), 1.0)) : 1.0;
    col *= flicker;
    col += vec3(0.9, 1.0, 0.9) * (1.0 - open) * 0.6 * (1.0 - smoothstep(0.0, 0.03, abs(uv.y - 0.5)));
    outColor = vec4(col, 1.0);
  } else {
    // Paper: fine grain and a faint fade toward the edges.
    float grain = (hash(floor(uv * u_size)) - 0.5) * 0.06;
    col += grain;
    col *= 1.0 - dot(c, c) * 0.12;
    outColor = vec4(col * base.a, base.a);
  }
}`;

type Line = { id: number; kind: "out" | "in" | "err"; text: string };

/**
 * A real terminal through HTML-in-Canvas: the scrollback is selectable DOM text and the prompt is a
 * real input, drawn on a curved CRT with scanlines, phosphor glow, chromatic fringing and a flicker on
 * boot (or as a light e-ink terminal with grain). A small mock shell answers help, clear, about,
 * theme and echo. Without the API, it is a monospace terminal with a CSS scanline overlay.
 */
export function CrtTerminal({
  variant: variantProp = "crt",
  prompt = "guest@alibar:~$",
  welcome = ["alibar/ui terminal v0.3.0", "Type 'help' to see what this shell can do."],
  commands = {},
  about = "A live DOM terminal rendered through the experimental HTML-in-Canvas API. Select any line to copy it.",
  height = 320,
  onVariantChange,
  rendering = "auto",
  onModeChange,
  className,
}: CrtTerminalProps) {
  const id = useId();
  const [variant, setVariant] = useState(variantProp);
  const [prevProp, setPrevProp] = useState(variantProp);
  if (prevProp !== variantProp) {
    setPrevProp(variantProp);
    setVariant(variantProp);
  }
  const [lines, setLines] = useState<Line[]>(() => welcome.map((text, i) => ({ id: i, kind: "out", text })));
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const counter = useRef(welcome.length);
  const termRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [booting, setBooting] = useState(true);
  const clock = useRef(0);
  const gl = useRef<{ program: Program; mesh: Mesh; texture: ElementTexture } | null>(null);
  const paper = variant === "paper";

  const { native, canvasRef, canvasProps } = useHtmlCanvas({
    context: "webgl2",
    mode: rendering,
    animating: booting,
    setup: (ctx) => {
      clock.current = performance.now();
      gl.current = { program: createProgram(ctx, VERT, FRAG), mesh: createGrid(ctx), texture: createElementTexture(ctx) };
      return () => {
        if (!gl.current) return;
        ctx.deleteProgram(gl.current.program.program);
        ctx.deleteTexture(gl.current.texture.texture);
        gl.current = null;
      };
    },
    render: ({ ctx, canvas, width, height: h, reason }) => {
      const g = gl.current;
      const term = termRef.current;
      if (!g || !term) return;
      if (reason !== "frame" || !g.texture.width) {
        uploadElementTexture(ctx, g.texture, term);
        syncElementGeometry(canvas, term, new DOMMatrix());
      }
      const t = (performance.now() - clock.current) / 1000;
      if (t > BOOT + 0.1 && booting) window.setTimeout(() => setBooting(false), 0);
      ctx.viewport(0, 0, canvas.width, canvas.height);
      ctx.clearColor(0, 0, 0, 0);
      ctx.clear(ctx.COLOR_BUFFER_BIT);
      ctx.useProgram(g.program.program);
      const { u } = g.program;
      ctx.uniform2f(u("u_canvas"), width, h);
      ctx.uniform2f(u("u_size"), width, h);
      ctx.uniform1f(u("u_time"), t);
      ctx.uniform1f(u("u_paper"), paper ? 1 : 0);
      ctx.activeTexture(ctx.TEXTURE0);
      ctx.bindTexture(ctx.TEXTURE_2D, g.texture.texture);
      ctx.uniform1i(u("u_tex"), 0);
      drawMesh(ctx, g.mesh);
    },
  });

  useEffect(() => onModeChange?.(native), [native, onModeChange]);

  // Keep the newest line in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const print = (kind: Line["kind"], text: string | string[]) =>
    setLines((l) => [...l, ...(Array.isArray(text) ? text : [text]).map((t) => ({ id: counter.current++, kind, text: t }))]);

  const run = (raw: string) => {
    const input = raw.trim();
    print("in", `${prompt} ${raw}`);
    if (!input) return;
    setHistory((h) => [input, ...h].slice(0, 50));
    const [name, ...args] = input.split(/\s+/);
    const builtins: Record<string, TerminalCommand> = {
      help: () => ["Commands:", ...["help", "clear", "about", "theme", "echo", ...Object.keys(commands)].map((c) => `  ${c}`)],
      about: () => about,
      echo: (a) => a.join(" "),
      theme: () => {
        const next = paper ? "crt" : "paper";
        setVariant(next);
        onVariantChange?.(next);
        return `Switched to the ${next === "crt" ? "CRT" : "paper"} theme.`;
      },
    };
    if (name === "clear") {
      setLines([]);
      return;
    }
    const command = commands[name] ?? builtins[name];
    if (!command) {
      print("err", `command not found: ${name}`);
      return;
    }
    print("out", command(args));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    run(value);
    setValue("");
    setCursor(-1);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const next = Math.max(-1, Math.min(history.length - 1, cursor + (event.key === "ArrowUp" ? 1 : -1)));
      setCursor(next);
      setValue(next === -1 ? "" : history[next]);
    } else if (event.key === "l" && event.ctrlKey) {
      event.preventDefault();
      setLines([]);
    }
  };

  const colors = paper
    ? "bg-[#f3f1ea] text-[#26241f] [--term-dim:#6f6a5e] [--term-err:#a3341f] [--term-accent:#26241f] selection:bg-[#26241f] selection:text-[#f3f1ea]"
    : "bg-[#071008] text-[#7dff9a] [--term-dim:#3fae5c] [--term-err:#ff7a6b] [--term-accent:#b8ffc8] selection:bg-[#7dff9a] selection:text-[#071008]";

  const terminal = (
    <div
      ref={termRef}
      role="region"
      aria-label="Terminal"
      onClick={() => {
        if (!window.getSelection()?.toString()) inputRef.current?.focus();
      }}
      className={cn("relative flex w-full flex-col overflow-hidden rounded-2xl p-4 font-mono text-[13px] leading-[1.55]", colors, !native && !paper && "[text-shadow:0_0_6px_rgb(125_255_154/0.45)]")}
      style={{ height }}
    >
      <div ref={scrollRef} role="log" aria-live="polite" aria-label="Output" className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none]">
        {lines.map((line) => (
          <p key={line.id} className={cn("break-words whitespace-pre-wrap", line.kind === "in" && "text-[var(--term-accent)]", line.kind === "err" && "text-[var(--term-err)]")}>
            {line.text}
          </p>
        ))}
      </div>
      <form onSubmit={submit} className="mt-1 flex items-center gap-2">
        <label htmlFor={`${id}-input`} className="shrink-0 text-[var(--term-dim)]">
          {prompt}
        </label>
        <input
          ref={inputRef}
          id={`${id}-input`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Command"
          className="min-w-0 flex-1 bg-transparent caret-current outline-none"
        />
      </form>
      {!native ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background: paper
              ? "radial-gradient(ellipse at center, transparent 60%, rgb(0 0 0 / 0.06))"
              : "repeating-linear-gradient(to bottom, rgb(0 0 0 / 0.22) 0 1px, transparent 1px 3px), radial-gradient(ellipse at center, transparent 55%, rgb(0 0 0 / 0.45))",
          }}
        />
      ) : null}
    </div>
  );

  if (!native) return <div className={cn("w-full max-w-xl", className)}>{terminal}</div>;

  return (
    <div className={cn("relative w-full max-w-xl", className)} style={{ height }}>
      <canvas ref={canvasRef} {...canvasProps} className="absolute inset-0 block size-full rounded-2xl">
        {terminal}
      </canvas>
    </div>
  );
}
