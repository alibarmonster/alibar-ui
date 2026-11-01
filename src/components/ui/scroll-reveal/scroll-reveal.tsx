"use client";

import { Children, useRef, type ComponentProps, type ReactNode, type RefObject } from "react";
import { motion, useReducedMotion, useScroll, useSpring, type Variants } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface ScrollRevealProps
  extends Omit<ComponentProps<"section">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Blocks to reveal; each direct child blurs in on its own as it enters view. */
  children: ReactNode;
  /** Show a reading-progress bar pinned to the top of the section. @default true */
  progress?: boolean;
  /** Scrollable element that contains the section, if it isn't the page. Give it position: relative so offsets measure correctly. */
  container?: RefObject<HTMLElement | null>;
  /** Reveal each block only the first time. @default true */
  once?: boolean;
  /** Fraction of a block that must be visible to reveal it. @default 0.35 */
  amount?: number;
  /** Starting blur in px. @default 8 */
  blur?: number;
}

export function ScrollReveal({
  children,
  progress = true,
  container,
  once = true,
  amount = 0.35,
  blur = 8,
  className,
  ...props
}: ScrollRevealProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  // 0 when the section's top reaches the top of the viewport, 1 when its bottom reaches the bottom.
  const { scrollYProgress } = useScroll({ target: ref, container, offset: ["start start", "end end"] });
  const scaleX = useSpring(scrollYProgress, { stiffness: 300, damping: 40, restDelta: 0.001 });

  const variants: Variants = {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, filter: `blur(${blur}px)` },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: reduceMotion ? duration.base : duration.slow + 0.2, ease: ease.out },
      transitionEnd: { filter: "none" },
    },
  };

  return (
    <section ref={ref} className={cn("relative", className)} {...props}>
      {progress ? (
        <motion.div
          aria-hidden="true"
          className="sticky top-0 z-10 h-0.5 origin-left rounded-full bg-primary"
          style={{ scaleX: reduceMotion ? scrollYProgress : scaleX }}
        />
      ) : null}
      {Children.toArray(children).map((child, i) => (
        <motion.div key={i} variants={variants} initial="hidden" whileInView="visible" viewport={{ root: container, once, amount }}>
          {child}
        </motion.div>
      ))}
    </section>
  );
}
