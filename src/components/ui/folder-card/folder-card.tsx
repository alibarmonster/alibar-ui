"use client";

import { useState, type ComponentProps, type FocusEvent, type PointerEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface FolderCardProps
  extends Omit<ComponentProps<"a">, "children" | "title" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Folder name. */
  title: string;
  /** Secondary line, e.g. "12 files". */
  meta?: string;
  /** Up to three previews that rise out of the folder. Defaults to blank pages. */
  items?: ReactNode[];
  /** Folder color. @default "var(--primary)" */
  color?: string;
  /** Destination; without it the card renders as a button. */
  href?: string;
  /** Hold the folder open (it also opens on hover and keyboard focus). */
  open?: boolean;
}

const SPRING = { type: "spring", stiffness: 260, damping: 22 } as const;

function BlankPage() {
  return (
    <div className="flex size-full flex-col gap-1.5 p-3">
      <span className="h-1.5 w-1/2 rounded-full bg-muted-foreground/25" />
      <span className="h-1 w-5/6 rounded-full bg-muted-foreground/15" />
      <span className="h-1 w-4/6 rounded-full bg-muted-foreground/15" />
      <span className="h-1 w-3/4 rounded-full bg-muted-foreground/15" />
    </div>
  );
}

export function FolderCard({ title, meta, items, color = "var(--primary)", href, open, className, onPointerEnter, onPointerLeave, onFocus, onBlur, ...props }: FolderCardProps) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const isOpen = open ?? (hovered || focused);
  const pages = (items?.length ? items : [<BlankPage key="a" />, <BlankPage key="b" />, <BlankPage key="c" />]).slice(0, 3);

  const handlers = {
    onPointerEnter: (event: PointerEvent<HTMLAnchorElement>) => {
      onPointerEnter?.(event);
      if (event.pointerType === "mouse") setHovered(true);
    },
    onPointerLeave: (event: PointerEvent<HTMLAnchorElement>) => {
      onPointerLeave?.(event);
      setHovered(false);
    },
    onFocus: (event: FocusEvent<HTMLAnchorElement>) => {
      onFocus?.(event);
      setFocused(event.currentTarget.matches(":focus-visible"));
    },
    onBlur: (event: FocusEvent<HTMLAnchorElement>) => {
      onBlur?.(event);
      setFocused(false);
    },
  };

  const Tag = (href ? "a" : "button") as "a";
  const body = (
    <>
      <span className="relative block aspect-[5/4] [perspective:800px]" aria-hidden="true">
        {/* Back panel with its tab. */}
        <span className="absolute inset-x-0 top-[9%] bottom-0 rounded-xl" style={{ background: `color-mix(in oklab, ${color} 78%, black)` }} />
        <span className="absolute top-0 left-0 h-[16%] w-[42%] rounded-t-lg" style={{ background: `color-mix(in oklab, ${color} 78%, black)` }} />
        {/* Pages rise and fan out of the folder. */}
        {pages.map((page, i) => {
          const offset = i - (pages.length - 1) / 2;
          return (
            <motion.span
              key={i}
              className="absolute inset-x-[11%] top-[16%] bottom-[14%] block overflow-hidden rounded-md border border-black/5 bg-white shadow-sm"
              initial={false}
              animate={
                isOpen
                  ? reduceMotion
                    ? { y: "-14%" }
                    : { y: `${-26 - (pages.length - 1 - i) * 7}%`, x: `${offset * 16}%`, rotate: offset * 7 }
                  : { y: `${-(pages.length - 1 - i) * 3}%`, x: "0%", rotate: 0 }
              }
              transition={{ ...SPRING, delay: isOpen ? i * 0.03 : 0 }}
            >
              {page}
            </motion.span>
          );
        })}
        {/* Front panel tips forward around its bottom edge. */}
        <motion.span
          className="absolute inset-x-0 bottom-0 h-[74%] origin-bottom rounded-xl shadow-[0_-1px_0_rgb(255_255_255/0.35)_inset,0_8px_20px_-8px_rgb(0_0_0/0.35)]"
          style={{ background: `linear-gradient(to bottom, color-mix(in oklab, ${color} 88%, white), ${color})` }}
          initial={false}
          animate={isOpen ? (reduceMotion ? { y: "4%" } : { rotateX: -34, y: "2%" }) : { rotateX: 0, y: "0%" }}
          transition={SPRING}
        />
      </span>
      <span className="mt-3 block">
        <span className="block truncate text-sm font-medium text-foreground">{title}</span>
        {meta ? <span className="block text-xs text-muted-foreground">{meta}</span> : null}
      </span>
    </>
  );

  return (
    <Tag
      href={href}
      {...(href ? {} : { type: "button" })}
      className={cn(
        "block w-full cursor-pointer rounded-xl p-2 text-left outline-none transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...handlers}
      {...props}
    >
      {body}
    </Tag>
  );
}
