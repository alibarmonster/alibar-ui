"use client";

import { useEffect, useRef, useState, type ComponentProps, type RefObject } from "react";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from "motion/react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Testimonial {
  quote: string;
  name: string;
  /** Role and company, e.g. "Head of Design, Lumivo". */
  title: string;
  /** Avatar image URL. Without one, initials on a generated gradient are shown. */
  avatarUrl?: string;
  /** Star rating out of 5. */
  rating?: number;
}

export interface TestimonialWallProps extends Omit<ComponentProps<"section">, "children"> {
  /** Testimonials, dealt round-robin into columns. */
  testimonials: Testimonial[];
  /** Height of the scrolling area in pixels. @default 520 */
  height?: number;
  /** Base scroll speed in pixels per second; each column runs a little faster or slower. @default 22 */
  speed?: number;
  /** Ease all columns to a stop while hovered or focused. @default true */
  pauseOnHover?: boolean;
}

const SPEEDS = [1, 1.3, 0.85];

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function hue(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

function Card({ t }: { t: Testimonial }) {
  return (
    <figure className="rounded-2xl border border-border bg-background p-4 shadow-xs">
      {t.rating ? (
        <div className="mb-2 flex gap-0.5" role="img" aria-label={`${t.rating} out of 5 stars`}>
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className={cn("size-3.5", i < t.rating! ? "fill-amber-400 text-amber-400" : "text-border")} aria-hidden="true" />
          ))}
        </div>
      ) : null}
      <blockquote className="text-[14px] leading-6 text-foreground">{t.quote}</blockquote>
      <figcaption className="mt-3 flex items-center gap-2.5">
        {t.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- consumers pass arbitrary avatar URLs
          <img src={t.avatarUrl} alt="" className="size-8 rounded-full object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-full text-[11px] font-semibold text-white"
            style={{ background: `linear-gradient(135deg, hsl(${hue(t.name)} 70% 62%), hsl(${(hue(t.name) + 50) % 360} 70% 48%))` }}
          >
            {initials(t.name)}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium text-foreground">{t.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{t.title}</span>
        </span>
      </figcaption>
    </figure>
  );
}

function Column({ items, speed, paused, className }: { items: Testimonial[]; speed: number; paused: RefObject<boolean>; className?: string }) {
  const reduceMotion = useReducedMotion() ?? false;
  const y = useMotionValue(0);
  const track = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const velocity = useRef(1);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (reduceMotion || height === 0) return;
    const target = paused.current ? 0 : 1;
    velocity.current += (target - velocity.current) * Math.min(1, delta / 220);
    if (Math.abs(target - velocity.current) < 0.005) velocity.current = target;
    if (velocity.current === 0) return;
    let next = y.get() - speed * velocity.current * (delta / 1000);
    if (next <= -height) next += height;
    y.set(next);
  });

  return (
    <motion.div className={cn("flex flex-col", className)} style={{ y }}>
      <div ref={track} className="flex flex-col gap-3 pb-3">
        {items.map((t) => (
          <Card key={t.name + t.quote.slice(0, 12)} t={t} />
        ))}
      </div>
      <div className="flex flex-col gap-3 pb-3 motion-reduce:hidden" aria-hidden="true" inert>
        {items.map((t) => (
          <Card key={t.name + t.quote.slice(0, 12)} t={t} />
        ))}
      </div>
    </motion.div>
  );
}

export function TestimonialWall({ testimonials, height = 520, speed = 22, pauseOnHover = true, className, ...props }: TestimonialWallProps) {
  const paused = useRef(false);
  const columns = [0, 1, 2].map((c) => testimonials.filter((_, i) => i % 3 === c));
  const pause = (value: boolean) => {
    if (pauseOnHover) paused.current = value;
  };

  return (
    <section
      aria-label="Testimonials"
      onPointerEnter={() => pause(true)}
      onPointerLeave={() => pause(false)}
      onFocus={() => pause(true)}
      onBlur={() => pause(false)}
      className={cn(
        "@container w-full overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)] motion-reduce:overflow-y-auto",
        className,
      )}
      style={{ height }}
      {...props}
    >
      <div className="grid grid-cols-1 gap-3 px-1 @[34rem]:grid-cols-2 @[52rem]:grid-cols-3">
        {columns.map((items, index) => (
          <Column
            key={index}
            items={items}
            speed={speed * SPEEDS[index]}
            paused={paused}
            className={cn(index === 1 && "hidden @[34rem]:flex", index === 2 && "hidden @[52rem]:flex")}
          />
        ))}
      </div>
    </section>
  );
}
