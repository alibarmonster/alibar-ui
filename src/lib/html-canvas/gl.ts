/**
 * Small WebGL2 helpers shared by the HTML-in-Canvas components. Shaders work in the canvas's CSS
 * pixels, so a DOMMatrix used to draw an element is the same one passed to `syncElementGeometry`.
 */

/**
 * GLSL: projects a CSS-px position (already multiplied by the draw matrix, so it may carry a
 * perspective w) to clip space. Keeps w for perspective-correct texturing. Needs `uniform vec2 u_canvas`.
 */
export const PROJECT_GLSL = /* glsl */ `
uniform vec2 u_canvas;
vec4 projectCss(vec4 q) {
  return vec4(2.0 * q.x / u_canvas.x - q.w, -(2.0 * q.y / u_canvas.y - q.w), 0.0, q.w);
}`;

/** GLSL: signed distance to a rounded rectangle centered at the origin (half size `b`, radius `r`). */
export const ROUND_RECT_GLSL = /* glsl */ `
float sdRoundRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}`;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create a shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
}

export interface Program {
  program: WebGLProgram;
  /** Cached uniform location lookup. */
  u: (name: string) => WebGLUniformLocation | null;
}

/** Compiles and links a program. Attribute 0 is always `a_pos`. */
export function createProgram(gl: WebGL2RenderingContext, vertex: string, fragment: string): Program {
  const program = gl.createProgram();
  if (!program) throw new Error("Could not create a program");
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment));
  gl.bindAttribLocation(program, 0, "a_pos");
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) throw new Error(`Program link failed: ${gl.getProgramInfoLog(program)}`);
  const cache = new Map<string, WebGLUniformLocation | null>();
  return {
    program,
    u: (name) => {
      if (!cache.has(name)) cache.set(name, gl.getUniformLocation(program, name));
      return cache.get(name) ?? null;
    },
  };
}

export interface Mesh {
  vao: WebGLVertexArrayObject;
  count: number;
}

/** A unit grid over [0, 1]² as indexed triangles, in attribute 0. One cell is a plain quad. */
export function createGrid(gl: WebGL2RenderingContext, cols = 1, rows = 1): Mesh {
  const vao = gl.createVertexArray();
  if (!vao) throw new Error("Could not create a vertex array");
  gl.bindVertexArray(vao);
  const positions: number[] = [];
  for (let y = 0; y <= rows; y++) for (let x = 0; x <= cols; x++) positions.push(x / cols, y / rows);
  const indices: number[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * (cols + 1) + x;
      indices.push(i, i + 1, i + cols + 1, i + 1, i + cols + 2, i + cols + 1);
    }
  }
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  return { vao, count: indices.length };
}

/** Draws a mesh from `createGrid`. */
export function drawMesh(gl: WebGL2RenderingContext, mesh: Mesh, instances = 0) {
  gl.bindVertexArray(mesh.vao);
  if (instances > 0) gl.drawElementsInstanced(gl.TRIANGLES, mesh.count, gl.UNSIGNED_INT, 0, instances);
  else gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_INT, 0);
  gl.bindVertexArray(null);
}

/** Uploads a DOMMatrix to a mat4 uniform. */
export function setMatrix(gl: WebGL2RenderingContext, location: WebGLUniformLocation | null, matrix: DOMMatrix) {
  gl.uniformMatrix4fv(location, false, matrix.toFloat32Array());
}

/** Parses "#rrggbb" into 0–1 RGB. */
export function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = Number.parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16) || 0;
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
