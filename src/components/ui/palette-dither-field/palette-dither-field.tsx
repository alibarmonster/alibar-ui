"use client";

import { useEffect, useImperativeHandle, useRef, useState, type ComponentProps, type ReactNode, type Ref } from "react";
import { cn } from "@/lib/utils";
import { hexToVec3 } from "@/lib/color";
import { paletteGradient, resolvePalette, type GlyphPaletteInput } from "@/lib/glyph/palettes";
import { GLSL_BAYER, GLSL_NOISE } from "@/lib/webgl/noise.glsl";
import { useShaderCanvas } from "@/lib/webgl/use-shader-canvas";

export interface PaletteDitherFieldHandle {
  /** Crossfades to another palette (preset name or 2–8 hex colors) in about 400ms, without restarting the waves. */
  setPalette: (next: GlyphPaletteInput) => void;
}

export interface PaletteDitherFieldProps extends Omit<ComponentProps<"div">, "children" | "ref"> {
  /** Content rendered above the field. */
  children?: ReactNode;
  /** A preset (midnight, peach, ember, moss, lilac, mono, accent) or 2–8 hex colors from dark to light. Changing it crossfades. @default "midnight" */
  palette?: GlyphPaletteInput;
  /** Size of one dither pixel in CSS pixels, 2–12. @default 4 */
  pixelSize?: number;
  /** Wave speed multiplier. @default 1 */
  speed?: number;
  /** Wave frequency multiplier: below 1 for broad swells, above 1 for tight ripples. @default 1 */
  scale?: number;
  /** Number of layered waves, 3–5. @default 4 */
  layers?: number;
  /** Direction the waves travel, in degrees (0 = right, 90 = up). @default 20 */
  direction?: number;
  /** The pointer adds a local ripple to the field. @default true */
  interactive?: boolean;
  /** Freeze on the current frame. @default false */
  paused?: boolean;
  /** Imperative handle with `setPalette()`. */
  ref?: Ref<PaletteDitherFieldHandle>;
}

const MAX = 8;

const FRAGMENT = /* glsl */ `${GLSL_NOISE}${GLSL_BAYER}
uniform float u_pixel;
uniform float u_scale;
uniform float u_layers;
uniform vec2 u_dir;
uniform float u_interactive;
uniform vec3 u_next[${MAX}];
uniform float u_nextCount;
uniform vec3 u_prev[${MAX}];
uniform float u_prevCount;
uniform float u_fadeStart;
uniform float u_fadeLength;

float field(vec2 p, float t) {
  float v = 0.0;
  float total = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    if (fi >= u_layers) break;
    // Each layer leans a little off the main direction, with its own frequency and pace.
    float a = (fi - 1.5) * 0.32;
    vec2 d = vec2(u_dir.x * cos(a) - u_dir.y * sin(a), u_dir.x * sin(a) + u_dir.y * cos(a));
    float f = (1.7 + fi * 1.2) * u_scale;
    float w = 1.0 / (1.0 + fi * 0.6);
    v += w * sin(dot(p, d) * f - t * (0.8 + fi * 0.27) + fi * 1.9 + snoise(p * 0.6 + fi * 3.1 + t * 0.05) * 0.55);
    total += w;
  }
  v /= total;
  v += fbm(p * 1.2 + t * 0.06, 3) * 0.22;
  return clamp(v * 0.5 + 0.5, 0.0, 1.0);
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy / u_pixel);
  vec2 uv = (cell + 0.5) * u_pixel / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float v = field(p * 2.0, u_time);
  vec2 m = vec2(u_mouse.x * aspect, u_mouse.y);
  float d = distance(p, m);
  v += u_pointer * u_interactive * exp(-d * 6.0) * sin(d * 42.0 - u_time * 6.0) * 0.3;
  v = clamp(v, 0.0, 1.0);

  // Crossfade by dithering too: more pixels take the new palette as the fade advances.
  float progress = clamp((u_time - u_fadeStart) / max(u_fadeLength, 0.001), 0.0, 1.0);
  bool useNext = bayer8(cell.yx + vec2(5.0, 3.0)) < progress;
  float count = useNext ? u_nextCount : u_prevCount;

  // Quantize to the palette's steps, then dither between the two nearest.
  float x = v * (count - 1.0);
  float idx = min(floor(x) + step(bayer8(cell), fract(x)), count - 1.0);
  vec3 color = vec3(0.0);
  for (int k = 0; k < ${MAX}; k++) {
    if (float(k) == idx) color = useNext ? u_next[k] : u_prev[k];
  }
  fragColor = vec4(color, 1.0);
}`;

function pack(colors: readonly string[]) {
  const out = new Float32Array(MAX * 3);
  colors.slice(0, MAX).forEach((c, i) => out.set(hexToVec3(c), i * 3));
  return out;
}

/**
 * A full-bleed field of layered sine and noise waves, ordered-dithered (8×8 Bayer) to a palette of
 * 2–8 colors: the height is quantized to the palette's steps and dithered between the two nearest.
 * The pointer adds a local ripple. `ref.setPalette()` (or a new `palette` prop) crossfades palettes
 * with a dither of its own, without restarting the waves. Falls back to a CSS gradient of the
 * palette without WebGL; pauses offscreen and holds a still frame under reduced motion.
 */
export function PaletteDitherField({
  children,
  palette = "midnight",
  pixelSize = 4,
  speed = 1,
  scale = 1,
  layers = 4,
  direction = 20,
  interactive = true,
  paused = false,
  ref,
  className,
  style,
  ...props
}: PaletteDitherFieldProps) {
  const colors = resolvePalette(palette, "midnight");
  const key = colors.join(",");
  // The palette set imperatively shows in the CSS fallback until the prop changes again.
  const [override, setOverride] = useState<{ key: string; colors: string[] } | null>(null);
  const [seenKey, setSeenKey] = useState(key);
  if (seenKey !== key) {
    setSeenKey(key);
    setOverride(null);
  }
  const shown = override?.colors ?? colors;
  const fade = useRef({ prev: pack(colors), prevCount: colors.length, next: pack(colors), nextCount: colors.length, start: -1e6 });
  const status = useRef("idle");

  const angle = (direction * Math.PI) / 180;
  const dir = [Math.cos(angle), Math.sin(angle)];
  const { ref: hostRef, status: shaderStatus, time } = useShaderCanvas<HTMLDivElement>({
    fragmentShader: FRAGMENT,
    // One canvas pixel per CSS pixel keeps the dither grid crisp and pixelSize exact.
    maxDpr: 1,
    speed,
    paused,
    pointer: interactive,
    uniforms: () => {
      const f = fade.current;
      return {
        u_pixel: Math.min(12, Math.max(2, Math.round(pixelSize))),
        u_scale: Math.max(0.2, scale),
        u_layers: Math.min(5, Math.max(3, Math.round(layers))),
        u_dir: dir,
        u_interactive: interactive ? 1 : 0,
        u_next: f.next,
        u_nextCount: f.nextCount,
        u_prev: f.prev,
        u_prevCount: f.prevCount,
        u_fadeStart: f.start,
        // The shader clock runs at `speed`, so scale the fade to stay about 400ms.
        u_fadeLength: 0.4 * Math.max(0.05, speed),
      };
    },
  });

  useEffect(() => {
    status.current = shaderStatus;
  }, [shaderStatus]);

  /** Starts a crossfade from whatever is on screen now. Instant when the field isn't animating. */
  const fadeTo = (next: string[]) => {
    const f = fade.current;
    const now = time.current;
    const progress = Math.min(1, Math.max(0, (now - f.start) / (0.4 * Math.max(0.05, speed))));
    if (progress >= 0.5) {
      f.prev = f.next;
      f.prevCount = f.nextCount;
    }
    f.next = pack(next);
    f.nextCount = next.length;
    f.start = status.current === "running" ? now : -1e6;
  };

  // A new `palette` prop crossfades like setPalette.
  const lastKey = useRef(key);
  useEffect(() => {
    if (lastKey.current === key) return;
    lastKey.current = key;
    fadeTo(key.split(","));
  });

  useImperativeHandle(ref, () => ({
    setPalette: (input) => {
      const next = resolvePalette(input, "midnight");
      fadeTo(next);
      // Also refreshes the CSS fallback and wakes a paused or still field to redraw.
      setOverride({ key, colors: next });
    },
  }));

  return (
    <div
      className={cn("relative isolate min-h-96 overflow-hidden", className)}
      style={{ background: paletteGradient(shown, "to top"), ...style }}
      {...props}
    >
      <div ref={hostRef} aria-hidden="true" className="absolute inset-0 -z-10 [&>canvas]:[image-rendering:pixelated]" />
      {children}
    </div>
  );
}
