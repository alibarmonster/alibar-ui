import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { SideDrawer } from "@/components/ui/side-drawer/side-drawer";

export function Cart() {
  return (
    <SideDrawer trigger={<button>Cart</button>} title="Your cart" footer={<CheckoutButton />}>
      <CartItems />
    </SideDrawer>
  );
}`,
  a11y: [
    "Built on Radix Dialog: focus is trapped, Escape and the close button dismiss it, page scroll is locked and focus returns to the trigger.",
    "The title names the dialog and the description is linked automatically when provided.",
    "Swipe-to-dismiss starts only from the header, so text selection and inputs in the body behave normally.",
    "With reduced motion enabled, the drawer fades in place instead of sliding.",
  ],
  notes: [
    "The backdrop blur and fade run on their own layer; the panel itself only animates transform.",
    "Swiping toward the drawer's edge past 90px, or with a quick flick, closes it.",
  ],
};
