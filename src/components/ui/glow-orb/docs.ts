import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { GlowOrb } from "@/components/ui/glow-orb/glow-orb";

<GlowOrb state={assistantState} level={audioLevel} className="w-48" />`,
  a11y: [
    "The orb is an image labelled with its state (\"Assistant, thinking\"). Pair it with a visible or live text status for real assistants.",
    "With reduced motion the shader draws a single still frame. Without WebGL2, or on software rendering with no GPU, a CSS fallback in the same colors is shown.",
  ],
  notes: [
    "A noise-displaced sphere with a swirling fBm interior, a highlight and a soft halo, drawn with alpha on any background. The state sets the pace and level swells it; feed level from an AnalyserNode for real audio.",
    "Built on useShaderCanvas: it pauses offscreen and in hidden tabs, caps the pixel ratio at 1.5, recovers from context loss and releases the GPU on unmount.",
  ],
};
