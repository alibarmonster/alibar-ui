"use client";

import { useEffect, useRef } from "react";

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

export interface GLSLOptions {
  fragmentShader: string;
  speed?: number;
  uniforms?: Record<string, number | [number, number, number]>;
}

/**
 * ponytail: Single shared offscreen WebGL2 renderer multiplexing to N 2D <canvas> elements.
 * Zero WebGL context exhaustion even with 50+ simultaneous shader cards on one page.
 */
class SharedShaderEngine {
  private glCanvas: HTMLCanvasElement | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private vs: WebGLShader | null = null;
  private buffer: WebGLBuffer | null = null;
  private programs = new Map<string, WebGLProgram>();

  private ensureContext(): WebGL2RenderingContext | null {
    if (this.gl && !this.gl.isContextLost()) return this.gl;
    if (typeof document === "undefined") return null;

    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 384;
    const gl = c.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: true,
      powerPreference: "low-power",
    });
    if (!gl) return null;

    const vs = gl.createShader(gl.VERTEX_SHADER);
    if (!vs) return null;
    gl.shaderSource(vs, VERTEX_SHADER);
    gl.compileShader(vs);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    this.glCanvas = c;
    this.gl = gl;
    this.vs = vs;
    this.buffer = buf;
    this.programs.clear();
    return gl;
  }

  public renderToCanvas(
    targetCanvas: HTMLCanvasElement,
    ctx2d: CanvasRenderingContext2D,
    fragmentShader: string,
    time: number,
    mouseX: number,
    mouseY: number,
    uniforms?: Record<string, number | [number, number, number]>
  ) {
    const gl = this.ensureContext();
    if (!gl || !this.glCanvas || !this.vs || !this.buffer) return;

    let program = this.programs.get(fragmentShader);
    if (!program) {
      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      if (!fs) return;
      gl.shaderSource(fs, fragmentShader);
      gl.compileShader(fs);
      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        gl.deleteShader(fs);
        return;
      }
      const prog = gl.createProgram();
      if (!prog) return;
      gl.attachShader(prog, this.vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        gl.deleteProgram(prog);
        return;
      }
      program = prog;
      this.programs.set(fragmentShader, program);
    }

    const w = targetCanvas.width;
    const h = targetCanvas.height;
    if (this.glCanvas.width !== w || this.glCanvas.height !== h) {
      this.glCanvas.width = w;
      this.glCanvas.height = h;
    }

    gl.viewport(0, 0, w, h);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uMouse = gl.getUniformLocation(program, "u_mouse");

    gl.uniform1f(uTime, time);
    gl.uniform2f(uRes, w, h);
    gl.uniform2f(uMouse, mouseX, mouseY);

    if (uniforms) {
      for (const [k, v] of Object.entries(uniforms)) {
        const loc = gl.getUniformLocation(program, k);
        if (!loc) continue;
        if (typeof v === "number") gl.uniform1f(loc, v);
        else gl.uniform3f(loc, v[0], v[1], v[2]);
      }
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    ctx2d.drawImage(this.glCanvas, 0, 0, w, h);
  }
}

let sharedEngine: SharedShaderEngine | null = null;
function getEngine() {
  if (!sharedEngine) sharedEngine = new SharedShaderEngine();
  return sharedEngine;
}

export function useGLSL(options: GLSLOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const uniformsRef = useRef(options.uniforms);
  uniformsRef.current = options.uniforms;
  const speedRef = useRef(options.speed ?? 1);
  speedRef.current = options.speed ?? 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d", { alpha: false });
    if (!ctx2d) return;

    const engine = getEngine();
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

      engine.renderToCanvas(
        canvas,
        ctx2d,
        options.fragmentShader,
        accTime,
        mouseX,
        mouseY,
        uniformsRef.current
      );
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
    };
  }, [options.fragmentShader]);

  return canvasRef;
}
