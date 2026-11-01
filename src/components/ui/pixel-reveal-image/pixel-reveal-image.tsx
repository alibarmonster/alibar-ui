"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { animate, useMotionValue } from "motion/react";
import { cn } from "@/lib/utils";
import { useShaderCanvas } from "@/lib/webgl/use-shader-canvas";

export interface PixelRevealImageProps extends Omit<ComponentProps<"div">, "children"> {
  /** Image URL. Use a same-origin or CORS-enabled image so WebGL can read it. */
  src: string;
  /** Alternative text, as for any <img>. */
  alt: string;
  /** What starts the reveal. "inView" plays once when scrolled into view; "hover" sharpens on hover and pixelates again on leave. @default "inView" */
  trigger?: "inView" | "hover";
  /** Pixel size at the start, in canvas pixels. @default 36 */
  cellSize?: number;
  /** Reveal duration in seconds. @default 1.2 */
  duration?: number;
}

const FRAGMENT = /* glsl */ `
uniform sampler2D u_tex;
uniform float u_cell;
uniform float u_ready;
uniform float u_img_aspect;
void main() {
  if (u_ready < 0.5) { fragColor = vec4(0.0); return; }
  vec2 coord = gl_FragCoord.xy;
  if (u_cell > 1.0) coord = (floor(coord / u_cell) + 0.5) * u_cell;
  vec2 uv = coord / u_resolution;
  // object-fit: cover
  float canvasAspect = u_resolution.x / u_resolution.y;
  vec2 scale = canvasAspect > u_img_aspect ? vec2(1.0, u_img_aspect / canvasAspect) : vec2(canvasAspect / u_img_aspect, 1.0);
  fragColor = texture(u_tex, (uv - 0.5) * scale + 0.5);
}`;

export function PixelRevealImage({ src, alt, trigger = "inView", cellSize = 36, duration = 1.2, className, ...props }: PixelRevealImageProps) {
  const root = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [aspect, setAspect] = useState(1);
  const [ready, setReady] = useState(false);
  const [animating, setAnimating] = useState(false);
  const progress = useMotionValue(0);
  // A stable uniforms object that the animation writes into; the shader reads it every frame.
  const uniforms = useRef({ u_tex: null as HTMLImageElement | null, u_cell: cellSize, u_ready: 0, u_img_aspect: 1 });
  const inView = useRef(false);
  const loaded = useRef(false);

  const { ref } = useShaderCanvas<HTMLDivElement>({
    fragmentShader: FRAGMENT,
    paused: !animating,
    uniforms: () => uniforms.current as unknown as Record<string, number | HTMLImageElement>,
  });

  useEffect(() => {
    uniforms.current.u_tex = image;
    uniforms.current.u_ready = ready && image ? 1 : 0;
    uniforms.current.u_img_aspect = aspect;
  });

  useEffect(() => {
    return progress.on("change", (p) => {
      // Ease the cell size down to one pixel; sharpen fully at the end.
      uniforms.current.u_cell = p >= 0.999 ? 1 : Math.max(1, Math.round(cellSize * (1 - p) * (1 - p)));
    });
  }, [progress, cellSize]);

  const play = (to: 0 | 1) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      progress.set(1);
      setAnimating(true);
      requestAnimationFrame(() => setAnimating(false));
      return;
    }
    setAnimating(true);
    // Linear time with a squared cell curve: big blocks resolve quickly, fine detail sharpens last.
    animate(progress, to, { duration: to === 1 ? duration : duration * 0.6, ease: "linear", onComplete: () => setAnimating(false) });
  };

  // "inView": play once the image is both loaded and at least 40% visible, whichever happens last.
  useEffect(() => {
    const el = root.current;
    if (trigger !== "inView" || !el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        inView.current = true;
        observer.disconnect();
        if (loaded.current) play(1);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- play only touches motion values and state setters
  }, [trigger]);

  // Images can finish loading before hydration (cached or data URLs), so check on mount too.
  const handleLoad = (img: HTMLImageElement) => {
    if (loaded.current) return;
    loaded.current = true;
    setAspect(img.naturalWidth / Math.max(1, img.naturalHeight));
    setReady(true);
    if (trigger === "inView" && inView.current) play(1);
  };

  const attach = (node: HTMLImageElement | null) => {
    setImage(node);
    if (node?.complete && node.naturalWidth > 0) queueMicrotask(() => handleLoad(node));
  };

  return (
    <div
      ref={root}
      onPointerEnter={() => trigger === "hover" && ready && play(1)}
      onPointerLeave={() => trigger === "hover" && ready && play(0)}
      className={cn("relative isolate aspect-[4/3] overflow-hidden rounded-xl bg-muted", className)}
      {...props}
    >
      {/* The real image: accessible, and the fallback when WebGL isn't available. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- the element doubles as the WebGL texture source */}
      <img
        ref={attach}
        src={src}
        alt={alt}
        crossOrigin="anonymous"
        onLoad={(event) => handleLoad(event.currentTarget)}
        className="absolute inset-0 -z-20 size-full object-cover"
      />
      {/* No fade-in here: the pixelated first frame must cover the sharp <img> right away. */}
      <div ref={ref} aria-hidden="true" className="absolute inset-0 -z-10 [&>canvas]:!opacity-100 [&>canvas]:!transition-none" />
    </div>
  );
}
