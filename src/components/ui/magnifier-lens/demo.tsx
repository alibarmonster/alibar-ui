"use client";

import { HtmlCanvasDemo } from "@/components/site/html-canvas-demo";
import { MagnifierLens } from "@/components/ui/magnifier-lens/magnifier-lens";

const plans = [
  { name: "Starter", price: "$0", seats: "1 seat", storage: "2 GB", support: "Community" },
  { name: "Team", price: "$24", seats: "Up to 10", storage: "100 GB", support: "Email, 1 day" },
  { name: "Scale", price: "$79", seats: "Unlimited", storage: "1 TB", support: "Chat, 2 hours" },
];

export function Default() {
  return (
    <HtmlCanvasDemo>
      {({ rendering, onModeChange }) => (
        <MagnifierLens rendering={rendering} onModeChange={onModeChange} className="max-w-lg">
          <div className="rounded-2xl border border-border bg-background p-5">
            <h3 className="text-base font-semibold text-foreground">Compare plans</h3>
            <p className="mt-1 text-[12px] text-muted-foreground">Prices per seat, billed monthly. Hover to read the fine print.</p>
            <table className="mt-4 w-full text-left text-[12px]">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Plan</th>
                  <th className="pb-2 font-medium">Price</th>
                  <th className="pb-2 font-medium">Seats</th>
                  <th className="pb-2 font-medium">Storage</th>
                  <th className="pb-2 font-medium">Support</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                {plans.map((p) => (
                  <tr key={p.name} className="border-t border-border">
                    <td className="py-2 font-medium">{p.name}</td>
                    <td className="py-2 font-mono">{p.price}</td>
                    <td className="py-2">{p.seats}</td>
                    <td className="py-2">{p.storage}</td>
                    <td className="py-2">{p.support}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
              Storage is pooled across the workspace. Annual plans save 20%. Taxes may apply. See the{" "}
              <a href="#" onClick={(e) => e.preventDefault()} className="font-medium text-primary underline underline-offset-2">
                full terms
              </a>
              .
            </p>
          </div>
        </MagnifierLens>
      )}
    </HtmlCanvasDemo>
  );
}

export function Code() {
  return (
    <HtmlCanvasDemo>
      {({ rendering, onModeChange }) => (
        <MagnifierLens zoom={2.6} size={120} distortion={0.6} rendering={rendering} onModeChange={onModeChange} className="max-w-lg">
          <pre className="overflow-hidden rounded-2xl bg-[#0b0d12] p-5 font-mono text-[11px] leading-5 text-[#c9d1d9]">
            <code>{`export function total(items: Item[]) {
  // Money is integer cents: never floats.
  return items.reduce((sum, item) => {
    return sum + item.qty * item.priceCents;
  }, 0);
}`}</code>
          </pre>
        </MagnifierLens>
      )}
    </HtmlCanvasDemo>
  );
}
