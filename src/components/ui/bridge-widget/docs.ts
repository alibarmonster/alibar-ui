import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { BridgeWidget } from "@/components/ui/bridge-widget/bridge-widget";

<BridgeWidget
  chains={chains}
  token={{ symbol: "ETH", decimals: 18 }}
  balances={{ 1: ethOnMainnet, 8453: ethOnBase }}
  getQuote={(from, to, amount) => bridge.quote(from.id, to.id, amount)} // { receive, etaSeconds, fees }
  status={status} // "idle" → "awaiting-signature" → "sending" → "bridging" → "complete" | "failed"
  progress={confirmations / required}
  onBridge={({ from, to, amount }) => send(from, to, amount)}
  onReset={() => setStatus("idle")}
  txHash={sourceHash}
/>`,
  a11y: [
    "Chain pickers are Radix dropdown menus with radio items; the chain already used on the other side is disabled.",
    "The swap-direction button is named after the result (\"Swap direction: bridge from Base to Ethereum\").",
    "The tracker is an ordered list: each step has \"done\", \"in progress\", \"failed\" or \"waiting\" in screen-reader text, and step changes are announced in a live region.",
    "The form morphs into the tracker with a height change. Reduced motion uses fades and stops the flowing route dashes.",
  ],
  notes: [
    "Amounts and the received estimate are bigint. Fee lines are pre-formatted strings, so you can show them in any unit or currency.",
    "Reuses Token Amount Input for the amount and balance check, so it installs with it.",
  ],
};
