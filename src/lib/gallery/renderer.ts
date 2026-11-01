import { clamp, compose, createMat4, invert, lookAt, multiply, perspective, transform, type Mat4 } from "@/lib/gallery/math";

/**
 * One textured card in world space. Units are CSS pixels: with the default camera, a card at
 * z = 0 that is 200 wide covers 200 CSS pixels on screen. Angles are radians; y points up.
 */
export interface GalleryCard {
  /** Index into the renderer's image list, or -1 for an untextured card. */
  image: number;
  x: number;
  y: number;
  z: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  /** Uniform scale. @default 1 */
  scale?: number;
  /** Turn around the card's own vertical axis, applied before the other rotations (radians). @default 0 */
  flip?: number;
  width: number;
  height: number;
  /** Corner radius in px. @default 12 */
  radius?: number;
  /** 0 keeps `radius`, 1 rounds fully (circle for square cards). @default 0 */
  round?: number;
  /** Fades the card toward the background. @default 1 */
  opacity?: number;
  /** Darkens the card (0–1). @default 0 */
  dim?: number;
  /** 0 = monochrome and low contrast, 1 = full color (develop effect). @default 1 */
  tone?: number;
  /** Soft drop shadow strength (0–1). @default 0 */
  shadow?: number;
  /** Floor reflection strength (0–1); needs `floorY` in the scene. @default 0 */
  reflection?: number;
  /** Accent ring strength (0–1). @default 0 */
  ring?: number;
  /** Paper border in px around the image (print look). @default 0 */
  border?: number;
  /** Shifts the cover crop, -1 to 1 per axis (parallax drift inside the frame). @default 0 */
  panX?: number;
  panY?: number;
  /** Flat color mixed over the card, [r, g, b, amount] in 0–1 (e.g. a card's back). */
  fill?: readonly [number, number, number, number];
  /** Returned by `pick`. @default the card's position in the list */
  id?: number;
}

export interface GalleryScene {
  /** Vertical field of view in degrees. @default 30 */
  fov?: number;
  /** Camera position and target. The default camera sits on +z so that z = 0 maps 1:1 to CSS px. */
  camera?: { x?: number; y?: number; z?: number; targetX?: number; targetY?: number; targetZ?: number };
  /** World y of the reflection floor. */
  floorY?: number;
  /** Distance below the floor over which reflections fade out, px. @default 160 */
  reflectionFade?: number;
  /** Shadow offset (down) and blur in px. @default 14 and 22 */
  shadowOffset?: number;
  shadowBlur?: number;
  /** Shadow opacity at strength 1. @default 0.28 */
  shadowOpacity?: number;
  /** Fades everything toward the left/right and top/bottom edges, as a fraction of the size. */
  edgeFade?: readonly [number, number];
  /** Colors as [r, g, b] in 0–1. */
  placeholder?: readonly [number, number, number];
  paper?: readonly [number, number, number];
  ring?: readonly [number, number, number];
}

export interface PickResult {
  id: number;
  /** Hit point in the card's local space, 0–1 from the bottom-left corner. */
  u: number;
  v: number;
}

const FLOATS = 40;
const KIND_CARD = 0;
const KIND_SHADOW = 1;
const KIND_REFLECTION = 2;

const VERTEX = /* glsl */ `#version 300 es
layout(location = 0) in vec2 a_corner;
layout(location = 1) in mat4 a_model;
layout(location = 5) in vec4 a_size;
layout(location = 6) in vec4 a_look;
layout(location = 7) in vec4 a_extra;
layout(location = 8) in vec4 a_meta;
layout(location = 9) in vec4 a_uv;
layout(location = 10) in vec4 a_fill;
uniform mat4 u_viewProj;
uniform float u_floorY;
uniform float u_shadowOffset;
uniform float u_shadowBlur;
out vec2 v_local;
out vec2 v_uv;
out float v_worldY;
flat out vec4 v_size;
flat out vec4 v_look;
flat out vec4 v_extra;
flat out vec4 v_meta;
flat out vec4 v_uvRect;
flat out vec4 v_fill;
void main() {
  float kind = a_meta.x;
  bool shadow = kind > 0.5 && kind < 1.5;
  // Grow the quad past the card so edges antialias fully and shadows have room to blur.
  float margin = shadow ? u_shadowBlur * 2.0 : 2.0;
  vec2 local = a_corner * (a_size.xy + margin * 2.0);
  vec4 world = a_model * vec4(local, 0.0, 1.0);
  if (shadow) { world.y -= u_shadowOffset; world.z -= 0.5; }
  if (kind > 1.5) world.y = 2.0 * u_floorY - world.y;
  v_worldY = world.y;
  v_local = local;
  v_uv = local / a_size.xy + 0.5;
  v_size = a_size;
  v_look = a_look;
  v_extra = a_extra;
  v_meta = a_meta;
  v_uvRect = a_uv;
  v_fill = a_fill;
  gl_Position = u_viewProj * world;
}`;

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2DArray;
uniform sampler2DArray u_images;
uniform vec2 u_resolution;
uniform vec2 u_edgeFade;
uniform vec3 u_placeholder;
uniform vec3 u_paper;
uniform vec3 u_ring;
uniform float u_floorY;
uniform float u_reflectFade;
uniform float u_shadowBlur;
uniform float u_shadowOpacity;
in vec2 v_local;
in vec2 v_uv;
in float v_worldY;
flat in vec4 v_size;   // width, height, radius, round
flat in vec4 v_look;   // opacity, dim, tone, ring
flat in vec4 v_extra;  // layer, loaded, border, shadow
flat in vec4 v_meta;   // kind, reflection
flat in vec4 v_uvRect; // u0, v0, u1, v1 inside the texture layer
flat in vec4 v_fill;   // r, g, b, amount
out vec4 fragColor;

float roundRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 halfSize = v_size.xy * 0.5;
  float maxRadius = min(halfSize.x, halfSize.y);
  float radius = mix(min(v_size.z, maxRadius), maxRadius, v_size.w);
  float d = roundRect(v_local, halfSize, radius);
  float kind = v_meta.x;

  vec2 screen = gl_FragCoord.xy / u_resolution;
  float fade = 1.0;
  if (u_edgeFade.x > 0.0) fade *= smoothstep(0.0, u_edgeFade.x, screen.x) * smoothstep(0.0, u_edgeFade.x, 1.0 - screen.x);
  if (u_edgeFade.y > 0.0) fade *= smoothstep(0.0, u_edgeFade.y, screen.y) * smoothstep(0.0, u_edgeFade.y, 1.0 - screen.y);

  if (kind > 0.5 && kind < 1.5) {
    float blur = max(u_shadowBlur, 1.0);
    float a = 1.0 - smoothstep(-blur, blur, d);
    a *= a * v_extra.w * u_shadowOpacity * v_look.x * fade;
    fragColor = vec4(0.0, 0.0, 0.0, a);
    return;
  }

  float aa = max(fwidth(d), 1e-3);
  float coverage = 1.0 - smoothstep(-aa * 0.5, aa * 0.5, d);
  if (coverage <= 0.0) discard;

  float border = v_extra.z;
  vec2 inner = max(halfSize - border, vec2(1.0));
  bool paper = border > 0.0 && (abs(v_local.x) > inner.x || abs(v_local.y) > inner.y);
  vec3 color = u_placeholder;
  float texAlpha = 1.0;
  if (v_extra.x >= 0.0 && !paper) {
    vec2 uv = border > 0.0 ? v_local / (inner * 2.0) + 0.5 : v_uv;
    // Layers are premultiplied; transparent images (overlays, cut-outs) keep their alpha.
    vec4 texel = texture(u_images, vec3(mix(v_uvRect.xy, v_uvRect.zw, uv), v_extra.x));
    vec3 tex = texel.a > 0.001 ? texel.rgb / texel.a : vec3(0.0);
    color = mix(u_placeholder, tex, v_extra.y);
    texAlpha = mix(1.0, texel.a, v_extra.y);
  }
  if (paper) color = u_paper;

  float tone = v_look.z;
  if (tone < 1.0 && !paper) {
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    if (border > 0.0) {
      // A print develops out of its paper: blank, then faint monochrome, then full color.
      vec3 mono = mix(u_paper, vec3(gray), smoothstep(0.0, 0.6, tone));
      color = mix(mono, color, smoothstep(0.45, 1.0, tone));
    } else {
      color = mix(vec3(mix(0.55, gray, 0.5)), color, tone);
    }
  }
  color = mix(color, v_fill.rgb, v_fill.a);
  color *= 1.0 - v_look.y;
  if (v_look.w > 0.0) color = mix(color, u_ring, smoothstep(-2.0 - aa, -2.0, d) * v_look.w);

  float alpha = coverage * v_look.x * fade * texAlpha;
  if (kind > 1.5) {
    float below = u_floorY - v_worldY;
    alpha *= below < 0.0 ? 0.0 : v_meta.y * (1.0 - smoothstep(0.0, u_reflectFade, below));
  }
  fragColor = vec4(color * alpha, alpha);
}`;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  if (process.env.NODE_ENV !== "production") console.error(`GalleryRenderer: shader failed to compile\n${gl.getShaderInfoLog(shader)}`);
  gl.deleteShader(shader);
  return null;
}

function createProgram(gl: WebGL2RenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = vertex && fragment ? gl.createProgram() : null;
  if (program && vertex && fragment) {
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
  }
  if (vertex) gl.deleteShader(vertex);
  if (fragment) gl.deleteShader(fragment);
  if (program && gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  if (program) gl.deleteProgram(program);
  return null;
}

interface TextureEntry {
  src: string;
  state: "loading" | "decoded" | "ready" | "error";
  image: HTMLImageElement | null;
  layer: number;
  aspect: number;
  /** Content rect inside the layer (images are fitted, not cropped): u0, v0, u1, v1. */
  content: [number, number, number, number];
  loadedAt: number;
  lastUsed: number;
}

/**
 * WebGL2 renderer for textured cards. Every card, its soft shadow and its floor reflection go
 * into one instanced draw over a texture array, sorted back to front for correct blending.
 * Images load once (crossOrigin "anonymous"), are fitted into fixed-size mipmapped layers and
 * recycled least-recently-used when there are more images than layers.
 */
export class GalleryRenderer {
  readonly gl: WebGL2RenderingContext;
  readonly software: boolean;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private quad: WebGLBuffer;
  private instances: WebGLBuffer;
  private texture: WebGLTexture;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private data = new Float32Array(FLOATS * 64);
  private capacity = 64;
  private entries = new Map<string, TextureEntry>();
  private freeLayers: number[] = [];
  private scratch: HTMLCanvasElement;
  private mipsDirty = false;
  private frame = 0;
  private images: string[] = [];
  private view = createMat4();
  private projection = createMat4();
  private viewProj = createMat4();
  private inverseViewProj = createMat4();
  private picks: { id: number; model: Mat4; width: number; height: number }[] = [];
  private models: Mat4[] = [];
  private cssWidth = 1;
  private cssHeight = 1;
  /** Called when an image finishes loading, so the owner can draw a new frame. */
  onImageLoad: () => void = () => {};

  private constructor(
    gl: WebGL2RenderingContext,
    readonly textureSize: number,
    readonly layers: number,
    software: boolean,
  ) {
    this.gl = gl;
    this.software = software;
    const program = createProgram(gl);
    const vao = gl.createVertexArray();
    const quad = gl.createBuffer();
    const instances = gl.createBuffer();
    const texture = gl.createTexture();
    if (!program || !vao || !quad || !instances || !texture) throw new Error("GalleryRenderer: WebGL setup failed");
    this.program = program;
    this.vao = vao;
    this.quad = quad;
    this.instances = instances;
    this.texture = texture;
    this.scratch = document.createElement("canvas");
    this.scratch.width = this.scratch.height = textureSize;
    this.setup();
  }

  /** Creates a renderer on `canvas`, or returns null when WebGL2 or the shaders are unavailable. */
  static create(canvas: HTMLCanvasElement, { textureSize = 512, layers = 32 }: { textureSize?: number; layers?: number } = {}) {
    const gl = canvas.getContext("webgl2", { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true });
    if (!gl) return null;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
    const software = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
    const maxLayers = gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS) as number;
    try {
      return new GalleryRenderer(gl, textureSize, clamp(layers, 1, maxLayers), software);
    } catch {
      return null;
    }
  }

  private setup() {
    const { gl } = this;
    for (const name of ["u_viewProj", "u_floorY", "u_shadowOffset", "u_shadowBlur", "u_shadowOpacity", "u_images", "u_resolution", "u_edgeFade", "u_placeholder", "u_paper", "u_ring", "u_reflectFade"]) {
      this.uniforms[name] = gl.getUniformLocation(this.program, name);
    }
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instances);
    gl.bufferData(gl.ARRAY_BUFFER, this.data.byteLength, gl.DYNAMIC_DRAW);
    const stride = FLOATS * 4;
    // mat4 model (locations 1–4), then six vec4s (5–10).
    for (let i = 0; i < 10; i++) {
      const location = i + 1;
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, 4, gl.FLOAT, false, stride, i * 16);
      gl.vertexAttribDivisor(location, 1);
    }
    gl.bindVertexArray(null);

    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.texture);
    const levels = Math.floor(Math.log2(this.textureSize)) + 1;
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, levels, gl.RGBA8, this.textureSize, this.textureSize, this.layers);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const anisotropic = gl.getExtension("EXT_texture_filter_anisotropic");
    if (anisotropic) gl.texParameterf(gl.TEXTURE_2D_ARRAY, anisotropic.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(4, gl.getParameter(anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number));
    this.freeLayers = Array.from({ length: this.layers }, (_, i) => i);
    this.entries.forEach((entry) => {
      entry.layer = -1;
      if (entry.state === "ready") entry.state = "decoded";
    });
  }

  /** Rebuilds GPU resources after a lost WebGL context is restored. Images re-upload from memory. */
  restore() {
    const { gl } = this;
    const vao = gl.createVertexArray();
    const quad = gl.createBuffer();
    const instances = gl.createBuffer();
    const texture = gl.createTexture();
    if (!vao || !quad || !instances || !texture) return false;
    this.vao = vao;
    this.quad = quad;
    this.instances = instances;
    this.texture = texture;
    const program = createProgram(gl);
    if (!program) return false;
    this.program = program;
    this.capacity = this.data.length / FLOATS;
    this.setup();
    return true;
  }

  /** Image URLs that cards refer to by index. Unchanged URLs keep their textures. */
  setImages(images: string[]) {
    this.images = images;
  }

  resize(cssWidth: number, cssHeight: number, dpr: number) {
    const canvas = this.gl.canvas as HTMLCanvasElement;
    const width = Math.max(1, Math.round(cssWidth * dpr));
    const height = Math.max(1, Math.round(cssHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    this.cssWidth = Math.max(1, cssWidth);
    this.cssHeight = Math.max(1, cssHeight);
  }

  private request(index: number) {
    const src = this.images[index];
    if (!src) return null;
    let entry = this.entries.get(src);
    if (!entry) {
      const created: TextureEntry = { src, state: "loading", image: null, layer: -1, aspect: 1, content: [0, 0, 1, 1], loadedAt: 0, lastUsed: 0 };
      entry = created;
      this.entries.set(src, created);
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.decoding = "async";
      image.src = src;
      image.decode().then(
        () => {
          created.image = image;
          created.aspect = image.naturalWidth / Math.max(1, image.naturalHeight);
          created.state = "decoded";
          this.onImageLoad();
        },
        () => {
          created.state = "error";
        },
      );
    }
    entry.lastUsed = this.frame;
    return entry;
  }

  private upload(entry: TextureEntry) {
    if (!entry.image) return;
    let layer = this.freeLayers.pop();
    if (layer === undefined) {
      // Recycle the least recently used layer that no card showed this frame.
      let oldest: TextureEntry | null = null;
      this.entries.forEach((candidate) => {
        if (candidate.layer >= 0 && candidate.lastUsed < this.frame && (!oldest || candidate.lastUsed < oldest.lastUsed)) oldest = candidate;
      });
      const victim = oldest as TextureEntry | null;
      if (!victim) return;
      layer = victim.layer;
      victim.layer = -1;
      victim.state = "decoded";
    }
    const size = this.textureSize;
    const ctx = this.scratch.getContext("2d");
    if (!ctx) return;
    const { naturalWidth: w, naturalHeight: h } = entry.image;
    const fit = Math.min(size / w, size / h);
    const dw = w * fit;
    const dh = h * fit;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(entry.image, (size - dw) / 2, (size - dh) / 2, dw, dh);
    const { gl } = this;
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, layer, size, size, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.scratch);
    const u = dw / size / 2;
    const v = dh / size / 2;
    entry.content = [0.5 - u, 0.5 - v, 0.5 + u, 0.5 + v];
    entry.layer = layer;
    entry.state = "ready";
    if (!entry.loadedAt) entry.loadedAt = performance.now();
    this.mipsDirty = true;
  }

  /** Cover-fits a card onto its image's content rect, optionally panned. */
  private coverUv(entry: TextureEntry, width: number, height: number, panX: number, panY: number, out: Float32Array, offset: number) {
    const cardAspect = width / Math.max(1, height);
    let uSpan = 1;
    let vSpan = 1;
    if (cardAspect > entry.aspect) vSpan = entry.aspect / cardAspect;
    else uSpan = cardAspect / entry.aspect;
    const uc = 0.5 + (clamp(panX, -1, 1) * (1 - uSpan)) / 2;
    const vc = 0.5 + (clamp(panY, -1, 1) * (1 - vSpan)) / 2;
    const [u0, v0, u1, v1] = entry.content;
    out[offset] = u0 + (uc - uSpan / 2) * (u1 - u0);
    out[offset + 1] = v0 + (vc - vSpan / 2) * (v1 - v0);
    out[offset + 2] = u0 + (uc + uSpan / 2) * (u1 - u0);
    out[offset + 3] = v0 + (vc + vSpan / 2) * (v1 - v0);
  }

  private updateCamera(scene: GalleryScene) {
    const fov = ((scene.fov ?? 30) * Math.PI) / 180;
    const distance = this.cssHeight / 2 / Math.tan(fov / 2);
    const c = scene.camera ?? {};
    const eye = [c.x ?? 0, c.y ?? 0, distance + (c.z ?? 0)];
    lookAt(this.view, eye, [c.targetX ?? 0, c.targetY ?? 0, c.targetZ ?? 0]);
    perspective(this.projection, fov, this.cssWidth / this.cssHeight, Math.max(1, distance * 0.02), distance * 20);
    multiply(this.viewProj, this.projection, this.view);
    invert(this.inverseViewProj, this.viewProj);
  }

  /** Draws one frame. Returns true while any image is still fading in. */
  render(cards: readonly GalleryCard[], scene: GalleryScene = {}) {
    const { gl } = this;
    this.frame++;
    this.updateCamera(scene);
    const now = performance.now();
    let fading = false;

    // Resolve textures and upload anything that finished decoding.
    const textures: (TextureEntry | null)[] = cards.map((card) => (card.image >= 0 ? this.request(card.image) : null));
    for (const entry of textures) if (entry && entry.state === "decoded") this.upload(entry);
    if (this.mipsDirty) {
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.texture);
      gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
      this.mipsDirty = false;
    }

    // Back-to-front order by view-space depth.
    while (this.models.length < cards.length) this.models.push(createMat4());
    const order = cards.map((card, i) => {
      compose(this.models[i], card.x, card.y, card.z, card.rotateX ?? 0, card.rotateY ?? 0, card.rotateZ ?? 0, card.scale ?? 1, card.flip ?? 0);
      const depth = this.view[2] * card.x + this.view[6] * card.y + this.view[10] * card.z + this.view[14];
      return { i, depth };
    });
    order.sort((a, b) => a.depth - b.depth);

    const reflections = scene.floorY !== undefined ? order.filter(({ i }) => (cards[i].reflection ?? 0) > 0) : [];
    const needed = reflections.length + order.length * 2;
    if (needed > this.capacity) {
      this.capacity = Math.max(needed, this.capacity * 2);
      this.data = new Float32Array(this.capacity * FLOATS);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instances);
      gl.bufferData(gl.ARRAY_BUFFER, this.data.byteLength, gl.DYNAMIC_DRAW);
    }

    let count = 0;
    const write = (i: number, kind: number) => {
      const card = cards[i];
      const entry = textures[i];
      const o = count * FLOATS;
      const d = this.data;
      d.set(this.models[i], o);
      d[o + 16] = card.width;
      d[o + 17] = card.height;
      d[o + 18] = card.radius ?? 12;
      d[o + 19] = card.round ?? 0;
      d[o + 20] = card.opacity ?? 1;
      d[o + 21] = card.dim ?? 0;
      d[o + 22] = card.tone ?? 1;
      d[o + 23] = card.ring ?? 0;
      const ready = entry !== null && entry.state === "ready" && entry.layer >= 0;
      const loaded = ready ? clamp((now - entry.loadedAt) / 320, 0, 1) : 0;
      if (ready && loaded < 1) fading = true;
      d[o + 24] = ready ? entry.layer : -1;
      d[o + 25] = loaded;
      d[o + 26] = card.border ?? 0;
      d[o + 27] = card.shadow ?? 0;
      d[o + 28] = kind;
      d[o + 29] = card.reflection ?? 0;
      d[o + 30] = 0;
      d[o + 31] = 0;
      if (ready) this.coverUv(entry, card.width - (card.border ?? 0) * 2, card.height - (card.border ?? 0) * 2, card.panX ?? 0, card.panY ?? 0, d, o + 32);
      else d.fill(0, o + 32, o + 36);
      const fill = card.fill;
      d[o + 36] = fill ? fill[0] : 0;
      d[o + 37] = fill ? fill[1] : 0;
      d[o + 38] = fill ? fill[2] : 0;
      d[o + 39] = fill ? fill[3] : 0;
      count++;
    };
    for (const { i } of reflections) write(i, KIND_REFLECTION);
    this.picks.length = 0;
    for (const { i } of order) {
      const card = cards[i];
      if ((card.shadow ?? 0) > 0 && (card.opacity ?? 1) > 0) write(i, KIND_SHADOW);
      write(i, KIND_CARD);
      this.picks.push({ id: card.id ?? i, model: this.models[i], width: card.width, height: card.height });
    }

    const canvas = gl.canvas as HTMLCanvasElement;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (count) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(this.program);
      const u = this.uniforms;
      gl.uniformMatrix4fv(u.u_viewProj, false, this.viewProj);
      gl.uniform1f(u.u_floorY, scene.floorY ?? -1e6);
      gl.uniform1f(u.u_reflectFade, scene.reflectionFade ?? 160);
      gl.uniform1f(u.u_shadowOffset, scene.shadowOffset ?? 14);
      gl.uniform1f(u.u_shadowBlur, scene.shadowBlur ?? 22);
      gl.uniform1f(u.u_shadowOpacity, scene.shadowOpacity ?? 0.28);
      gl.uniform2f(u.u_resolution, canvas.width, canvas.height);
      gl.uniform2f(u.u_edgeFade, scene.edgeFade?.[0] ?? 0, scene.edgeFade?.[1] ?? 0);
      gl.uniform3fv(u.u_placeholder, scene.placeholder ?? [0.94, 0.94, 0.95]);
      gl.uniform3fv(u.u_paper, scene.paper ?? [0.98, 0.97, 0.95]);
      gl.uniform3fv(u.u_ring, scene.ring ?? [0.145, 0.388, 0.922]);
      gl.uniform1i(u.u_images, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.texture);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instances);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data, 0, count * FLOATS);
      gl.bindVertexArray(this.vao);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);
      gl.bindVertexArray(null);
    }
    return fading;
  }

  /** The front-most card under a point in CSS px (relative to the canvas), or null. */
  pick(x: number, y: number): PickResult | null {
    const nx = (x / this.cssWidth) * 2 - 1;
    const ny = 1 - (y / this.cssHeight) * 2;
    const near = transform(this.inverseViewProj, nx, ny, -1);
    const far = transform(this.inverseViewProj, nx, ny, 1);
    const origin = [near[0] / near[3], near[1] / near[3], near[2] / near[3]];
    const end = [far[0] / far[3], far[1] / far[3], far[2] / far[3]];
    const inverse = createMat4();
    for (let k = this.picks.length - 1; k >= 0; k--) {
      const { id, model, width, height } = this.picks[k];
      if (!invert(inverse, model)) continue;
      const o = transform(inverse, origin[0], origin[1], origin[2]);
      const e = transform(inverse, end[0], end[1], end[2]);
      const dz = e[2] - o[2];
      if (Math.abs(dz) < 1e-9) continue;
      const t = -o[2] / dz;
      if (t < 0 || t > 1) continue;
      const px = o[0] + (e[0] - o[0]) * t;
      const py = o[1] + (e[1] - o[1]) * t;
      if (Math.abs(px) <= width / 2 && Math.abs(py) <= height / 2) return { id, u: px / width + 0.5, v: py / height + 0.5 };
    }
    return null;
  }

  /** World point → CSS px relative to the canvas (for positioning DOM overlays). */
  project(x: number, y: number, z: number) {
    const [cx, cy, , cw] = transform(this.viewProj, x, y, z);
    return { x: ((cx / cw) * 0.5 + 0.5) * this.cssWidth, y: (0.5 - (cy / cw) * 0.5) * this.cssHeight, visible: cw > 0 };
  }

  /** True once the image at `index` is on the GPU. */
  isLoaded(index: number) {
    const src = this.images[index];
    return src ? this.entries.get(src)?.state === "ready" : false;
  }

  destroy() {
    const { gl } = this;
    gl.deleteBuffer(this.quad);
    gl.deleteBuffer(this.instances);
    gl.deleteVertexArray(this.vao);
    gl.deleteTexture(this.texture);
    gl.deleteProgram(this.program);
    this.entries.clear();
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
