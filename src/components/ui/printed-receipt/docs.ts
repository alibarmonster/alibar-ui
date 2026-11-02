import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { PrintedReceipt } from "@/components/ui/printed-receipt/printed-receipt";

<PrintedReceipt
  merchant={{ name: "Kettle & Kiln Roasters", address: ["48 Harbour Lane", "Portside, NC 28411"] }}
  order={{
    number: "KK-20481",
    date: "2026-11-02T09:41:00Z",
    items: [{ id: "1", name: "Ethiopia Guji", qty: 2, price: 1850 }], // cents
    adjustments: [{ id: "code", label: "Code BREWDAY", amount: -730 }],
    taxRate: 0.0725,
    payment: { type: "card", brand: "Orbit", lastFour: "4821" },
  }}
  status="paid"
  printKey={orderId} // change it to print again
/>`,
  a11y: [
    "The receipt is an article labelled by the store name, and every line is real text, so it reads in order while it prints; aria-busy is set until the paper has fed out.",
    "When printing finishes, the total and the status are announced politely. The stamp is decorative; Refunded also strikes through the total.",
    "With reduced motion the receipt fades in whole and the stamp appears without the drop.",
  ],
  notes: [
    "Money is integer minor units. Tax is the rate times the items minus discounts (negative adjustments), rounded to the nearest minor unit; other adjustments such as shipping are not taxed.",
    "Dates use a fixed `timeZone` (UTC by default) so the server and the browser print the same time.",
    "The barcode is decorative and generated from the order number; it is not a scannable symbology. Payment lines take a card brand and last four only, or a crypto network, amount, gas fee and a truncated hash.",
  ],
};
