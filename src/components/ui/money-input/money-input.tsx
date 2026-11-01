"use client";

import { useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type ComponentProps } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface MoneyInputProps
  extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "size" | "max" | "prefix"> {
  /** Controlled amount. null means empty. */
  value?: number | null;
  /** Initial amount when uncontrolled. @default null */
  defaultValue?: number | null;
  /** Called with the parsed amount, or null when the field is empty. */
  onValueChange?: (value: number | null) => void;
  /** ISO 4217 currency code. @default "USD" */
  currency?: string;
  /** BCP 47 locale for the separators and the symbol position. @default "en-US" */
  locale?: string;
  /** Digits allowed after the decimal separator. @default the currency's minor units (0 for IDR) */
  fractionDigits?: number;
  /** Largest accepted amount; keystrokes that would exceed it are ignored. */
  max?: number;
  /** Field size. "lg" suits a hero amount. @default "md" */
  size?: "md" | "lg";
  /** Classes for the outer field. */
  className?: string;
}

// Currencies whose everyday amounts have no minor units, even though ISO 4217 lists two.
const WHOLE_UNIT_CURRENCIES = new Set(["IDR"]);

interface MoneyFormat {
  locale: string;
  group: string;
  decimal: string;
  symbol: string;
  symbolFirst: boolean;
  fractionDigits: number;
}

function getFormat(locale: string, currency: string, fractionDigits?: number): MoneyFormat {
  const formatter = new Intl.NumberFormat(locale, { style: "currency", currency, numberingSystem: "latn" });
  const parts = formatter.formatToParts(1234567.5);
  // Separators come from a plain number format: a zero-decimal currency (e.g. IDR in some
  // engines) has no decimal part, and guessing one can collide with the group separator.
  const numberParts = new Intl.NumberFormat(locale, { numberingSystem: "latn" }).formatToParts(1234567.5);
  const numberPart = (type: Intl.NumberFormatPartTypes) => numberParts.find((p) => p.type === type)?.value;
  return {
    locale,
    group: numberPart("group") ?? ",",
    decimal: numberPart("decimal") ?? ".",
    symbol: parts.find((p) => p.type === "currency")?.value ?? currency,
    symbolFirst: parts.findIndex((p) => p.type === "currency") < parts.findIndex((p) => p.type === "integer"),
    fractionDigits:
      fractionDigits ??
      (WHOLE_UNIT_CURRENCIES.has(currency.toUpperCase()) ? 0 : (formatter.resolvedOptions().maximumFractionDigits ?? 2)),
  };
}

const isDigit = (ch: string) => ch >= "0" && ch <= "9";
const isDecimalKey = (ch: string, f: MoneyFormat) => ch === f.decimal || (ch === "." && f.group !== ".");

/** Raw keystrokes → canonical "1234.5" (digits, optional "." and fraction). */
function sanitize(raw: string, f: MoneyFormat) {
  let integer = "";
  let fraction = "";
  let hasDecimal = false;
  for (const ch of raw) {
    if (isDigit(ch)) {
      if (!hasDecimal) integer += ch;
      else if (fraction.length < f.fractionDigits) fraction += ch;
    } else if (!hasDecimal && f.fractionDigits > 0 && isDecimalKey(ch, f)) {
      hasDecimal = true;
    }
  }
  integer = integer.replace(/^0+(?=\d)/, "");
  return hasDecimal ? `${integer || "0"}.${fraction}` : integer;
}

function toDisplay(canonical: string, f: MoneyFormat) {
  if (!canonical) return "";
  const [integer, fraction] = canonical.split(".");
  const grouped = new Intl.NumberFormat(f.locale, { numberingSystem: "latn", maximumFractionDigits: 0 }).format(
    BigInt(integer || "0"),
  );
  return fraction === undefined ? grouped : `${grouped}${f.decimal}${fraction}`;
}

const toNumber = (canonical: string) => (canonical === "" ? null : Number(canonical));
const toCanonical = (value: number | null, f: MoneyFormat) => (value === null ? "" : value.toFixed(f.fractionDigits));

/** Digits and the decimal separator are "significant"; group separators are not. */
function countSignificant(text: string, end: number, f: MoneyFormat) {
  let count = 0;
  for (let i = 0; i < end; i++) if (isDigit(text[i]) || isDecimalKey(text[i], f)) count++;
  return count;
}

function caretAfter(display: string, significant: number, f: MoneyFormat) {
  if (significant <= 0) return 0;
  let count = 0;
  for (let i = 0; i < display.length; i++) {
    if (isDigit(display[i]) || display[i] === f.decimal) count++;
    if (count === significant) return i + 1;
  }
  return display.length;
}

/** Stable keys so only the characters that changed animate. */
function toTokens(display: string, f: MoneyFormat) {
  const tokens: { key: string; ch: string }[] = [];
  let integerDigits = 0;
  let fractionDigits = 0;
  let inFraction = false;
  for (const ch of display) {
    if (isDigit(ch)) {
      const slot = inFraction ? `f${fractionDigits++}` : `d${integerDigits++}`;
      tokens.push({ key: `${slot}:${ch}`, ch });
    } else if (ch === f.decimal) {
      inFraction = true;
      tokens.push({ key: "decimal", ch });
    } else {
      tokens.push({ key: `g${integerDigits}`, ch });
    }
  }
  return tokens;
}

export function MoneyInput({
  value,
  defaultValue = null,
  onValueChange,
  currency = "USD",
  locale = "en-US",
  fractionDigits,
  max,
  size = "md",
  className,
  name,
  placeholder,
  ...props
}: MoneyInputProps) {
  const format = useMemo(() => getFormat(locale, currency, fractionDigits), [locale, currency, fractionDigits]);
  const [text, setText] = useState(() => toCanonical(value ?? defaultValue, format));
  const [syncedValue, setSyncedValue] = useState(value);
  const [, forceRender] = useState(0);
  // Characters only roll in once the user types, so the initial value doesn't animate on load.
  const [hasTyped, setHasTyped] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLSpanElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  // Follow a controlled value, unless it already matches what is typed (e.g. "12." vs 12).
  if (value !== undefined && value !== syncedValue) {
    setSyncedValue(value);
    if (toNumber(text) !== value) setText(toCanonical(value, format));
  }

  const display = toDisplay(text, format);
  const tokens = toTokens(display, format);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    if (pendingCaret.current !== null && document.activeElement === input) {
      input.setSelectionRange(pendingCaret.current, pendingCaret.current);
    }
    pendingCaret.current = null;
    if (overlayRef.current) overlayRef.current.style.transform = `translateX(${-input.scrollLeft}px)`;
  });

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const caret = input.selectionStart ?? input.value.length;
    const next = sanitize(input.value, format);
    const amount = toNumber(next);

    if (max !== undefined && amount !== null && amount > max) {
      // React restores the previous text; put the caret back where it was.
      pendingCaret.current = Math.max(0, caret - (input.value.length - display.length));
      forceRender((n) => n + 1);
      return;
    }

    pendingCaret.current = caretAfter(toDisplay(next, format), countSignificant(input.value, caret, format), format);
    setHasTyped(true);
    setText(next);
    if (amount !== toNumber(text)) onValueChange?.(amount);
  }

  const symbol = (
    <span
      aria-hidden="true"
      className={cn("shrink-0 text-muted-foreground select-none", size === "lg" ? "text-2xl font-medium" : "text-sm")}
    >
      {format.symbol}
    </span>
  );

  const roll = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: "0.45em", filter: "blur(3px)" },
        animate: { opacity: 1, y: "0em", filter: "blur(0px)" },
      };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={cn(
        "flex w-full cursor-text items-center gap-1.5 rounded-md border border-input bg-background text-foreground shadow-xs",
        "transition-[border-color,box-shadow] duration-150 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20",
        "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50",
        "has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-destructive/20",
        size === "lg" ? "h-16 px-4 text-3xl font-semibold tracking-tight" : "h-10 px-3 text-sm",
        className,
      )}
    >
      {format.symbolFirst ? symbol : null}
      <span className="relative flex h-full min-w-0 flex-1 items-center overflow-hidden">
        <input
          ref={inputRef}
          type="text"
          inputMode={format.fractionDigits > 0 ? "decimal" : "numeric"}
          autoComplete="off"
          spellCheck={false}
          value={display}
          onChange={handleChange}
          onScroll={(event) => {
            if (overlayRef.current) overlayRef.current.style.transform = `translateX(${-event.currentTarget.scrollLeft}px)`;
          }}
          placeholder={placeholder ?? (format.fractionDigits ? `0${format.decimal}${"0".repeat(format.fractionDigits)}` : "0")}
          className="h-full w-full min-w-0 bg-transparent leading-none text-transparent tabular-nums caret-foreground outline-none [font-kerning:none] selection:bg-primary/20 placeholder:text-muted-foreground/60 disabled:cursor-not-allowed"
          {...props}
        />
        {/* The visible digits: an aria-hidden copy of the input's text, animated per character. */}
        <span
          ref={overlayRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 flex items-center leading-none whitespace-pre tabular-nums [font-kerning:none]"
        >
          {/* Plain keyed list, no AnimatePresence: removed characters vanish at once (exit
              animations stranded stale separators during fast typing), new ones roll in, and
              the rest glide to their new spots. */}
          {tokens.map((token) => (
            <motion.span
              key={token.key}
              layout={reduceMotion ? false : "position"}
              variants={roll}
              initial={hasTyped ? "initial" : false}
              animate="animate"
              transition={{ duration: duration.quick, ease: ease.out, layout: { duration: duration.quick, ease: ease.out } }}
              className="inline-block"
            >
              {token.ch}
            </motion.span>
          ))}
        </span>
      </span>
      {format.symbolFirst ? null : symbol}
      {name ? <input type="hidden" name={name} value={text} /> : null}
    </div>
  );
}
