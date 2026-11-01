"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode, type RefObject } from "react";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface MarqueeLogo {
  name: string;
  logo: ReactNode;
  href?: string;
}

export interface DualLogoMarqueeProps extends Omit<ComponentProps<"section">, "children"> {
  /** Logos for the first row (scrolls left). */
  items: MarqueeLogo[];
  /** Logos for the second row (scrolls right). @default items, reversed */
  secondRow?: MarqueeLogo[];
  /** Scroll speed in pixels per second. @default 32 */
  speed?: number;
  /** Ease both rows to a stop while hovered or focused. @default true */
  pauseOnHover?: boolean;
  /** Small line above the rows. */
  eyebrow?: string;
}

function Row({ items, direction, speed, paused }: { items: MarqueeLogo[]; direction: 1 | -1; speed: number; paused: RefObject<boolean> }) {
  const reduceMotion = useReducedMotion() ?? false;
  const x = useMotionValue(0);
  const track = useRef<HTMLUListElement>(null);
  const [width, setWidth] = useState(0);
  const velocity = useRef(1);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(el.offsetWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (reduceMotion || width === 0) return;
    const target = paused.current ? 0 : 1;
    velocity.current += (target - velocity.current) * Math.min(1, delta / 200);
    if (Math.abs(target - velocity.current) < 0.005) velocity.current = target;
    if (velocity.current === 0) return;
    let next = x.get() + direction * speed * velocity.current * (delta / 1000);
    if (next <= -width) next += width;
    if (next > 0) next -= width;
    x.set(next);
  });

  const list = (copy: boolean) => (
    <ul
      ref={copy ? undefined : track}
      aria-hidden={copy || undefined}
      inert={copy}
      className={cn("flex shrink-0 items-center motion-reduce:w-full motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center", copy && "motion-reduce:hidden")}
    >
      {items.map((item) => (
        <li key={item.name} className="flex h-16 shrink-0 items-center px-7 text-[20px] text-foreground/75 motion-reduce:h-14">
          {item.href ? (
            <a
              href={item.href}
              className="rounded-md outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
            >
              <span className="sr-only">{item.name}</span>
              <span aria-hidden="true">{item.logo}</span>
            </a>
          ) : (
            <span role="img" aria-label={item.name}>
              <span aria-hidden="true">{item.logo}</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] motion-reduce:[mask-image:none]">
      <motion.div className="flex w-max motion-reduce:w-full" style={{ x }}>
        {list(false)}
        {list(true)}
      </motion.div>
    </div>
  );
}

export function DualLogoMarquee({ items, secondRow, speed = 32, pauseOnHover = true, eyebrow, className, ...props }: DualLogoMarqueeProps) {
  const paused = useRef(false);
  const second = secondRow ?? [...items].reverse();
  const pause = (value: boolean) => {
    if (pauseOnHover) paused.current = value;
  };

  return (
    <section
      onPointerEnter={() => pause(true)}
      onPointerLeave={() => pause(false)}
      onFocus={() => pause(true)}
      onBlur={() => pause(false)}
      className={cn("w-full py-10", className)}
      {...props}
    >
      {eyebrow ? <p className="mb-6 px-4 text-center text-sm text-muted-foreground">{eyebrow}</p> : null}
      <div className="space-y-2">
        <Row items={items} direction={-1} speed={speed} paused={paused} />
        <Row items={second} direction={1} speed={speed * 0.85} paused={paused} />
      </div>
    </section>
  );
}
