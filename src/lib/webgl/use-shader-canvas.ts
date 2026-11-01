import { useEffect, useRef, useState } from "react";

export type UniformValue = number | boolean | readonly number[] | Float32Array;

/**
 * - `idle`: not started yet (always the value on the server and the first client render)
 * - `running`: animating
 * - `static`: a single frame is on screen (reduced motion, paused, offscreen or tab hidden)
 * - `fallback`: WebGL2 is unavailable, the shader failed to compile or the context was lost
 */
export type ShaderStatus = "idle" | "running" | "static" | "fallback";

export interface UseShaderCanvasOptions {
  /**
   * Fragment shader source. Unless it starts with `#version`, the hook prepends a header with
   * `precision highp float`, the built-in uniforms `u_time` (seconds), `u_resolution` (pixels),
   * `u_mouse` (0–1, y up) and `u_pointer` (0–1, eases to 1 while the pointer is inside),
   * `in vec2 v_uv` and `out vec4 fragColor`. Output premultiplied alpha.
   */
  fragmentShader: string;
  /** Custom uniforms by name. Read every frame, so updating them never restarts the shader. */
  uniforms?: Record<string, UniformValue>;
  /** Clock multiplier. @default 1 */
  speed?: number;
  /** Freezes the clock and keeps the current frame on screen. @default false */
  paused?: boolean;
  /** Fraction of the display resolution to render at, clamped to 0.5–1. @default 1 */
  renderScale?: number;
  /** Highest device pixel ratio used. @default 1.5 */
  maxDpr?: number;
  /** Track the pointer over the container into `u_mouse` and `u_pointer`. @default false */
  pointer?: boolean;
  /** Clock value, in seconds, of the single frame drawn under reduced motion. @default 6 */
  staticTime?: number;
}

const VERTEX_SHADER = /* glsl */ `#version 300 es
out vec2 v_uv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  v_uv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAGMENT_HEADER = /* glsl */ `#version 300 es
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_pointer;
in vec2 v_uv;
out vec4 fragColor;
`;

interface UniformSlot {
  location: WebGLUniformLocation;
  type: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  if (process.env.NODE_ENV !== "production") console.error(`useShaderCanvas: shader failed to compile\n${gl.getShaderInfoLog(shader)}`);
  gl.deleteShader(shader);
  return null;
}

function link(gl: WebGL2RenderingContext, fragmentSource: string) {
  const source = fragmentSource.trimStart().startsWith("#version") ? fragmentSource.trimStart() : FRAGMENT_HEADER + fragmentSource;
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, source);
  const program = vertex && fragment ? gl.createProgram() : null;
  if (program && vertex && fragment) {
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.detachShader(program, vertex);
    gl.detachShader(program, fragment);
  }
  if (vertex) gl.deleteShader(vertex);
  if (fragment) gl.deleteShader(fragment);
  if (!program) return null;
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  if (process.env.NODE_ENV !== "production") console.error(`useShaderCanvas: program failed to link\n${gl.getProgramInfoLog(program)}`);
  gl.deleteProgram(program);
  return null;
}

function collectUniforms(gl: WebGL2RenderingContext, program: WebGLProgram) {
  const slots = new Map<string, UniformSlot>();
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    const location = info && gl.getUniformLocation(program, info.name);
    if (info && location) slots.set(info.name.replace(/\[0\]$/, ""), { location, type: info.type });
  }
  return slots;
}

function setUniform(gl: WebGL2RenderingContext, { location, type }: UniformSlot, value: UniformValue) {
  const isInt = type === gl.INT || type === gl.BOOL;
  if (typeof value === "boolean" || typeof value === "number") {
    const n = Number(value);
    if (isInt) gl.uniform1i(location, n);
    else gl.uniform1f(location, n);
    return;
  }
  const list = value as number[] | Float32Array;
  if (isInt) gl.uniform1iv(location, Int32Array.from(list));
  else if (type === gl.FLOAT_VEC2) gl.uniform2fv(location, list);
  else if (type === gl.FLOAT_VEC3) gl.uniform3fv(location, list);
  else if (type === gl.FLOAT_VEC4) gl.uniform4fv(location, list);
  else gl.uniform1fv(location, list);
}

/**
 * Renders a fragment shader with WebGL2 on a canvas the hook creates inside the element you
 * attach `ref` to (give that element a size and `position: relative`, `absolute` or `fixed`).
 *
 * One fullscreen triangle, no three.js. The canvas follows the element's size, caps the pixel
 * ratio, pauses offscreen and in hidden tabs, draws a single static frame under reduced motion,
 * recovers from context loss and releases the GPU context on unmount. When `status` is
 * `fallback` (or before the first frame), whatever you render behind the canvas shows through.
 */
export function useShaderCanvas<T extends HTMLElement = HTMLDivElement>(options: UseShaderCanvasOptions) {
  const ref = useRef<T>(null);
  const [status, setStatus] = useState<ShaderStatus>("idle");
  const latest = useRef(options);
  const wake = useRef<() => void>(() => {});

  // Keep the render loop reading fresh props, and let it react to paused/uniform changes.
  useEffect(() => {
    latest.current = options;
    wake.current();
  });

  const { fragmentShader } = options;

  useEffect(() => {
    const host = ref.current;
    if (!host) return;

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
      pointerEvents: "none",
      opacity: "0",
      transition: "opacity 500ms ease-out",
    });
    host.appendChild(canvas);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mouse = [0.5, 0.5];
    const mouseTarget = [0.5, 0.5];
    let gl: WebGL2RenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let uniforms = new Map<string, UniformSlot>();
    let reported: ShaderStatus = "idle";
    let raf = 0;
    let lastFrame = 0;
    let clock = 0;
    let pointer = 0;
    let pointerTarget = 0;
    let inView = false;
    let pageVisible = document.visibilityState === "visible";
    let needsResize = true;
    let drawn = false;
    let lost = false;

    const report = (next: ShaderStatus) => {
      if (next === reported) return;
      reported = next;
      setStatus(next);
    };

    const build = () => {
      gl ??= canvas.getContext("webgl2", {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: true,
        powerPreference: "low-power",
      });
      program = gl ? link(gl, fragmentShader) : null;
      uniforms = gl && program ? collectUniforms(gl, program) : new Map();
      needsResize = true;
      return program !== null;
    };

    const resize = () => {
      if (!gl) return;
      const { renderScale = 1, maxDpr = 1.5 } = latest.current;
      const scale = Math.min(window.devicePixelRatio || 1, maxDpr) * clamp(renderScale, 0.5, 1);
      const width = Math.max(1, Math.round(host.clientWidth * scale));
      const height = Math.max(1, Math.round(host.clientHeight * scale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      needsResize = false;
    };

    const draw = (time: number) => {
      if (!gl || !program || lost) return;
      if (needsResize) resize();
      gl.useProgram(program);
      const set = (name: string, value: UniformValue) => {
        const slot = uniforms.get(name);
        if (slot && gl) setUniform(gl, slot, value);
      };
      set("u_time", time);
      set("u_resolution", [canvas.width, canvas.height]);
      set("u_mouse", mouse);
      set("u_pointer", pointer);
      const custom = latest.current.uniforms;
      if (custom) for (const name in custom) set(name, custom[name]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!drawn) {
        drawn = true;
        canvas.style.opacity = "1";
      }
    };

    const shouldRun = () =>
      !lost && program !== null && inView && pageVisible && !latest.current.paused && !reducedMotion.matches;

    const frame = (now: number) => {
      raf = 0;
      if (!shouldRun()) return settle();
      const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 0;
      lastFrame = now;
      clock += dt * (latest.current.speed ?? 1);
      const ease = 1 - Math.exp(-dt * 6);
      mouse[0] += (mouseTarget[0] - mouse[0]) * ease;
      mouse[1] += (mouseTarget[1] - mouse[1]) * ease;
      pointer += (pointerTarget - pointer) * ease;
      draw(clock);
      report("running");
      raf = requestAnimationFrame(frame);
    };

    // Not animating: keep one up-to-date frame on screen.
    const settle = () => {
      lastFrame = 0;
      if (lost || !program) return;
      draw(reducedMotion.matches ? (latest.current.staticTime ?? 6) : clock);
      report("static");
    };

    const update = () => {
      if (shouldRun()) {
        if (!raf) raf = requestAnimationFrame(frame);
        return;
      }
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      settle();
    };

    const intersection = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        update();
      },
      { rootMargin: "120px" },
    );
    const resizeObserver = new ResizeObserver(() => {
      needsResize = true;
      if (!raf) settle();
    });
    const onVisibility = () => {
      pageVisible = document.visibilityState === "visible";
      update();
    };
    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = 1 - (event.clientY - rect.top) / rect.height;
      const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
      if (inside) {
        mouseTarget[0] = x;
        mouseTarget[1] = y;
      }
      pointerTarget = inside ? 1 : 0;
    };
    const onPointerLeave = () => {
      pointerTarget = 0;
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      report("fallback");
    };
    const onContextRestored = () => {
      lost = false;
      if (build()) update();
      else report("fallback");
    };
    const trackPointer = latest.current.pointer === true;

    // Start on the next frame: keeps setup out of the effect body and off the hydration task.
    const start = requestAnimationFrame(() => {
      if (!build()) return report("fallback");
      canvas.addEventListener("webglcontextlost", onContextLost);
      canvas.addEventListener("webglcontextrestored", onContextRestored);
      document.addEventListener("visibilitychange", onVisibility);
      reducedMotion.addEventListener("change", update);
      if (trackPointer) {
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onPointerLeave);
      }
      intersection.observe(host);
      resizeObserver.observe(host);
      wake.current = update;
    });

    return () => {
      cancelAnimationFrame(start);
      if (raf) cancelAnimationFrame(raf);
      wake.current = () => {};
      intersection.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      document.removeEventListener("visibilitychange", onVisibility);
      reducedMotion.removeEventListener("change", update);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      if (gl) {
        if (program) gl.deleteProgram(program);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
      canvas.remove();
    };
  }, [fragmentShader]);

  return { ref, status };
}
