"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import { GitCommitHorizontal, Package, Rocket, Smartphone, Server } from "lucide-react";
import { AnimatedBeam } from "@/components/ui/animated-beam/animated-beam";

function Node({ nodeRef, label, children }: { nodeRef: RefObject<HTMLDivElement | null>; label: string; children: ReactNode }) {
  return (
    <div className="z-10 flex flex-col items-center gap-2">
      <div ref={nodeRef} className="grid size-14 place-items-center rounded-2xl border border-border bg-background text-foreground shadow-sm [&_svg]:size-6">
        {children}
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

export function Pipeline() {
  const container = useRef<HTMLDivElement>(null);
  const commit = useRef<HTMLDivElement>(null);
  const build = useRef<HTMLDivElement>(null);
  const deploy = useRef<HTMLDivElement>(null);
  return (
    <div ref={container} className="relative flex w-full max-w-lg items-center justify-between px-6 py-10">
      <Node nodeRef={commit} label="Commit">
        <GitCommitHorizontal aria-hidden="true" />
      </Node>
      <Node nodeRef={build} label="Build">
        <Package aria-hidden="true" />
      </Node>
      <Node nodeRef={deploy} label="Deploy">
        <Rocket aria-hidden="true" />
      </Node>
      <AnimatedBeam containerRef={container} fromRef={commit} toRef={build} curvature={30} startYOffset={-12} endYOffset={-12} />
      <AnimatedBeam containerRef={container} fromRef={build} toRef={deploy} curvature={30} startYOffset={-12} endYOffset={-12} delay={1.5} />
    </div>
  );
}

export function TwoWay() {
  const container = useRef<HTMLDivElement>(null);
  const phone = useRef<HTMLDivElement>(null);
  const server = useRef<HTMLDivElement>(null);
  return (
    <div ref={container} className="relative flex w-full max-w-md items-center justify-between px-6 py-12">
      <Node nodeRef={phone} label="App">
        <Smartphone aria-hidden="true" />
      </Node>
      <Node nodeRef={server} label="API">
        <Server aria-hidden="true" />
      </Node>
      <AnimatedBeam containerRef={container} fromRef={phone} toRef={server} curvature={36} startYOffset={-12} endYOffset={-12} duration={2.4} />
      <AnimatedBeam
        containerRef={container}
        fromRef={phone}
        toRef={server}
        curvature={-36}
        startYOffset={-12}
        endYOffset={-12}
        reverse
        duration={2.4}
        delay={1.2}
        gradientStartColor="#16A34A"
        gradientStopColor="#14B8A6"
      />
    </div>
  );
}
