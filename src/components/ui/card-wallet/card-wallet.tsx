"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
} from "motion/react";
import { RollingDigits } from "@/components/ui/rolling-digits/rolling-digits";
import { cn } from "@/lib/utils";

export interface WalletTransaction {
  id: string;
  merchant: string;
  detail: string;
  /** Negative for spending, positive for money in, in the wallet's currency. */
  amount: number;
  icon?: ReactNode;
  /** Avatar image URL. */
  avatar?: string;
}

export interface WalletCard {
  id: string;
  issuer: string;
  product: string;
  /** Last four digits; the rest of the number is always masked. */
  lastFour: string;
  holder: string;
  /** Finish: brushed "metal", "black" with a guilloche pattern, frosted "glass", or a deep solid "color". @default "color" */
  material?: "metal" | "black" | "glass" | "color";
  /** Base color for the "color" material (any CSS color). */
  tint?: string;
  /** Expiry as MM/YY. */
  expires?: string;
  /** Network mark; null hides it. Defaults to an original fictional mark (never a real network's logo). */
  network?: ReactNode | null;
  /** Artwork under the finish. */
  image?: string;
  balance: number;
  balanceLabel: string;
  transactions: WalletTransaction[];
}

export interface CardWalletProps {
  /** Cards in the stack, front first. Use fictional data only. */
  cards: WalletCard[];
  /** Name of the wallet, shown in the header and used as the group label. @default "Wallet" */
  label?: string;
  /** ISO currency for balances and transactions, e.g. "USD" or "IDR". @default "USD" */
  currency?: string;
  /** Locale for number formatting (fixed by default so server and client render the same text). @default "en-US" */
  locale?: string;
  /** Fires when a card opens (with the card) or closes (null). */
  onSelectedChange?: (card: WalletCard | null) => void;
  /** Classes for the root. */
  className?: string;
}

const RATIO = 85.6 / 53.98; // ID-1 card
const CARD = 100 / RATIO; // card height in cqw
const PEEK = 0.1; // behind cards peek above the front one, in card heights
const FAN = 0.9; // extra peek while fanned
const TOP = 3 * PEEK * (1 + FAN) + 0.05; // front card's resting top
const POCKET = 1.12; // a card slid into the pocket, below its resting place (fully behind the sleeve)
const STAGE = 2.34; // stage height in card heights
const SLEEVE_TOP = TOP + 1.04; // just below the front card, so the whole card stays visible
const SPRING = { type: "spring", stiffness: 300, damping: 36 } as const; // critically damped, no overshoot

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** A guilloche: overlapping sine rosettes, drawn once. */
const GUILLOCHE = Array.from({ length: 9 }, (_, k) => {
  let d = "";
  for (let s = 0; s <= 160; s++) {
    const t = (s / 160) * Math.PI * 2;
    const r = 70 + 26 * Math.sin(t * 7 + k * 0.7) + 10 * Math.sin(t * 13 - k);
    d += `${s ? "L" : "M"}${(200 + Math.cos(t) * r * 1.9).toFixed(1)} ${(126 + Math.sin(t) * r * 0.95).toFixed(1)}`;
  }
  return `${d}Z`;
});

const FINISH: Record<NonNullable<WalletCard["material"]>, { surface: string; text: string; dark: boolean }> = {
  metal: {
    surface:
      "bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.14)_0_1px,rgba(0,0,0,0.05)_1px_3px),linear-gradient(135deg,#ECEDF0,#B7BBC2_42%,#F5F6F8_60%,#A4A8B0)]",
    text: "text-zinc-800",
    dark: false,
  },
  black: { surface: "bg-[radial-gradient(120%_90%_at_20%_0%,#24262D,#0B0C10)]", text: "text-zinc-100", dark: true },
  glass: {
    surface: "border border-white/50 bg-[linear-gradient(135deg,rgba(255,255,255,0.62),rgba(219,234,254,0.32))] backdrop-blur-xl backdrop-saturate-150",
    text: "text-zinc-900",
    dark: false,
  },
  color: { surface: "bg-[linear-gradient(150deg,rgba(255,255,255,0.18),rgba(255,255,255,0)_45%,rgba(0,0,0,0.25))]", text: "text-white", dark: true },
};

function Chip() {
  return (
    <svg viewBox="0 0 48 36" className="h-auto w-[11cqw]" aria-hidden="true">
      <defs>
        <linearGradient id="card-wallet-chip" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F3D58A" />
          <stop offset="0.5" stopColor="#C99A3E" />
          <stop offset="1" stopColor="#EBC873" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="34" rx="6" fill="url(#card-wallet-chip)" stroke="#9C7429" strokeOpacity="0.5" />
      <path d="M1 12h14M1 24h14M33 12h14M33 24h14M15 1v34M33 1v34M15 18h18" stroke="#8A6524" strokeOpacity="0.55" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

function Contactless({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-auto w-[6cqw]", className)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M8.5 8.5a5 5 0 0 1 0 7M12 6a8.5 8.5 0 0 1 0 12M15.5 3.5a12 12 0 0 1 0 17M5 11a1.5 1.5 0 0 1 0 2" />
    </svg>
  );
}

/** An original, fictional network mark ("Kinnet"): a hexagon knot and a wordmark. */
function KinnetMark() {
  return (
    <span className="flex items-center gap-[1.2cqw]" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-auto w-[6.5cqw]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <path d="M12 2.5 20.5 7.25v9.5L12 21.5 3.5 16.75v-9.5Z" />
        <path d="M7.5 9.5 12 12l4.5-2.5M12 12v5" />
      </svg>
      <span className="text-[3.4cqw] font-semibold tracking-[0.16em]">KINNET</span>
    </span>
  );
}

function CardFace({ card, light }: { card: WalletCard; light: { x: MotionValue<string>; y: MotionValue<string> } }) {
  const material = card.material ?? "color";
  const finish = FINISH[material];
  const emboss = finish.dark ? "[text-shadow:0_1px_0_rgba(255,255,255,0.22),0_-1px_0_rgba(0,0,0,0.5)]" : "[text-shadow:0_1px_0_rgba(255,255,255,0.85),0_-1px_0_rgba(0,0,0,0.22)]";
  return (
    <div aria-hidden="true" className={cn("absolute inset-0 overflow-hidden rounded-[4.6cqw]", finish.text)}>
      {card.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- plain img keeps the component framework-agnostic
        <img src={card.image} alt="" draggable={false} className="absolute inset-0 size-full object-cover" />
      ) : null}
      <div
        className={cn("absolute inset-0 rounded-[inherit]", finish.surface, card.image && material !== "glass" && "opacity-80")}
        style={material === "color" ? { backgroundColor: card.tint ?? "#1E3A8A" } : undefined}
      />
      {material === "black" ? (
        <svg viewBox="0 0 400 252" preserveAspectRatio="none" className="absolute inset-0 size-full" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8">
          {GUILLOCHE.map((d) => (
            <path key={d.slice(0, 24)} d={d} />
          ))}
        </svg>
      ) : null}
      {/* Pre-painted specular highlight; only its position moves. */}
      <motion.div
        className="pointer-events-none absolute -inset-1/2 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.55),rgba(255,255,255,0)_38%)] mix-blend-soft-light"
        style={{ x: light.x, y: light.y }}
      />
      <div className="relative flex size-full flex-col justify-between p-[6cqw]">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="truncate text-[4.2cqw] font-semibold tracking-tight">{card.issuer}</p>
            <p className="truncate text-[3.2cqw] opacity-70">{card.product}</p>
          </div>
          <Contactless className="opacity-80" />
        </div>
        <Chip />
        <div>
          <p className={cn("font-mono text-[5.6cqw] tracking-[0.12em] tabular-nums", emboss)}>•••• •••• •••• {card.lastFour}</p>
          <div className="mt-[2cqw] flex items-end justify-between gap-[3cqw]">
            <div className="flex min-w-0 items-end gap-[4cqw]">
              <p className={cn("truncate font-mono text-[3.4cqw] tracking-[0.08em] uppercase", emboss)}>{card.holder}</p>
              {card.expires ? (
                <p className={cn("shrink-0 font-mono text-[3.4cqw] leading-tight tabular-nums", emboss)}>
                  <span className="block text-[2.2cqw] tracking-[0.1em] uppercase opacity-70">Valid thru</span>
                  {card.expires}
                </p>
              ) : null}
            </div>
            {card.network === null ? null : <span className="shrink-0 opacity-90">{card.network ?? <KinnetMark />}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CardMotion {
  cycle: MotionValue<number>;
  fan: MotionValue<number>;
  open: MotionValue<number>;
  selected: MotionValue<number>;
  tiltX: MotionValue<number>;
  tiltY: MotionValue<number>;
  reduced: MotionValue<number>;
  light: { x: MotionValue<string>; y: MotionValue<string> };
}

function WalletCardButton({
  card,
  index,
  total,
  motionValues,
  tabbable,
  expanded,
  balance,
  onActivate,
  buttonRef,
}: {
  card: WalletCard;
  index: number;
  total: number;
  motionValues: CardMotion;
  tabbable: boolean;
  expanded: boolean;
  balance: string;
  onActivate: (index: number) => void;
  buttonRef: (element: HTMLButtonElement | null) => void;
}) {
  const { cycle, fan, open, selected, tiltX, tiltY, reduced, light } = motionValues;
  const rise = useMotionValue(0);
  // Every visual is a pure function of a few continuous values, so springs, drags and
  // interruptions always move the same shape and React never re-renders mid-gesture.
  const y = useTransform([cycle, fan, open, selected, rise], ([c, f, o, sel, ri]: number[]) => {
    const r = index - c;
    const closed = r >= 0 ? -Math.min(r, 3) * PEEK * (1 + f * FAN) - ri * f * 0.16 : Math.min(-r, 1) * POCKET + Math.max(0, -r - 1) * 0.02;
    const opened = sel === index ? -TOP + 0.03 : POCKET + 1.25;
    return `${lerp(closed, opened, o) * 100}%`;
  });
  const scale = useTransform([cycle, open, selected], ([c, o, sel]: number[]) => {
    const r = index - c;
    const closed = r >= 0 ? 1 - Math.min(r, 3) * 0.045 : 1 - Math.min(-r, 1) * 0.02;
    return lerp(closed, sel === index ? 1 : closed, o);
  });
  // Only the front card (or the open one) tilts, and never under reduced motion.
  const weight = (c: number, o: number, sel: number, still: number) => (still ? 0 : Math.max(0, 1 - Math.abs(index - c)) * (1 - o) + (sel === index ? o : 0));
  const rotateX = useTransform([cycle, open, selected, tiltY, reduced], ([c, o, sel, ty, rd]: number[]) => -ty * 5 * weight(c, o, sel, rd));
  const rotateY = useTransform([cycle, open, selected, tiltX, reduced], ([c, o, sel, tx, rd]: number[]) => tx * 5 * weight(c, o, sel, rd));
  const shade = useTransform(cycle, (c) => Math.min(Math.max(0, index - c), 3) * 0.12);
  const shadow = useTransform([rise, fan], ([ri, f]: number[]) => 0.32 + ri * f * 0.4);

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      tabIndex={tabbable ? 0 : -1}
      aria-expanded={expanded}
      onClick={() => onActivate(index)}
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse" || reduced.get()) return;
        animate(rise, 1, SPRING);
      }}
      onPointerLeave={() => animate(rise, 0, SPRING)}
      style={{ y, scale, rotateX, rotateY, zIndex: total - index, top: `${TOP * CARD}cqw` }}
      className={cn("absolute left-0 aspect-[85.6/53.98] w-full cursor-pointer rounded-[4.6cqw] text-left outline-none [transform-style:preserve-3d] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", expanded && "touch-none")}
    >
      <span className="sr-only">
        {card.issuer} {card.product}, ending in {card.lastFour}, card {index + 1} of {total}, {card.balanceLabel} {balance}
      </span>
      <motion.span aria-hidden="true" className="absolute inset-x-[6%] -bottom-[4%] h-[18%] rounded-[50%] bg-black blur-[3cqw]" style={{ opacity: shadow }} />
      <CardFace card={card} light={light} />
      <motion.span aria-hidden="true" className="absolute inset-0 rounded-[inherit] bg-black" style={{ opacity: shade }} />
    </motion.button>
  );
}

/**
 * A stack of payment cards, passes or memberships with real materials. Fan it, cycle through it
 * into the pocket, and lift one card out to see its balance and recent activity.
 */
export function CardWallet({ cards, label = "Wallet", currency = "USD", locale = "en-US", onSelectedChange, className }: CardWalletProps) {
  const count = cards.length;
  const cycle = useMotionValue(0);
  const fan = useMotionValue(0);
  const open = useMotionValue(0);
  const selectedValue = useMotionValue(-1);
  const reduced = useMotionValue(0);
  const tiltTargetX = useMotionValue(0);
  const tiltTargetY = useMotionValue(0);
  const tiltX = useSpring(tiltTargetX, { stiffness: 180, damping: 26 });
  const tiltY = useSpring(tiltTargetY, { stiffness: 180, damping: 26 });
  const lightX = useTransform(tiltX, (v) => `${v * 22}%`);
  const lightY = useTransform(tiltY, (v) => `${v * 22}%`);
  const sleeveY = useTransform(open, (o) => `${o * 1.05 * CARD}cqw`);
  const reduceMotion = useReducedMotion();
  const hintId = useId();
  const [front, setFront] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const playback = useRef<AnimationPlaybackControls | null>(null);
  const drag = useRef({ id: -1, active: false, startY: 0, startX: 0, startCycle: 0, startOpen: 0, startTime: 0, dragged: false });

  const money = useMemo(() => new Intl.NumberFormat(locale, { style: "currency", currency }), [locale, currency]);
  // The currency's own precision (2 for USD, 0 for IDR), so rolling balances keep trailing zeros.
  const places = money.resolvedOptions().maximumFractionDigits ?? 2;
  const format = (value: number) => money.format(value);

  useEffect(() => {
    reduced.set(reduceMotion ? 1 : 0);
    if (reduceMotion) {
      tiltTargetX.set(0);
      tiltTargetY.set(0);
    }
  }, [reduceMotion, reduced, tiltTargetX, tiltTargetY]);

  // Phones that report orientation move the light and tilt (no permission prompt is triggered).
  useEffect(() => {
    const onOrientation = (event: DeviceOrientationEvent) => {
      if (reduced.get() || event.gamma === null || event.beta === null) return;
      tiltTargetX.set(clamp(event.gamma / 30, -1, 1));
      tiltTargetY.set(clamp((event.beta - 45) / 30, -1, 1));
    };
    window.addEventListener("deviceorientation", onOrientation);
    return () => window.removeEventListener("deviceorientation", onOrientation);
  }, [reduced, tiltTargetX, tiltTargetY]);

  const motionTo = (value: MotionValue<number>, to: number, velocity?: number) => {
    if (reduced.get()) {
      value.jump(to);
      return null;
    }
    return animate(value, to, { ...SPRING, velocity: velocity ?? value.getVelocity() });
  };

  const describe = useCallback((index: number) => {
    const card = cards[index];
    return card ? `${card.issuer} ${card.product}, ending in ${card.lastFour}` : "";
  }, [cards]);

  useMotionValueEvent(cycle, "change", (c) => {
    const next = clamp(Math.round(c), 0, Math.max(0, count - 1));
    if (next === front) return;
    setFront(next);
    setAnnouncement(`Card ${next + 1} of ${count}: ${describe(next)}`);
  });

  // Keep focus on the front card while cycling with the keyboard.
  useEffect(() => {
    const active = document.activeElement;
    if (selected === null && active instanceof HTMLButtonElement && buttons.current.includes(active)) buttons.current[front]?.focus({ preventScroll: true });
  }, [front, selected]);

  const goTo = (index: number, velocity?: number) => {
    playback.current?.stop();
    playback.current = motionTo(cycle, clamp(index, 0, Math.max(0, count - 1)), velocity);
  };

  const select = (index: number) => {
    const card = cards[index];
    if (!card) return;
    selectedValue.set(index);
    setSelected(index);
    playback.current?.stop();
    playback.current = motionTo(open, 1);
    animate(fan, 0, SPRING);
    setAnnouncement(`Opened ${describe(index)}. ${card.balanceLabel} ${format(card.balance)}`);
    onSelectedChange?.(card);
  };

  const close = (velocity?: number) => {
    if (selected === null) return;
    const index = selected;
    setSelected(null);
    playback.current?.stop();
    playback.current = motionTo(open, 0, velocity);
    setAnnouncement(`Closed. Card ${front + 1} of ${count}`);
    onSelectedChange?.(null);
    // Focus returns to the card that was open.
    requestAnimationFrame(() => buttons.current[index]?.focus({ preventScroll: true }));
  };

  const activate = (index: number) => {
    if (drag.current.dragged) {
      drag.current.dragged = false;
      return;
    }
    if (selected === index) close();
    else select(index);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      if (selected !== null) {
        event.preventDefault();
        close();
      }
      return;
    }
    if (selected !== null) return;
    const moves: Record<string, number> = { ArrowUp: front - 1, ArrowLeft: front - 1, ArrowDown: front + 1, ArrowRight: front + 1, Home: 0, End: count - 1 };
    if (event.key in moves) {
      event.preventDefault();
      goTo(moves[event.key]);
    }
  };

  const cardHeight = () => (root.current?.clientWidth ?? 296) / RATIO;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = { id: event.pointerId, active: false, startY: event.clientY, startX: event.clientX, startCycle: cycle.get(), startOpen: open.get(), startTime: performance.now(), dragged: false };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.pointerType === "mouse" && !reduced.get()) {
      tiltTargetX.set(clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2, -1, 1));
      tiltTargetY.set(clamp(((event.clientY - rect.top) / (rect.width / RATIO) - TOP - 0.5) * 1.2, -1, 1));
    }
    const state = drag.current;
    if (state.id !== event.pointerId) return;
    const dy = event.clientY - state.startY;
    if (!state.active) {
      if (Math.abs(dy) < 6 || Math.abs(event.clientX - state.startX) > Math.abs(dy)) return;
      state.active = true;
      state.dragged = true;
      playback.current?.stop();
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const height = cardHeight();
    if (selected !== null) {
      // Pull the open card down to put it back.
      open.set(clamp(state.startOpen - Math.max(0, dy) / (height * 1.4), 0, 1));
      return;
    }
    // Down slides the front card into the pocket 1:1 and brings the next one forward.
    const max = Math.max(0, count - 1);
    const raw = state.startCycle + dy / (height * POCKET);
    cycle.set(raw < 0 ? raw * 0.3 : raw > max ? max + (raw - max) * 0.3 : raw);
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (state.id !== event.pointerId) return;
    state.id = -1;
    if (!state.active) return;
    state.active = false;
    if (selected !== null) {
      const velocity = open.getVelocity();
      if (open.get() < 0.7 || velocity < -1.5) close(velocity);
      else playback.current = motionTo(open, 1, velocity);
      return;
    }
    const velocity = clamp(cycle.getVelocity(), -12, 12);
    const from = Math.round(state.startCycle);
    // A flick lands where its momentum projects, one card at a time.
    let next = clamp(Math.round(cycle.get() + velocity * 0.2), from - 1, from + 1);
    const quick = performance.now() - state.startTime < 300 && Math.abs(cycle.get() - state.startCycle) > 0.08;
    if (next === from && (Math.abs(velocity) > 0.8 || quick)) next = from + Math.sign(Math.abs(velocity) > 0.8 ? velocity : cycle.get() - state.startCycle);
    goTo(next, velocity);
  };

  const motionValues: CardMotion = { cycle, fan, open, selected: selectedValue, tiltX, tiltY, reduced, light: { x: lightX, y: lightY } };
  const openCard = selected !== null ? cards[selected] : null;
  const shownCard = openCard ?? cards[front];

  return (
    <div
      ref={root}
      role="group"
      aria-label={label}
      aria-describedby={hintId}
      onKeyDown={onKeyDown}
      className={cn("@container w-[min(100%,18.5rem)] select-none", className)}
    >
      <p id={hintId} className="sr-only">
        Use the up and down arrow keys to move through the cards, Enter to open one and Escape to close it.
      </p>
      <div className="flex h-10 items-center justify-between">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {openCard ? (
          <button type="button" onClick={() => close()} className="h-8 cursor-pointer rounded-full border border-border px-3 text-[13px] font-medium text-foreground outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring">
            All cards
          </button>
        ) : (
          <p aria-hidden="true" className="font-mono text-[13px] text-muted-foreground tabular-nums">
            {front + 1} of {count}
          </p>
        )}
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse" && selected === null && !reduced.get()) animate(fan, 1, SPRING);
        }}
        onPointerLeave={() => {
          animate(fan, 0, SPRING);
          tiltTargetX.set(0);
          tiltTargetY.set(0);
        }}
        className="relative touch-pan-x overflow-hidden [perspective:900px]"
        style={{ height: `${STAGE * CARD}cqw` } as CSSProperties}
      >
        {cards.map((card, i) => (
          <WalletCardButton
            key={card.id}
            card={card}
            index={i}
            total={count}
            motionValues={motionValues}
            tabbable={selected === null ? i === front : i === selected}
            expanded={selected === i}
            balance={format(card.balance)}
            onActivate={activate}
            buttonRef={(element) => {
              buttons.current[i] = element;
            }}
          />
        ))}
        {/* The pocket: cards slide behind it. It slides away while a card is open. */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 rounded-t-[5cqw] border border-b-0 border-border bg-[linear-gradient(to_bottom,var(--surface-2),var(--surface))] shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.25)]"
          style={{ top: `${SLEEVE_TOP * CARD}cqw`, y: sleeveY, zIndex: count + 5 }}
        >
          <div className="mx-auto mt-[3cqw] h-[1.2cqw] w-[14cqw] rounded-full bg-foreground/10" />
        </motion.div>
        {/* Balance and recent activity of the open card. */}
        <motion.div
          inert={openCard === null}
          className="absolute inset-x-0 bottom-0 flex flex-col"
          style={{ top: `${1.08 * CARD}cqw`, opacity: open, zIndex: count + 6 }}
        >
          {shownCard ? (
            <>
              <div className="flex items-end justify-between border-b border-border pb-2">
                <div>
                  <p className="text-[12px] text-muted-foreground">{shownCard.balanceLabel}</p>
                  <p className="text-[22px] font-semibold tracking-tight text-foreground tabular-nums">
                    <RollingDigits value={openCard ? shownCard.balance : 0} decimals={places} format={{ style: "currency", currency }} locale={locale} />
                  </p>
                </div>
                <p className="pb-1 font-mono text-[12px] text-muted-foreground">•••• {shownCard.lastFour}</p>
              </div>
              <ul aria-label="Recent activity" className="mt-1">
                {shownCard.transactions.slice(0, 3).map((tx, i) => (
                  <motion.li
                    key={tx.id}
                    initial={false}
                    animate={openCard ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                    transition={{ ...SPRING, delay: openCard && !reduceMotion ? 0.12 + i * 0.06 : 0 }}
                    className="flex items-center gap-3 py-2"
                  >
                    <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-2 text-[13px] font-medium text-foreground">
                      {tx.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element -- plain img keeps the component framework-agnostic
                        <img src={tx.avatar} alt="" className="size-full object-cover" />
                      ) : (
                        (tx.icon ?? tx.merchant.slice(0, 1))
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{tx.merchant}</span>
                      <span className="block truncate text-[12px] text-muted-foreground">{tx.detail}</span>
                    </span>
                    <span className={cn("shrink-0 text-sm font-medium tabular-nums", tx.amount > 0 ? "text-success" : "text-foreground")}>
                      {tx.amount > 0 ? "+" : "−"}
                      {format(Math.abs(tx.amount))}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </>
          ) : null}
        </motion.div>
      </div>
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
