"use client";

import { useState } from "react";
import { HtmlCanvasDemo } from "@/components/site/html-canvas-demo";
import { LivingBook } from "@/components/ui/living-book/living-book";

const page = "flex size-full flex-col p-6 font-serif text-[13px] leading-6";

function Signup() {
  const [done, setDone] = useState(false);
  return (
    <div className={page}>
      <p className="text-[11px] tracking-[0.2em] text-[#8a8274] uppercase">Colophon</p>
      <p className="mt-3">Want the next volume when it is printed?</p>
      {done ? (
        <p role="status" className="mt-4 font-sans text-[13px] font-medium text-[#2f6b3a]">
          Thanks, we&apos;ll write.
        </p>
      ) : (
        <form
          className="mt-4 flex flex-col gap-2 font-sans"
          onSubmit={(e) => {
            e.preventDefault();
            setDone(true);
          }}
        >
          <label className="text-[12px] font-medium" htmlFor="book-email">
            Email
          </label>
          <input id="book-email" type="email" required placeholder="you@studio.dev" className="h-9 rounded-md border border-[#d8d1c4] bg-white px-2.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]" />
          <button type="submit" className="h-9 cursor-pointer rounded-md bg-[#2a2723] text-[13px] font-medium text-white">
            Notify me
          </button>
        </form>
      )}
      <p className="mt-auto text-center text-[11px] text-[#8a8274]">6</p>
    </div>
  );
}

const pages = [
  <div key="1" className={`${page} items-center justify-center text-center`}>
    <p className="text-[11px] tracking-[0.25em] text-[#8a8274] uppercase">A field guide</p>
    <p className="mt-3 text-2xl leading-8 font-semibold">Pages That Stay Alive</p>
    <p className="mt-3 text-[12px] text-[#8a8274]">Select any line. Follow any link.</p>
  </div>,
  <div key="2" className={page}>
    <p className="text-[11px] tracking-[0.2em] text-[#8a8274] uppercase">I · Paper</p>
    <p className="mt-3">Every page in this book is ordinary HTML. The canvas only borrows its pixels to bend them, so the words remain words: you can select this sentence and copy it.</p>
    <p className="mt-auto text-center text-[11px] text-[#8a8274]">2</p>
  </div>,
  <div key="3" className={page}>
    <p className="text-[11px] tracking-[0.2em] text-[#8a8274] uppercase">II · Ink</p>
    <p className="mt-3">
      Links work too. Read the{" "}
      <a href="https://github.com/WICG/html-in-canvas" target="_blank" rel="noreferrer" className="underline underline-offset-2">
        HTML-in-Canvas proposal
      </a>{" "}
      to see how a page can be drawn, warped and still be clicked.
    </p>
    <p className="mt-auto text-center text-[11px] text-[#8a8274]">3</p>
  </div>,
  <div key="4" className={page}>
    <div className="h-36 rounded-md bg-[radial-gradient(circle_at_30%_30%,#fde68a,#f59e0b_40%,#7c2d12)]" />
    <p className="mt-3 text-[12px] text-[#8a8274] italic">Plate 1. A sun, painted with CSS.</p>
    <p className="mt-auto text-center text-[11px] text-[#8a8274]">4</p>
  </div>,
  <div key="5" className={page}>
    <p className="text-[11px] tracking-[0.2em] text-[#8a8274] uppercase">III · Binding</p>
    <p className="mt-3">Turn with the arrow keys, the buttons below, or by dragging a page by its outer edge. The spine darkens where the paper curves in.</p>
    <p className="mt-auto text-center text-[11px] text-[#8a8274]">5</p>
  </div>,
  <Signup key="6" />,
];

export function Default() {
  return (
    <HtmlCanvasDemo>
      {({ rendering, onModeChange }) => <LivingBook pages={pages} label="A field guide" rendering={rendering} onModeChange={onModeChange} />}
    </HtmlCanvasDemo>
  );
}
