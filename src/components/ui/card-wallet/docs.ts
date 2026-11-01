import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { CardWallet, type WalletCard } from "@/components/ui/card-wallet/card-wallet";

const cards: WalletCard[] = [
  {
    id: "everyday",
    issuer: "Harbor Bank",
    product: "Everyday",
    lastFour: "4821",
    holder: "Alibar",
    material: "metal",
    expires: "09/29",
    balance: 2481.2,
    balanceLabel: "Available balance",
    transactions: [{ id: "1", merchant: "Corner Roastery", detail: "Today", amount: -4.8 }],
  },
];

<CardWallet cards={cards} currency="USD" onSelectedChange={(card) => console.log(card?.id)} />`,
  a11y: [
    "The wallet is a labelled group with a keyboard hint. Only the front card is in the tab order (roving tabindex): ↑ ← move to the previous card, ↓ → to the next, Home and End jump to the ends, Enter or Space opens and closes, Escape closes.",
    "Each card is a button named by issuer, product, last four digits, position and balance, with aria-expanded. The masked digits and artwork are hidden from assistive tech.",
    "The activity region is inert until a card is open. Cycling and opening are announced in a polite live region, and focus returns to the card when it closes.",
    "With reduced motion there is no travel, tilt or moving light; every state change applies instantly.",
    "Use fictional data in demos and never render a full card number: the component only ever shows the last four digits.",
  ],
  notes: [
    "Every visual state is a pure function of a few continuous Motion values (cycle position, fan, open, selected card, tilt and light) plus a rise value per card, so springs, drags and interruptions always move the same shape and React never re-renders during a gesture.",
    "Z order never changes: cards slide behind a pocket at the bottom instead of being re-stacked, and only transform and opacity animate. Shadows fade their opacity; the light moves a pre-painted highlight layer.",
    "Cards keep the ID-1 ratio (85.6 × 53.98 mm) and size every detail in container query units, so the card scales as one object inside min(100%, 18.5rem).",
    "Drag down slides the front card into the pocket 1:1 with the next card coming forward; a flick moves exactly one card and the ends rubber-band. An open card can be pulled down to put it back. Phones that report orientation move the light and tilt without asking for permission.",
    "The network mark is an original fictional design (\"Kinnet\"). Pass network={null} to hide it or your own mark; never use a real card network's logo.",
  ],
};
