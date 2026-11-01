import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ImageLightbox } from "@/components/ui/image-lightbox/image-lightbox";

export function Gallery() {
  return (
    <ImageLightbox
      images={[
        { src: "/photos/dusk.jpg", alt: "Dusk over the hills", width: 1200, height: 800, caption: "Dusk" },
        { src: "/photos/valley.jpg", alt: "Green valley", width: 1000, height: 1000 },
      ]}
    />
  );
}`,
  a11y: [
    "Thumbnails are buttons that open a real dialog: focus moves inside, Escape or the close button dismisses it, and focus returns to the thumbnail.",
    "Left and right arrow keys move between images, and the position (3 / 6) is announced.",
    "With reduced motion enabled, images appear and change with a fade instead of zooming and sliding.",
  ],
  notes: [
    "The open image zooms out of its thumbnail and, on close, back into the thumbnail of whichever image is showing, even after swiping.",
    "Thumbnails keep each image's own aspect ratio (a masonry column layout), so the zoom scales evenly instead of stretching. Pass width and height for every image.",
    "Swipe or drag sideways to change images; a short drag springs back.",
  ],
};
