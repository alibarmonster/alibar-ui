import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { PhoneInput } from "@/components/ui/phone-input/phone-input";

export function ContactPhone() {
  const [phone, setPhone] = useState("");
  return <PhoneInput aria-label="Phone number" defaultCountry="ID" value={phone} onValueChange={setPhone} />;
}`,
  a11y: [
    "The country button is labelled with the current choice (\"Country: Indonesia (+62)\") and opens a searchable listbox.",
    "In the list, arrow keys, Home and End move the highlight, Enter picks a country and Escape closes it; focus returns to the number field.",
    "The number field is type=\"tel\" with autocomplete=\"tel-national\" (labelled \"Phone number\" unless you pass a label), so mobile keyboards and autofill work.",
    "The caret stays with the digit you typed as separators appear, and Backspace over a separator deletes the digit before it.",
    "With reduced motion enabled, the popover and country swap fade without scaling or sliding.",
  ],
  notes: [
    "onValueChange receives E.164 (\"+6281234567890\") plus the country, national number and whether it is complete.",
    "Formats are simplified per country and cover the common mobile layout. Validate on the server with libphonenumber if you need carrier-grade accuracy.",
    "A leading trunk 0 is dropped for countries outside +1, so local habits like 0812… just work.",
  ],
};
