"use client";

import { useState } from "react";
import { AnnotatedText, type AnnotationType } from "@/components/ui/annotated-text/annotated-text";

export function Default() {
  return (
    <p className="max-w-lg text-center text-xl leading-relaxed font-medium tracking-tight text-foreground sm:text-2xl">
      Ship <AnnotatedText type="underline">components</AnnotatedText> that feel{" "}
      <AnnotatedText type="highlight" delay={0.7}>
        handcrafted
      </AnnotatedText>
      , not <AnnotatedText type="strike" delay={1.4} color="var(--destructive)">generated</AnnotatedText>. Then{" "}
      <AnnotatedText type="circle" delay={2} iterations={2}>
        measure
      </AnnotatedText>{" "}
      what matters.
    </p>
  );
}

const TYPES: AnnotationType[] = ["underline", "highlight", "circle", "box", "strike", "bracket"];

export function AllTypes() {
  return (
    <ul className="grid w-full max-w-md grid-cols-2 gap-x-8 gap-y-7 text-base font-medium text-foreground sm:grid-cols-3">
      {TYPES.map((type, i) => (
        <li key={type} className="text-center">
          <AnnotatedText type={type} delay={i * 0.25}>
            {type}
          </AnnotatedText>
        </li>
      ))}
    </ul>
  );
}

const control =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs transition-colors hover:bg-accent";

export function Manual() {
  const [show, setShow] = useState(false);
  return (
    <div className="flex max-w-md flex-col items-center gap-5 text-center">
      <p className="text-lg leading-relaxed text-foreground">
        Our refund policy is simple:{" "}
        <AnnotatedText type="highlight" trigger="manual" show={show} duration={0.6}>
          cancel within 30 days and we return every cent, no questions asked
        </AnnotatedText>
        .
      </p>
      <button type="button" className={control} aria-pressed={show} onClick={() => setShow((s) => !s)}>
        {show ? "Clear highlight" : "Highlight the key part"}
      </button>
    </div>
  );
}
