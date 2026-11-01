import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { StarRating } from "@/components/ui/star-rating/star-rating";

export function Review() {
  const [rating, setRating] = useState(0);
  return <StarRating label="Your rating" value={rating} onValueChange={setRating} allowHalf />;
}`,
  a11y: [
    "Interactive ratings are a single slider: aria-valuenow plus aria-valuetext such as \"3.5 out of 5 stars\".",
    "Arrow keys change the rating by one star (or half with allowHalf), and Home and End jump to 0 and the maximum.",
    "readOnly ratings are role=\"img\" with a label like \"Average rating: 4.6 out of 5 stars\", so fractional values read correctly.",
    "With reduced motion enabled, stars fill instantly and don't pop.",
  ],
  notes: [
    "Hovering previews the rating; with allowHalf, the left half of a star previews a half.",
    "Filled stars are clipped to their fill fraction, so read-only values like 4.6 render precisely.",
    "Stars use the --warning token. Set a text color on the component to change it.",
  ],
};
