import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { GasFeeSelector } from "@/components/ui/gas-fee-selector/gas-fee-selector";

<GasFeeSelector
  options={[
    { id: "slow", label: "Slow", maxFeePerGas: parseGwei("8"), seconds: 180 },
    { id: "standard", label: "Standard", maxFeePerGas: parseGwei("12"), seconds: 30 },
    { id: "fast", label: "Fast", maxFeePerGas: parseGwei("18"), seconds: 12 },
  ]}
  gasUnits={estimatedGas}
  nativePrice={ethUsdPrice} // bigint, 8 decimals
  onValueChange={setSpeed}
/>`,
  a11y: [
    "A labelled radio group with roving focus: arrow keys move and select, Tab leaves the group.",
    "Each option reads its speed, time estimate, cost and gwei as text; the live status is text as well as a pulsing dot.",
    "The selection border glides between cards. Reduced motion moves it instantly, stops the live ping and keeps cost updates to a color change.",
  ],
  notes: [
    "Fees are maxFeePerGas × gasUnits in wei (bigint), converted to USD with an 8-decimal price. Costs roll and flash when gas prices change.",
  ],
};
