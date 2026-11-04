import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { LiquidTabNav } from "@/components/ui/liquid-tab-nav/liquid-tab-nav";

<LiquidTabNav brand={<Logo />} tabs={[{ label: "Home", href: "/", icon: <House /> }]} cta={signup} />`,
  a11y: [
    "Tabs are links; the current one has `aria-current=\"page\"`, and its icon bubble is decorative.",
    "The bump follows keyboard and pointer choices alike.",
    "Under reduced motion the bump and bubble jump instead of flowing.",
  ],
  notes: [
    "The bar is one SVG path whose bump position is a spring, so it flows rather than slides; it measures the tabs with a ResizeObserver.",
    "When the tabs collapse into the menu, the bump flattens out.",
    "`tone` switches between a white bar with a black bubble and the reverse.",
  ],
};
