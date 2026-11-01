"use client";

import { MeshGradient } from "@/components/ui/mesh-gradient/mesh-gradient";

export function Default() {
  return (
    <MeshGradient className="grid h-72 w-full max-w-xl place-items-center rounded-2xl">
      <div className="text-center">
        <p className="text-sm font-medium text-slate-700">Introducing Canvas</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Soft focus, sharp work</p>
      </div>
    </MeshGradient>
  );
}

export function Sunset() {
  return <MeshGradient className="h-60 w-full max-w-md rounded-2xl" colors={["#FED7AA", "#FBCFE8", "#DDD6FE", "#FEF3C7"]} speed={1.6} />;
}
