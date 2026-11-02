"use client";

import { useRef, useState } from "react";
import { drawElement2D } from "@/lib/html-canvas/draw-2d";
import { createGrid, createProgram, drawMesh, PROJECT_GLSL, setMatrix, type Mesh, type Program } from "@/lib/html-canvas/gl";
import { createElementTexture, uploadElementTexture, type ElementTexture } from "@/lib/html-canvas/texture-webgl";
import { perspective, syncElementGeometry } from "@/lib/html-canvas/sync-geometry";
import { useHtmlCanvas } from "@/lib/html-canvas/use-html-canvas";

function MiniForm({ label }: { label: string }) {
  const [value, setValue] = useState("");
  const [clicks, setClicks] = useState(0);
  return (
    <form className="w-64 rounded-xl border border-border bg-background p-3 text-[13px]" onSubmit={(e) => e.preventDefault()}>
      <label className="block font-medium text-foreground">
        {label}
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Type here" className="mt-1 h-8 w-full rounded-md border border-border px-2 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </label>
      <button type="button" onClick={() => setClicks((c) => c + 1)} className="mt-2 h-8 w-full cursor-pointer rounded-md bg-foreground text-background">
        Clicked {clicks} {clicks === 1 ? "time" : "times"}
      </button>
    </form>
  );
}

/** 2D: drawElement2D under a rotation; the adapter keeps hit-testing in sync. */
export function TwoDCheck() {
  const formRef = useRef<HTMLDivElement>(null);
  const { native, canvasRef, canvasProps } = useHtmlCanvas({
    context: "2d",
    render: ({ ctx, dpr, width, height }) => {
      const el = formRef.current;
      if (!el) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-0.06);
      drawElement2D(ctx, el, -el.offsetWidth / 2, -el.offsetHeight / 2);
    },
  });
  if (!native) return <p className="text-[13px] text-muted-foreground">2D drawing isn&apos;t available here, so this check is skipped.</p>;
  return (
    <canvas ref={canvasRef} {...canvasProps} className="block h-44 w-full">
      <div ref={formRef} className="w-max">
        <MiniForm label="2D: drawElementImage" />
      </div>
    </canvas>
  );
}

const VERT = `#version 300 es
in vec2 a_pos;
uniform vec2 u_size;
uniform mat4 u_matrix;
out vec2 v_uv;
${PROJECT_GLSL}
void main() { v_uv = a_pos; gl_Position = projectCss(u_matrix * vec4(a_pos * u_size, 0.0, 1.0)); }`;
const FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_tex;
out vec4 o;
void main() { o = texture(u_tex, v_uv); }`;

/** WebGL: an element texture on a perspective-tilted quad, with clicks synced through the same matrix. */
export function WebGLCheck() {
  const formRef = useRef<HTMLDivElement>(null);
  const gl = useRef<{ program: Program; mesh: Mesh; texture: ElementTexture } | null>(null);
  const [synced, setSynced] = useState(false);
  const { native, canvasRef, canvasProps } = useHtmlCanvas({
    context: "webgl2",
    setup: (ctx) => {
      gl.current = { program: createProgram(ctx, VERT, FRAG), mesh: createGrid(ctx), texture: createElementTexture(ctx) };
    },
    render: ({ ctx, canvas, width, height }) => {
      const g = gl.current;
      const el = formRef.current;
      if (!g || !el) return;
      uploadElementTexture(ctx, g.texture, el);
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const m = new DOMMatrix().translate(width / 2, height / 2).multiply(perspective(700)).rotate(12, -24, 0).translate(-w / 2, -h / 2);
      syncElementGeometry(canvas, el, m);
      ctx.viewport(0, 0, canvas.width, canvas.height);
      ctx.clearColor(0, 0, 0, 0);
      ctx.clear(ctx.COLOR_BUFFER_BIT);
      ctx.useProgram(g.program.program);
      ctx.uniform2f(g.program.u("u_canvas"), width, height);
      ctx.uniform2f(g.program.u("u_size"), w, h);
      setMatrix(ctx, g.program.u("u_matrix"), m);
      ctx.activeTexture(ctx.TEXTURE0);
      ctx.bindTexture(ctx.TEXTURE_2D, g.texture.texture);
      ctx.uniform1i(g.program.u("u_tex"), 0);
      drawMesh(ctx, g.mesh);
      if (!synced) window.setTimeout(() => setSynced(true), 0);
    },
  });
  if (!native) return <p className="text-[13px] text-muted-foreground">WebGL element textures aren&apos;t available here, so this check is skipped.</p>;
  return (
    <canvas ref={canvasRef} {...canvasProps} className="block h-52 w-full" data-synced={synced}>
      <div ref={formRef} className="w-max">
        <MiniForm label="WebGL: tilted quad" />
      </div>
    </canvas>
  );
}
