import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { DarkroomStream } from "@/components/ui/darkroom-stream/darkroom-stream";

<div className="h-[32rem]">
  <DarkroomStream items={photos} printBorder onOpen={(item) => console.log(item.title)}>
    <h2 className="text-2xl font-semibold">Every frame develops on the way out</h2>
  </DarkroomStream>
</div>`,
  a11y: [
    "The canvas is decorative (aria-hidden). A visually hidden list of buttons, one per photo, opens any photo enlarged with its caption; Escape or the caption's close button puts it back.",
    "Space or the corner button pauses the stream (the button reports its state with aria-pressed). Arrow keys and the wheel fly through the stream; the live region stays quiet while it flows on its own.",
    "The headline in the center is real content and becomes inert while a photo is open, so focus can't land on it behind the photo.",
    "With reduced motion the stream stands still and moves only when you drag, scroll or use the keys; opening a photo jumps straight to the end.",
    "Without WebGL the photos render as a plain, swipeable scroll-snap list.",
  ],
  notes: [
    "Each photo slot follows one shared travel value, so the whole stream costs a few arithmetic operations per photo per frame. When a photo leaves the screen its slot respawns with a new angle, size and image from a deterministic hash, so the stream never repeats in an obvious pattern and needs no per-photo state.",
    "rush blends a linear zoom with a perspective curve (1 / (1 − 0.86s)), so 0 drifts evenly and 1 rushes past the edges. spiral curls the paths, and a negative speed runs the stream backwards into the center.",
    "Develop is done in the shader: photos start monochrome and low contrast and reach full color by mid-flight. With printBorder they develop out of the blank paper instead, the way a print appears in the tray.",
    "A caught photo freezes its phase and lifts; when released, its phase is shifted so it carries on exactly where it stopped, with the same image. Drags steer: along the radius flies through the stream, around the center rotates it, both with momentum.",
  ],
};
