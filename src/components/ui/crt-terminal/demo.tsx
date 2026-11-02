"use client";

import { HtmlCanvasDemo } from "@/components/site/html-canvas-demo";
import { CrtTerminal } from "@/components/ui/crt-terminal/crt-terminal";

const commands = {
  whoami: () => "guest (read-only demo shell)",
  ls: () => ["components/  docs/  changelog.md  README.md"],
  version: () => "0.3.0",
};

export function Default() {
  return (
    <HtmlCanvasDemo>
      {({ rendering, onModeChange }) => <CrtTerminal commands={commands} rendering={rendering} onModeChange={onModeChange} />}
    </HtmlCanvasDemo>
  );
}

export function Paper() {
  return (
    <HtmlCanvasDemo>
      {({ rendering, onModeChange }) => (
        <CrtTerminal variant="paper" prompt="reader@inkwell:~$" welcome={["inkwell e-paper shell", "Try 'help', 'ls' or 'theme'."]} commands={commands} height={280} rendering={rendering} onModeChange={onModeChange} />
      )}
    </HtmlCanvasDemo>
  );
}
