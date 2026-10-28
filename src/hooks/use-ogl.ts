"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle, Vec2 } from "ogl";

const DEFAULT_VERTEX = /* glsl */ `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export interface OGLShaderOptions {
  fragment: string;
  vertex?: string;
  speed?: number;
}

/**
 * ponytail: Single shared OGL Renderer + Triangle Mesh multiplexed onto 2D canvases.
 * Uses real OGL classes (Renderer, Program, Mesh, Triangle, Vec2) with 0 context exhaustion across 20+ OGL cards.
 */
class SharedOGLEngine {
  private renderer: Renderer | null = null;
  private triangle: Triangle | null = null;
  private programs = new Map<string, Program>();
  private mesh: Mesh | null = null;

  private ensureOGL(): Renderer | null {
    if (this.renderer && !this.renderer.gl.isContextLost()) return this.renderer;
    if (typeof document === "undefined") return null;

    const renderer = new Renderer({
      width: 512,
      height: 384,
      dpr: 1,
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: true,
      powerPreference: "low-power",
      webgl: 2,
    });

    const gl = renderer.gl;
    this.triangle = new Triangle(gl);
    this.renderer = renderer;
    this.programs.clear();
    return renderer;
  }

  public renderCard(
    targetCanvas: HTMLCanvasElement,
    ctx2d: CanvasRenderingContext2D,
    fragment: string,
    vertex: string,
    time: number,
    mouseX: number,
    mouseY: number
  ) {
    const renderer = this.ensureOGL();
    if (!renderer || !this.triangle) return;
    const gl = renderer.gl;

    const w = targetCanvas.width;
    const h = targetCanvas.height;
    if (gl.canvas.width !== w || gl.canvas.height !== h) {
      renderer.setSize(w, h);
    }

    const key = `${vertex}::${fragment}`;
    let program = this.programs.get(key);
    if (!program) {
      program = new Program(gl, {
        vertex,
        fragment,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: new Vec2(w, h) },
          uMouse: { value: new Vec2(0.5, 0.5) },
        },
      });
      this.programs.set(key, program);
    }

    program.uniforms.uTime.value = time;
    program.uniforms.uResolution.value.set(w, h);
    program.uniforms.uMouse.value.set(mouseX, mouseY);

    if (!this.mesh) {
      this.mesh = new Mesh(gl, { geometry: this.triangle, program });
    } else {
      this.mesh.program = program;
    }

    renderer.render({ scene: this.mesh });
    ctx2d.drawImage(gl.canvas as HTMLCanvasElement, 0, 0, w, h);
  }
}

let oglEngine: SharedOGLEngine | null = null;
function getOGLEngine() {
  if (!oglEngine) oglEngine = new SharedOGLEngine();
  return oglEngine;
}

export function useOGL(options: OGLShaderOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speedRef = useRef(options.speed ?? 1);
  speedRef.current = options.speed ?? 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d", { alpha: false });
    if (!ctx2d) return;

    const engine = getOGLEngine();
    const vertex = options.vertex ?? DEFAULT_VERTEX;
    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetX = 0.5;
    let targetY = 0.5;
    let isVisible = true;
    let rafId = 0;
    let accTime = 0;
    let lastNow = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    io.observe(canvas);

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetX = (e.clientX - rect.left) / Math.max(1, rect.width);
      targetY = 1.0 - (e.clientY - rect.top) / Math.max(1, rect.height);
    };
    canvas.addEventListener("pointermove", onPointerMove, { passive: true });

    const render = (now: number) => {
      rafId = requestAnimationFrame(render);
      const dt = Math.min(0.1, (now - lastNow) * 0.001);
      lastNow = now;
      if (!isVisible) return;

      accTime += dt * speedRef.current;
      mouseX += (targetX - mouseX) * 0.08;
      mouseY += (targetY - mouseY) * 0.08;

      engine.renderCard(
        canvas,
        ctx2d,
        options.fragment,
        vertex,
        accTime,
        mouseX,
        mouseY
      );
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
    };
  }, [options.fragment, options.vertex]);

  return canvasRef;
}
