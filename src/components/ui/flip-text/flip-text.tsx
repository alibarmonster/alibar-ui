import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface FlipTextProps extends Omit<ComponentProps<"span">, "children"> {
  /** Text to flip, split into letters. */
  children: string;
  /** Milliseconds between letters. @default 24 */
  stagger?: number;
  /** Milliseconds each letter takes to flip. @default 420 */
  duration?: number;
  /** Hold the flipped state, e.g. while a tab is selected. */
  active?: boolean;
  /** Classes for the incoming letters, e.g. a color change. */
  flippedClassName?: string;
}

// The outgoing copy rises out of a clipped cell while the incoming copy rises in from below.
// Flips on hover/focus of the text itself, or of the closest ancestor with Tailwind's `group` class.
const FLIP = cn(
  "transition-transform motion-reduce:transition-none",
  "group-hover/flip:translate-y-[calc(-100%_-_0.4em)] group-focus-visible/flip:translate-y-[calc(-100%_-_0.4em)]",
  "group-data-[active=true]/flip:translate-y-[calc(-100%_-_0.4em)]",
  "group-hover:translate-y-[calc(-100%_-_0.4em)] group-focus-visible:translate-y-[calc(-100%_-_0.4em)]",
);

function graphemes(value: string) {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value), (s) => s.segment);
  }
  return Array.from(value);
}

/** Words become arrays of letters with a running index for the stagger; whitespace stays plain text so lines wrap. */
function split(text: string) {
  const parts: (string | { char: string; index: number }[])[] = [];
  let index = 0;
  for (const token of text.split(/(\s+)/)) {
    if (!token) continue;
    if (/^\s+$/.test(token)) {
      parts.push(token);
      continue;
    }
    const letters = graphemes(token).map((char, i) => ({ char, index: index + i }));
    index += letters.length;
    parts.push(letters);
  }
  return parts;
}

export function FlipText({ children, stagger = 24, duration = 420, active, flippedClassName, className, ...props }: FlipTextProps) {
  const words = split(children);

  const timing = (i: number): CSSProperties => ({
    transitionDuration: `${duration}ms`,
    transitionDelay: `${i * stagger}ms`,
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
  });

  return (
    <span data-active={active || undefined} className={cn("group/flip inline-block", className)} {...props}>
      <span className="sr-only select-none">{children}</span>
      <span aria-hidden="true">
        {words.map((word, w) =>
          typeof word === "string" ? (
            word
          ) : (
            <span key={w} className="inline-block whitespace-nowrap">
              {word.map(({ char, index: i }) => (
                <span key={i} className="relative inline-block [clip-path:inset(-0.25em_-0.15em)]">
                  <span className={cn("inline-block", FLIP)} style={timing(i)}>
                    {char}
                  </span>
                  <span className={cn("absolute top-[calc(100%_+_0.4em)] left-0 block select-none", FLIP, flippedClassName)} style={timing(i)}>
                    {char}
                  </span>
                </span>
              ))}
            </span>
          ),
        )}
      </span>
    </span>
  );
}
