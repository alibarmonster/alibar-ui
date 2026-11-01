"use client";

import { MatrixLoader, type MatrixPattern } from "@/components/ui/matrix-loader/matrix-loader";

const PATTERNS: MatrixPattern[] = ["wave", "diagonal", "spiral", "pulse", "rain"];

export function Default() {
  return (
    <div className="grid grid-cols-3 gap-8 sm:grid-cols-5">
      {PATTERNS.map((pattern) => (
        <div key={pattern} className="flex flex-col items-center gap-3">
          <MatrixLoader pattern={pattern} label={`Loading (${pattern})`} className="text-foreground" />
          <span className="text-xs text-muted-foreground">{pattern}</span>
        </div>
      ))}
    </div>
  );
}

export function InButton() {
  return (
    <button type="button" disabled className="inline-flex h-10 items-center gap-2.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm">
      <MatrixLoader pattern="spiral" dotSize={3} gap={2} cycle={1.1} label="Generating" />
      Generating image
    </button>
  );
}
