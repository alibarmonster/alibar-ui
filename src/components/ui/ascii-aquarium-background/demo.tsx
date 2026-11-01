"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { DemoStateSwitcher } from "@/components/site/demo-state-switcher";
import {
  AsciiAquariumBackground,
  type AquariumMode,
  type AsciiAquariumHandle,
} from "@/components/ui/ascii-aquarium-background/ascii-aquarium-background";

const SUGGESTIONS = ["How do rays glide?", "Name my aquarium", "Explain bioluminescence"];

const ANSWERS = [
  "Rays flap their wide pectoral fins like slow wings, so they glide with very little effort.",
  "How about “Grid Reef”? Every fish swims on graph paper.",
  "Some sea creatures make light with a chemical reaction, which they use to hunt, hide or find each other.",
];

export function ChatHero() {
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [status, setStatus] = useState<"idle" | "thinking" | "answered">("idle");
  const [exchange, setExchange] = useState({ question: "", answer: "" });

  useEffect(() => () => clearTimeout(timer.current), []);

  const thinking = status === "thinking";
  const mode: AquariumMode = thinking ? "thinking" : focused || value ? "listening" : "idle";

  const ask = (question: string) => {
    const text = question.trim();
    if (!text || thinking) return;
    setValue("");
    setStatus("thinking");
    setExchange({ question: text, answer: "" });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const known = SUGGESTIONS.indexOf(text);
      setExchange({ question: text, answer: ANSWERS[known >= 0 ? known : text.length % ANSWERS.length] });
      setStatus("answered");
    }, 2600);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    ask(value);
  };

  return (
    <AsciiAquariumBackground
      focusRef={form}
      mode={mode}
      className="flex min-h-[30rem] w-full flex-col items-center justify-center rounded-xl border border-border px-4 py-12"
    >
      <div className="flex w-full max-w-lg flex-col items-center text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/85 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
          <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
          Reef assistant
        </span>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">What should we explore?</h2>
        <p className="mt-2 max-w-sm rounded-md bg-background/70 px-1.5 text-[15px] text-balance text-muted-foreground backdrop-blur-sm">
          Start typing and the ray swims over to listen.
        </p>

        <form
          ref={form}
          onSubmit={submit}
          className="mt-6 flex w-full items-center gap-2 rounded-2xl border border-border bg-background p-1.5 pl-4 shadow-lg shadow-black/5 focus-within:ring-2 focus-within:ring-ring"
        >
          <label htmlFor={`${id}-ask`} className="sr-only">
            Ask anything
          </label>
          <input
            id={`${id}-ask`}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Ask anything…"
            autoComplete="off"
            className="h-10 min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!value.trim() || thinking}
            aria-label="Send"
            className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl bg-foreground text-background transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowUp className="size-4" aria-hidden="true" />
          </button>
        </form>

        <div className="mt-4 flex min-h-28 w-full flex-col items-center">
          <div aria-live="polite" className="w-full">
            {thinking ? (
              <p className="inline-flex items-center gap-2 rounded-full bg-background/85 px-3 py-1 text-sm text-muted-foreground backdrop-blur-sm">
                <span className="size-1.5 animate-pulse rounded-full bg-primary motion-reduce:animate-none" aria-hidden="true" />
                Thinking…
              </p>
            ) : status === "answered" ? (
              <div className="rounded-xl border border-border bg-background/90 p-3.5 text-left text-sm shadow-sm backdrop-blur-sm">
                <p className="font-medium text-foreground">{exchange.question}</p>
                <p className="mt-1 leading-6 text-muted-foreground">{exchange.answer}</p>
              </div>
            ) : null}
          </div>
          {status === "idle" ? (
            <div className="flex flex-wrap justify-center gap-1.5">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => ask(suggestion)}
                  className="h-8 cursor-pointer rounded-full border border-border bg-background/85 px-3 text-[13px] text-muted-foreground backdrop-blur-sm transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </AsciiAquariumBackground>
  );
}

const MODES = ["idle", "listening", "thinking"] as const;

export function DarkModes() {
  const aquarium = useRef<AsciiAquariumHandle>(null);
  const orb = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<AquariumMode>("listening");

  const choose = (next: AquariumMode) => {
    setMode(next);
    aquarium.current?.setMode(next);
  };

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <AsciiAquariumBackground
        ref={aquarium}
        palette="dark"
        focusRef={orb}
        mode="listening"
        creatures={{ rays: 1, jellyfish: 4, schools: 1 }}
        className="grid h-96 w-full place-items-center rounded-xl"
      >
        <div ref={orb} className="flex items-center gap-2.5 rounded-full border border-white/15 bg-zinc-950/80 py-2 pr-4 pl-2.5 backdrop-blur-sm">
          <span className="grid size-7 place-items-center rounded-full bg-blue-400/15">
            <Sparkles className="size-3.5 text-blue-300" aria-hidden="true" />
          </span>
          <span className="text-sm font-medium text-zinc-100 capitalize">{mode}</span>
        </div>
      </AsciiAquariumBackground>
      <DemoStateSwitcher states={MODES} value={mode} onChange={choose} label="Aquarium mode" />
    </div>
  );
}

export function Bare() {
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <AsciiAquariumBackground className="h-80 w-full rounded-xl border border-border" />
      <p className="text-[13px] text-muted-foreground">Click the water.</p>
    </div>
  );
}
