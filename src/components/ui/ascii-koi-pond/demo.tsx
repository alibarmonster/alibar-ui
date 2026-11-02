"use client";

import { useState } from "react";
import { AsciiKoiPond } from "@/components/ui/ascii-koi-pond/ascii-koi-pond";

export function Hero() {
  return (
    <AsciiKoiPond className="h-[460px] w-full rounded-2xl border border-border">
      <div className="pointer-events-none flex h-full flex-col justify-end p-8 font-mono">
        <p className="text-[12px] text-[#8f8b80]">still water, slow work</p>
        <h3 className="mt-3 text-xl font-medium text-[#2b2a27]">Hi, I build quiet interfaces.</h3>
        <p className="mt-2 max-w-md text-[13px] leading-6 text-[#5d5a52]">
          Move the cursor and the koi come to look. Click the water to feed them.{" "}
          <a href="#" onClick={(e) => e.preventDefault()} className="pointer-events-auto underline underline-offset-4">
            Read the notes
          </a>
        </p>
      </div>
    </AsciiKoiPond>
  );
}

export function Night() {
  const [fed, setFed] = useState(0);
  return (
    <AsciiKoiPond palette="dark" koi={7} lilyPads={4} className="h-[460px] w-full rounded-2xl" onFeed={setFed}>
      <div className="pointer-events-none flex h-full items-end p-8 font-mono">
        <p className="text-[13px] text-[#c9c6bf]">{fed === 0 ? "Click the water to drop food." : `The koi have eaten ${fed} ${fed === 1 ? "pellet" : "pellets"}.`}</p>
      </div>
    </AsciiKoiPond>
  );
}

export function Custom() {
  return (
    <AsciiKoiPond
      koi={3}
      cell={18}
      lilyPads={2}
      showCounter={false}
      palette={{ base: "light", background: "#eef6f4", body: "#dbe6e3", line: "#a9c4bd", patch: "#f0b43c", patchDeep: "#e07a2c" }}
      className="h-[360px] w-full rounded-2xl"
    />
  );
}
