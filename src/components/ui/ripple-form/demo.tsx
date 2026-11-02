"use client";

import { HtmlCanvasDemo } from "@/components/site/html-canvas-demo";
import { RippleForm } from "@/components/ui/ripple-form/ripple-form";

export function Default() {
  return (
    <HtmlCanvasDemo>
      {({ rendering, onModeChange }) => (
        <RippleForm rendering={rendering} onModeChange={onModeChange} onSubmit={() => new Promise((resolve) => window.setTimeout(resolve, 700))} />
      )}
    </HtmlCanvasDemo>
  );
}

export function Validation() {
  return (
    <HtmlCanvasDemo>
      {({ rendering, onModeChange }) => (
        <RippleForm
          rendering={rendering}
          onModeChange={onModeChange}
          title="Get the beta"
          description="Any address ending in @example.com is rejected, to show the error state."
          submitLabel="Send invite"
          waterColor="#0d9488"
          strength={1.4}
          onSubmit={(values) =>
            new Promise<void>((resolve, reject) =>
              window.setTimeout(() => (values.email.endsWith("@example.com") ? reject(new Error("That address can't receive invites. Try another.")) : resolve()), 700),
            )
          }
        />
      )}
    </HtmlCanvasDemo>
  );
}
