import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { VoiceOrb } from "@/components/ui/voice-orb/voice-orb";

// Give it a microphone stream…
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
<VoiceOrb state="listening" stream={stream} />

// …or a level you measure yourself (0–1)
<VoiceOrb state="speaking" level={outputLevel} />`,
  a11y: [
    "Exposed as an image named with the current state (“Voice assistant: listening”). Pair it with visible text or controls for the state.",
    "With reduced motion enabled, the orb doesn't wobble on its own; it only swells with the audio level.",
  ],
  notes: [
    "The blob is a smooth closed curve whose wobble grows with the level; the whole orb swells and its glow brightens as the level rises.",
    "With `stream`, the level is measured with a Web Audio analyser. Requesting the microphone is up to you, so the browser's permission prompt stays under your control.",
    "The shape is redrawn every frame directly in the DOM (no React re-renders), and drawing pauses while the orb is offscreen.",
  ],
};
