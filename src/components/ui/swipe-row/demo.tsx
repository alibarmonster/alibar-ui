"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Archive, Flag, RotateCcw, Trash2 } from "lucide-react";
import { SwipeRow } from "@/components/ui/swipe-row/swipe-row";

const MAIL = [
  { id: "1", from: "Maya Chen", subject: "Motion review notes", preview: "Loved the new dock. Two small things on the spring…", time: "9:41" },
  { id: "2", from: "Northwind Billing", subject: "Your invoice for October", preview: "Invoice #4821 is ready. Total due: $2,400.00", time: "8:12" },
  { id: "3", from: "Omar Haddad", subject: "Pairing tomorrow?", preview: "I can do 10 or 2. Bring the flaky test.", time: "Yesterday" },
  { id: "4", from: "Lena Fischer", subject: "Data export is ready", preview: "Your CSV with 12,480 rows has finished.", time: "Mon" },
];

export function Default() {
  const [mail, setMail] = useState(MAIL);
  const [log, setLog] = useState("");
  const remove = (id: string, verb: string) => {
    setMail((m) => m.filter((x) => x.id !== id));
    setLog(`${verb} “${MAIL.find((x) => x.id === id)?.subject}”`);
  };
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ul className="overflow-hidden rounded-xl border border-border">
        <AnimatePresence initial={false}>
          {mail.map((m) => (
            // The grid-rows collapse closes the gap once a row is removed.
            <motion.li
              key={m.id}
              className="grid border-b border-border last:border-b-0"
              initial={false}
              exit={{ gridTemplateRows: "0fr", opacity: 0 }}
              style={{ gridTemplateRows: "1fr" }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="min-h-0">
                <SwipeRow
                  leftActions={[{ id: "archive", label: "Archive", icon: <Archive />, tone: "success", onAction: () => remove(m.id, "Archived") }]}
                  rightActions={[
                    { id: "delete", label: "Delete", icon: <Trash2 />, tone: "destructive", onAction: () => remove(m.id, "Deleted") },
                    { id: "flag", label: "Flag", icon: <Flag />, onAction: () => setLog(`Flagged “${m.subject}”`) },
                  ]}
                >
                  <a href={`#mail-${m.id}`} onClick={(e) => e.preventDefault()} className="block px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-foreground">{m.from}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{m.time}</span>
                    </div>
                    <p className="truncate text-sm text-foreground">{m.subject}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.preview}</p>
                  </a>
                </SwipeRow>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span aria-live="polite">{log || "Swipe a row left or right, or Tab to its actions."}</span>
        <button type="button" onClick={() => { setMail(MAIL); setLog(""); }} className="inline-flex shrink-0 cursor-pointer items-center gap-1 hover:text-foreground">
          <RotateCcw className="size-3" aria-hidden="true" />
          Reset
        </button>
      </div>
    </div>
  );
}
