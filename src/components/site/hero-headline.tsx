import { Fragment, type CSSProperties } from "react";

/**
 * Words blur in one by one and the last word gets a hand-drawn underline.
 * Pure CSS so it plays on first paint, before hydration (keeps LCP fast).
 */
export function HeroHeadline({ words, emphasis }: { words: string[]; emphasis: string }) {
  return (
    <h1 className="text-[2.8rem] leading-[1.02] font-semibold tracking-[-0.04em] text-balance text-foreground sm:text-7xl lg:text-[5.75rem]">
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="hero-word inline-block" style={{ "--i": i } as CSSProperties}>
            {word}
          </span>{" "}
        </Fragment>
      ))}
      <span className="hero-word relative inline-block" style={{ "--i": words.length } as CSSProperties}>
        {emphasis}
        <svg
          aria-hidden="true"
          viewBox="0 0 220 22"
          preserveAspectRatio="none"
          className="absolute -bottom-[0.18em] left-[-2%] h-[0.32em] w-[104%] overflow-visible text-primary"
        >
          <path
            className="hero-underline"
            pathLength={1}
            d="M3 15.5C48 6.5 120 3.5 217 9.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            style={{ "--delay": `${words.length * 60 + 380}ms` } as CSSProperties}
          />
        </svg>
      </span>
    </h1>
  );
}
