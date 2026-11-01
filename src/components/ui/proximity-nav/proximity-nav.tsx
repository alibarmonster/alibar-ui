"use client";

import { useEffect, useRef, type ComponentProps, type ElementType, type MouseEvent, type RefObject } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils";

export interface ProximityNavItem {
  /** Link text. */
  label: string;
  /** Destination. */
  href: string;
  /** Small secondary text, e.g. a year or count. */
  meta?: string;
}

export interface ProximityNavProps
  extends Omit<ComponentProps<"nav">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  /** Links, in order. */
  items: ProximityNavItem[];
  /** Stack links in a column or a row. @default "vertical" */
  orientation?: "vertical" | "horizontal";
  /** Distance in px over which the effect fades out. @default 140 */
  radius?: number;
  /** Scale of the link nearest the cursor. @default 1.08 */
  maxScale?: number;
  /** Opacity of links far from the cursor while it's over the list. @default 0.35 */
  minOpacity?: number;
  /** href of the current page. */
  activeHref?: string;
  /** Link component, e.g. Next.js Link. @default "a" */
  linkComponent?: ElementType;
  /** Called when a link is clicked. */
  onNavigate?: (href: string, event: MouseEvent<HTMLElement>) => void;
}

const PRESENCE_SPRING = { stiffness: 260, damping: 30, mass: 0.6 };
const FOLLOW_SPRING = { stiffness: 420, damping: 40, mass: 0.4 };

/** 1 at the cursor, easing smoothly to 0 at `radius`. */
function proximity(distance: number, radius: number) {
  const t = Math.min(Math.abs(distance) / radius, 1);
  return 0.5 + 0.5 * Math.cos(Math.PI * t);
}

function ProximityLink({
  item,
  index,
  centers,
  pointer,
  presence,
  props,
}: {
  item: ProximityNavItem;
  index: number;
  centers: RefObject<number[]>;
  pointer: MotionValue<number>;
  presence: MotionValue<number>;
  props: {
    vertical: boolean;
    radius: number;
    maxScale: number;
    minOpacity: number;
    active: boolean;
    Link: ElementType;
    onNavigate?: (href: string, event: MouseEvent<HTMLElement>) => void;
    onFocusItem: (index: number) => void;
    onBlurItem: () => void;
  };
}) {
  const reduceMotion = useReducedMotion();
  const p = useTransform([pointer, presence], ([at, here]: number[]) => proximity(at - (centers.current[index] ?? 0), props.radius) * here);
  const scale = useTransform(p, (v) => (reduceMotion ? 1 : 1 + (props.maxScale - 1) * v));
  // p already includes presence, so (here − v) is how far this link is from full brightness.
  const opacity = useTransform([p, presence], ([v, here]: number[]) => 1 - (1 - props.minOpacity) * (here - v));
  const { Link } = props;

  return (
    <li className={cn(props.vertical && "border-b border-border last:border-b-0")}>
      <Link
        href={item.href}
        aria-current={props.active ? "page" : undefined}
        onClick={(event: MouseEvent<HTMLElement>) => props.onNavigate?.(item.href, event)}
        onFocus={() => props.onFocusItem(index)}
        onBlur={props.onBlurItem}
        className={cn(
          "group flex items-baseline gap-4 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
          props.vertical ? "justify-between py-3" : "px-3 py-2",
        )}
      >
        <motion.span
          style={{ scale, opacity, originX: props.vertical ? 0 : 0.5 }}
          className={cn(
            "inline-block font-semibold tracking-tight text-foreground",
            props.vertical ? "text-2xl sm:text-3xl" : "text-base sm:text-lg",
          )}
        >
          {item.label}
          {props.active ? <span aria-hidden="true" className="ml-2 inline-block size-1.5 -translate-y-1 rounded-full bg-primary align-middle" /> : null}
        </motion.span>
        {item.meta ? (
          <motion.span style={{ opacity }} className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
            {item.meta}
          </motion.span>
        ) : null}
      </Link>
    </li>
  );
}

export function ProximityNav({
  items,
  orientation = "vertical",
  radius = 140,
  maxScale = 1.08,
  minOpacity = 0.35,
  activeHref,
  linkComponent: Link = "a",
  onNavigate,
  className,
  "aria-label": ariaLabel = "Main",
  ...props
}: ProximityNavProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const centers = useRef<number[]>([]);
  const vertical = orientation === "vertical";
  const pointerTarget = useMotionValue(0);
  const presenceTarget = useMotionValue(0);
  const pointer = useSpring(pointerTarget, FOLLOW_SPRING);
  const presence = useSpring(presenceTarget, PRESENCE_SPRING);

  // Link centers along the main axis; transforms don't affect layout, so these stay valid.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      centers.current = Array.from(list.children as HTMLCollectionOf<HTMLElement>).map((el) =>
        vertical ? el.offsetTop + el.offsetHeight / 2 : el.offsetLeft + el.offsetWidth / 2,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [items.length, vertical]);

  return (
    <nav aria-label={ariaLabel} className={className} {...props}>
      <ul
        ref={listRef}
        onPointerMove={(event) => {
          const list = listRef.current;
          if (event.pointerType !== "mouse" || !list) return;
          // Centers are layout px; divide out any ancestor scale so the two agree.
          const rect = list.getBoundingClientRect();
          pointerTarget.set(
            vertical
              ? ((event.clientY - rect.top) * list.offsetHeight) / (rect.height || 1)
              : ((event.clientX - rect.left) * list.offsetWidth) / (rect.width || 1),
          );
          presenceTarget.set(1);
        }}
        onPointerLeave={() => presenceTarget.set(0)}
        className={cn("relative flex", vertical ? "flex-col" : "flex-wrap items-center gap-1")}
      >
        {items.map((item, index) => (
          <ProximityLink
            key={item.href}
            item={item}
            index={index}
            centers={centers}
            pointer={pointer}
            presence={presence}
            props={{
              vertical,
              radius,
              maxScale,
              minOpacity,
              active: item.href === activeHref,
              Link,
              onNavigate,
              // Keyboard focus behaves like the cursor resting on the focused link.
              onFocusItem: (i) => {
                pointerTarget.set(centers.current[i] ?? 0);
                presenceTarget.set(1);
              },
              onBlurItem: () => {
                if (!listRef.current?.matches(":hover")) presenceTarget.set(0);
              },
            }}
          />
        ))}
      </ul>
    </nav>
  );
}
