"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Open/close state for a navbar's menus: one menu open at a time, opened by click or by hover with a
 * short intent delay, closed by Escape (focus returns to its trigger), an outside click, or the
 * pointer leaving the navbar.
 */
export function useMenu(root: RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState<string | null>(null);
  const timer = useRef(0);
  const triggers = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      triggers.current.get(open)?.focus();
      setOpen(null);
    };
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open, root]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const hoverOpen = (id: string) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(id), open ? 0 : 90);
  };
  const hoverClose = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(null), 160);
  };
  const cancelClose = () => window.clearTimeout(timer.current);

  /** Props for a menu trigger button. */
  const triggerProps = (id: string, panelId: string) => ({
    ref: (el: HTMLElement | null) => {
      if (el) triggers.current.set(id, el);
      else triggers.current.delete(id);
    },
    "aria-expanded": open === id,
    "aria-controls": panelId,
    onClick: () => setOpen((o) => (o === id ? null : id)),
    onPointerEnter: (e: React.PointerEvent) => e.pointerType === "mouse" && hoverOpen(id),
    onPointerLeave: (e: React.PointerEvent) => e.pointerType === "mouse" && hoverClose(),
  });

  /** Props for a menu panel, so moving onto it keeps it open. */
  const panelProps = {
    onPointerEnter: cancelClose,
    onPointerLeave: (e: React.PointerEvent) => e.pointerType === "mouse" && hoverClose(),
  };

  return { open, setOpen, triggerProps, panelProps, close: () => setOpen(null) };
}
