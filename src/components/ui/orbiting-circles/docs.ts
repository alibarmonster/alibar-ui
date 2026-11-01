import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { OrbitingCircles } from "@/components/ui/orbiting-circles/orbiting-circles";

<OrbitingCircles
  center={<YourLogo />}
  rings={[
    { radius: 110, duration: 26, items: [{ name: "Slack", icon: <SlackIcon /> }] },
    { radius: 200, duration: 40, reverse: true, items: moreApps },
  ]}
  pathStyle="dashed"
/>`,
  a11y: [
    "Each icon is focusable and named; hover or focus scales it up and shows a tooltip with its name.",
    "Hovering the system or focusing an icon pauses every ring, so names can be read and icons reached.",
    "With reduced motion nothing orbits: icons sit at their evenly spaced positions.",
  ],
  notes: [
    "Pure CSS keyframes: each ring container rotates, and each icon counter-rotates at the same speed to stay upright. There's no per-frame JavaScript. The keyframes ship inside the component through a React 19 hoisted <style>.",
    "Radii and icon sizes are given for designSize (480px by default) and scale down with the container through container query units, so it works on phones.",
  ],
};
