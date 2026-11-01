import { useEffect, useRef } from "react";
import type { GalleryItem } from "@/lib/gallery/types";

export interface GalleryA11yProps {
  items: GalleryItem[];
  /** Active item. */
  index: number;
  /** Names the list, e.g. "Album covers". */
  label: string;
  /** Focusing an item's button (Tab, screen reader cursor) moves the gallery to it. */
  onFocusItem?: (index: number) => void;
  /** Clicking an item's button or pressing Enter on it. */
  onActivate?: (index: number) => void;
  /** Announce index changes politely. Turn off while autoplay runs so it doesn't talk over the user. @default true */
  live?: boolean;
}

const describe = (item: GalleryItem, index: number, total: number) =>
  [`${index + 1} of ${total}`, item.title, item.subtitle, item.alt].filter(Boolean).join(". ");

/**
 * The accessible side of a canvas gallery: a visually hidden list of buttons, one per item, kept
 * in sync with the active index (roving tabindex, focus follows arrow keys), plus a polite live
 * region that names the active item. The canvas itself stays aria-hidden.
 */
export function GalleryA11y({ items, index, label, onFocusItem, onActivate, live = true }: GalleryA11yProps) {
  const list = useRef<HTMLUListElement>(null);

  // When the active item changes while focus is in the list (arrow keys), move focus with it.
  useEffect(() => {
    const element = list.current;
    if (!element || !element.contains(document.activeElement)) return;
    element.querySelectorAll<HTMLButtonElement>("button")[index]?.focus({ preventScroll: true });
  }, [index]);

  const active = items[index];
  return (
    <div className="sr-only">
      <ul ref={list} aria-label={label}>
        {items.map((item, i) => (
          <li key={`${item.src}-${i}`}>
            <button
              type="button"
              tabIndex={i === index ? 0 : -1}
              aria-current={i === index ? "true" : undefined}
              onFocus={() => {
                if (i !== index) onFocusItem?.(i);
              }}
              onClick={() => onActivate?.(i)}
            >
              {describe(item, i, items.length)}
            </button>
          </li>
        ))}
      </ul>
      <p aria-live={live ? "polite" : "off"} aria-atomic="true">
        {active ? `${active.title ?? active.alt}, ${index + 1} of ${items.length}` : ""}
      </p>
    </div>
  );
}
