import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { CrtTerminal } from "@/components/ui/crt-terminal/crt-terminal";

<CrtTerminal
  prompt="guest@acme:~$"
  commands={{ whoami: () => "guest", deploy: (args) => \`Deploying \${args[0] ?? "main"}…\` }}
/>`,
  a11y: [
    "The scrollback is a role=\"log\" region of real text, so screen readers hear new output and every line can be selected and copied. The prompt is a labelled input; clicking anywhere in the terminal focuses it unless you are selecting text.",
    "↑ and ↓ walk the command history; Ctrl+L clears the screen.",
    "With reduced motion, or without the HTML-in-Canvas API, it renders as a plain monospace terminal with a CSS scanline overlay and no boot flicker.",
  ],
  notes: [
    "Experimental: uses the HTML-in-Canvas origin trial through src/lib/html-canvas/. Works in every browser via the fallback.",
    "The curvature is mild and the drawn terminal is synced to its unwarped geometry, so clicks and selection stay within a few pixels at the corners. The texture is re-uploaded only when the browser repaints the terminal; the frame loop runs only during the boot flicker.",
    "Built-in commands are help, clear, about, theme (switches between CRT and paper) and echo. Your `commands` are added to them and listed by help.",
  ],
};
