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
 * ponytail: raw WebGL2 fullscreen-quad runner instead of Three.js Canvas per card.
 * Prevents browser 16-context limit & saves ~150KB gzipped. Upgrade to shared WebGLRenderer scissor-test only if >12 simultaneous 3D meshes are needed.
 */
export function useGLSL(options: GLSLOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const uniformsRef = useRef(options.uniforms);
  uniformsRef.current = options.uniforms;
  const speedRef = useRef(options.speed ?? 1);
  speedRef.current = options.speed ?? 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl.FRAGMENT_SHADER, options.fragmentShader);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uMouse = gl.getUniformLocation(program, "u_mouse");

    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetX = 0.5;
    let targetY = 0.5;
    let isVisible = true;
    let rafId = 0;
    let accTime = 0;
    let lastNow = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
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

      gl.uniform1f(uTime, accTime);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouseX, mouseY);

      const custom = uniformsRef.current;
      if (custom) {
        for (const [k, v] of Object.entries(custom)) {
          const loc = gl.getUniformLocation(program, k);
          if (!loc) continue;
          if (typeof v === "number") gl.uniform1f(loc, v);
          else gl.uniform3f(loc, v[0], v[1], v[2]);
        }
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      gl.deleteBuffer(buffer);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteProgram(program);
    };
  }, [options.fragmentShader]);

  return canvasRef;
}
