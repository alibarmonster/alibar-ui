"use client";

import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type KeyboardEvent,
} from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { Popover } from "radix-ui";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease, overlayVariants, spring } from "@/lib/motion";

export interface PhoneCountry {
  /** ISO 3166-1 alpha-2 code. */
  code: string;
  /** English name, used for display and search. */
  name: string;
  /** Calling code without "+". */
  dial: string;
  /** National format; "#" is a digit. */
  format: string;
  /** Digits needed before the number counts as complete. */
  minDigits: number;
}

/** A compact list with simplified national formats. Use libphonenumber for full validation. */
export const phoneCountries: PhoneCountry[] = [
  { code: "AU", name: "Australia", dial: "61", format: "### ### ###", minDigits: 9 },
  { code: "BR", name: "Brazil", dial: "55", format: "(##) #####-####", minDigits: 10 },
  { code: "CA", name: "Canada", dial: "1", format: "(###) ###-####", minDigits: 10 },
  { code: "FR", name: "France", dial: "33", format: "# ## ## ## ##", minDigits: 9 },
  { code: "DE", name: "Germany", dial: "49", format: "### ########", minDigits: 10 },
  { code: "IN", name: "India", dial: "91", format: "##### #####", minDigits: 10 },
  { code: "ID", name: "Indonesia", dial: "62", format: "###-####-#####", minDigits: 9 },
  { code: "JP", name: "Japan", dial: "81", format: "##-####-####", minDigits: 10 },
  { code: "MY", name: "Malaysia", dial: "60", format: "##-#### ####", minDigits: 9 },
  { code: "NL", name: "Netherlands", dial: "31", format: "# ## ## ## ##", minDigits: 9 },
  { code: "PH", name: "Philippines", dial: "63", format: "### ### ####", minDigits: 10 },
  { code: "SG", name: "Singapore", dial: "65", format: "#### ####", minDigits: 8 },
  { code: "TH", name: "Thailand", dial: "66", format: "## ### ####", minDigits: 9 },
  { code: "AE", name: "United Arab Emirates", dial: "971", format: "## ### ####", minDigits: 9 },
  { code: "GB", name: "United Kingdom", dial: "44", format: "#### ######", minDigits: 10 },
  { code: "US", name: "United States", dial: "1", format: "(###) ###-####", minDigits: 10 },
  { code: "VN", name: "Vietnam", dial: "84", format: "### ### ###", minDigits: 9 },
];

export interface PhoneDetails {
  /** ISO code of the selected country. */
  country: string;
  /** Calling code without "+". */
  dialCode: string;
  /** Digits after the calling code. */
  nationalNumber: string;
  /** True once the number has the country's minimum digit count. */
  complete: boolean;
}

export interface PhoneInputProps
  extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "size"> {
  /** Controlled number in E.164 format, e.g. "+15551234567". */
  value?: string;
  /** Initial number in E.164 format when uncontrolled. */
  defaultValue?: string;
  /** Called with the E.164 number ("" when empty) and parsed details. */
  onValueChange?: (value: string, details: PhoneDetails) => void;
  /** Country selected when there is no initial number. @default "US" */
  defaultCountry?: string;
  /** Limit and order the selectable countries by ISO code. @default every country in phoneCountries */
  countries?: string[];
  /** Classes for the outer field. */
  className?: string;
}

const flag = (code: string) => String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
const digitsOf = (text: string) => text.replace(/\D/g, "");
const maxDigits = (country: PhoneCountry) => country.format.split("#").length - 1;

function formatNational(digits: string, pattern: string) {
  let out = "";
  let i = 0;
  for (const ch of pattern) {
    if (i >= digits.length) break;
    out += ch === "#" ? digits[i++] : ch;
  }
  return out;
}

function caretAfterDigits(formatted: string, count: number) {
  if (count <= 0) return formatted.search(/\d/) === -1 ? formatted.length : formatted.search(/\d/);
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i]) && ++seen === count) return i + 1;
  }
  return formatted.length;
}

/** "+6281234567890" → Indonesia + "81234567890". Prefers `preferred` when calling codes are shared (+1). */
function parseE164(value: string | undefined, list: PhoneCountry[], preferred?: string) {
  if (!value) return null;
  const digits = digitsOf(value);
  const matches = list
    .filter((c) => digits.startsWith(c.dial))
    .sort((a, b) => b.dial.length - a.dial.length || Number(b.code === preferred) - Number(a.code === preferred));
  const country = matches[0];
  return country ? { country, national: digits.slice(country.dial.length).slice(0, maxDigits(country)) } : null;
}

export function PhoneInput({
  value,
  defaultValue,
  onValueChange,
  defaultCountry = "US",
  countries,
  className,
  disabled,
  placeholder,
  "aria-label": ariaLabel,
  ...props
}: PhoneInputProps) {
  const list = useMemo(
    () =>
      countries
        ? countries.map((code) => phoneCountries.find((c) => c.code === code)).filter((c): c is PhoneCountry => Boolean(c))
        : phoneCountries,
    [countries],
  );
  const fallback = list.find((c) => c.code === defaultCountry) ?? list[0];
  const initial = parseE164(value ?? defaultValue, list, defaultCountry);
  const [country, setCountry] = useState(initial?.country ?? fallback);
  const [digits, setDigits] = useState(initial?.national ?? "");
  const [syncedValue, setSyncedValue] = useState(value);
  const [, forceRender] = useState(0);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();
  const listId = useId();
  const groupId = useId();

  // Follow a controlled value when it differs from what is typed.
  if (value !== undefined && value !== syncedValue) {
    setSyncedValue(value);
    const current = digits ? `+${country.dial}${digits}` : "";
    if (value !== current) {
      const parsed = parseE164(value, list, country.code);
      setDigits(parsed?.national ?? "");
      if (parsed) setCountry(parsed.country);
    }
  }

  const formatted = formatNational(digits, country.format);
  const complete = digits.length >= country.minDigits;

  useLayoutEffect(() => {
    if (pendingCaret.current !== null && inputRef.current && document.activeElement === inputRef.current) {
      inputRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
    }
    pendingCaret.current = null;
  });

  function emit(nextCountry: PhoneCountry, nextDigits: string) {
    onValueChange?.(nextDigits ? `+${nextCountry.dial}${nextDigits}` : "", {
      country: nextCountry.code,
      dialCode: nextCountry.dial,
      nationalNumber: nextDigits,
      complete: nextDigits.length >= nextCountry.minDigits,
    });
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const raw = input.value;
    const caret = input.selectionStart ?? raw.length;

    // A pasted international number switches the country.
    if (raw.trim().startsWith("+")) {
      const parsed = parseE164(raw, list, country.code);
      if (parsed) {
        setCountry(parsed.country);
        setDigits(parsed.national);
        pendingCaret.current = formatNational(parsed.national, parsed.country.format).length;
        emit(parsed.country, parsed.national);
        return;
      }
    }

    let next = digitsOf(raw);
    let digitsBeforeCaret = digitsOf(raw.slice(0, caret)).length;
    const deleting = (event.nativeEvent as InputEvent).inputType === "deleteContentBackward";
    if (deleting && next === digits && digitsBeforeCaret > 0) {
      // Backspace hit a separator: delete the digit before it instead.
      next = next.slice(0, digitsBeforeCaret - 1) + next.slice(digitsBeforeCaret);
      digitsBeforeCaret -= 1;
    }
    // Drop a national trunk 0 (e.g. 0812… in Indonesia); +1 countries have none.
    if (country.dial !== "1" && next.startsWith("0") && !digits.startsWith("0")) {
      next = next.slice(1);
      digitsBeforeCaret = Math.max(0, digitsBeforeCaret - 1);
    }
    next = next.slice(0, maxDigits(country));

    pendingCaret.current = caretAfterDigits(formatNational(next, country.format), digitsBeforeCaret);
    if (next === digits) {
      // React restores the old text without re-rendering; render anyway so the caret is restored too.
      forceRender((n) => n + 1);
      return;
    }
    setDigits(next);
    emit(country, next);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, "");
    if (!q) return list;
    return list.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q || c.dial.startsWith(q));
  }, [list, query]);

  function choose(next: PhoneCountry) {
    const trimmed = digits.slice(0, maxDigits(next));
    setCountry(next);
    setDigits(trimmed);
    setOpen(false);
    emit(next, trimmed);
  }

  function onSearchKey(event: KeyboardEvent<HTMLInputElement>) {
    if (!filtered.length) return;
    const moves: Record<string, number> = {
      ArrowDown: (active + 1) % filtered.length,
      ArrowUp: (active - 1 + filtered.length) % filtered.length,
      Home: 0,
      End: filtered.length - 1,
    };
    if (event.key in moves) {
      event.preventDefault();
      setActive(moves[event.key]);
      document.getElementById(`${listId}-${moves[event.key]}`)?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(filtered[active]);
    }
  }

  const swap = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 8, filter: "blur(3px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -8, filter: "blur(3px)" },
      };

  return (
    <div
      className={cn(
        "flex h-10 w-full items-stretch rounded-md border border-input bg-background text-sm text-foreground shadow-xs",
        "transition-[border-color,box-shadow] duration-150 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20",
        "has-[input[aria-invalid=true]]:border-destructive",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <Popover.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            setQuery("");
            setActive(Math.max(0, list.indexOf(country)));
          }
        }}
      >
        <Popover.Trigger
          disabled={disabled}
          // Starts with the visible dial code, as the visible label should lead the accessible name.
          aria-label={`+${country.dial}, ${country.name} country code`}
          aria-haspopup="listbox"
          className="relative flex shrink-0 cursor-pointer items-center gap-1.5 overflow-hidden rounded-l-[calc(var(--radius)-1px)] border-r border-input pr-2 pl-3 outline-none transition-colors hover:bg-accent focus-visible:bg-accent"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={country.code}
              variants={swap}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: duration.quick, ease: ease.out }}
              className="flex items-center gap-1.5"
            >
              {/* Drawn with CSS content, so the button's visible text is just the dial code (which is in its name). */}
              <span className="text-base leading-none before:content-[attr(data-flag)]" data-flag={flag(country.code)} aria-hidden="true" />
              <span className="text-muted-foreground tabular-nums">+{country.dial}</span>
            </motion.span>
          </AnimatePresence>
          <ChevronDown
            aria-hidden="true"
            className={cn("size-3.5 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
          />
        </Popover.Trigger>
        <AnimatePresence>
          {open ? (
            <Popover.Portal forceMount>
              <Popover.Content
                forceMount
                asChild
                align="start"
                sideOffset={6}
                collisionPadding={12}
                onOpenAutoFocus={(event) => {
                  event.preventDefault();
                  searchRef.current?.focus();
                }}
                onCloseAutoFocus={(event) => {
                  event.preventDefault();
                  inputRef.current?.focus();
                }}
              >
                <motion.div
                  variants={overlayVariants(reduceMotion)}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{ transformOrigin: "var(--radix-popover-content-transform-origin)" }}
                  className="z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-[10px] border border-border bg-popover text-popover-foreground shadow-lg outline-none"
                >
                  <div className="flex items-center gap-2 border-b border-border px-3">
                    <Search className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <input
                      ref={searchRef}
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setActive(0);
                      }}
                      onKeyDown={onSearchKey}
                      role="combobox"
                      aria-expanded="true"
                      aria-controls={listId}
                      aria-activedescendant={filtered.length ? `${listId}-${active}` : undefined}
                      aria-label="Search countries"
                      placeholder="Search countries…"
                      className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  <LayoutGroup id={groupId}>
                    <div id={listId} role="listbox" aria-label="Countries" className="max-h-64 overflow-y-auto overscroll-contain p-1">
                      {filtered.length === 0 ? (
                        <p className="px-2.5 py-6 text-center text-[13px] text-muted-foreground">No countries found.</p>
                      ) : (
                        filtered.map((option, index) => {
                          const highlighted = index === active;
                          const selected = option.code === country.code;
                          return (
                            <div
                              key={option.code}
                              id={`${listId}-${index}`}
                              role="option"
                              aria-selected={highlighted}
                              onPointerMove={() => !highlighted && setActive(index)}
                              onClick={() => choose(option)}
                              className="relative flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-[13px]"
                            >
                              {highlighted ? (
                                <motion.span
                                  layoutId="active-row"
                                  transition={reduceMotion ? { duration: 0 } : spring.snappy}
                                  className="absolute inset-0 rounded-md bg-accent"
                                />
                              ) : null}
                              <span className="relative text-base leading-none" aria-hidden="true">
                                {flag(option.code)}
                              </span>
                              <span className="relative min-w-0 flex-1 truncate text-foreground">{option.name}</span>
                              <span className="relative text-muted-foreground tabular-nums">+{option.dial}</span>
                              <Check
                                aria-hidden="true"
                                className={cn("relative size-3.5 text-foreground", selected ? "opacity-100" : "opacity-0")}
                              />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </LayoutGroup>
                </motion.div>
              </Popover.Content>
            </Popover.Portal>
          ) : null}
        </AnimatePresence>
      </Popover.Root>

      <span className="relative flex min-w-0 flex-1 items-center">
        <input
          ref={inputRef}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={formatted}
          onChange={handleChange}
          disabled={disabled}
          aria-label={ariaLabel ?? (props["aria-labelledby"] ? undefined : "Phone number")}
          placeholder={placeholder ?? formatNational("2015550123456789".slice(0, maxDigits(country)), country.format)}
          className="h-full w-full min-w-0 bg-transparent pr-9 pl-3 tabular-nums outline-none placeholder:text-muted-foreground/70"
          {...props}
        />
        <AnimatePresence>
          {complete ? (
            <motion.span
              aria-hidden="true"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.5 }}
              transition={reduceMotion ? { duration: duration.quick } : spring.bouncy}
              className="pointer-events-none absolute right-3 text-success"
            >
              <svg viewBox="0 0 24 24" fill="none" className="size-4">
                <motion.path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  stroke="currentColor"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: reduceMotion ? 1 : 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: duration.base, ease: ease.out }}
                />
              </svg>
            </motion.span>
          ) : null}
        </AnimatePresence>
      </span>
    </div>
  );
}
