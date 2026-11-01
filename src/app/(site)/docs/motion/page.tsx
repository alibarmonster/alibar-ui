import type { Metadata } from "next";
import { CodeBlock } from "@/components/site/code-block";
import { PageHeader, Pager, Prose, SectionHeading } from "@/components/site/docs-blocks";
import { DocsPage } from "@/components/site/docs-layout";
import { MotionSample } from "@/components/site/motion-samples";
import { TableOfContents } from "@/components/site/toc";
import { duration, ease, spring, stagger } from "@/lib/motion";
import { readProjectFile } from "@/lib/docs/source";

export const metadata: Metadata = {
  title: "Motion",
  description: "Durations, curves, springs and reduced motion.",
};

const toc = [
  { id: "durations", title: "Durations" },
  { id: "curves", title: "Curves" },
  { id: "springs", title: "Springs" },
  { id: "patterns", title: "Patterns" },
  { id: "rules", title: "Rules" },
  { id: "reduced-motion", title: "Reduced motion" },
  { id: "source", title: "Source" },
];

const durationUse: Record<keyof typeof duration, string> = {
  instant: "Exits, tooltips leaving, press feedback",
  quick: "Hovers, icon swaps, menus opening",
  base: "Enters, tab content, small layout shifts",
  slow: "Large surfaces, drawers, draw-on strokes",
};

const springUse: Record<keyof typeof spring, string> = {
  snappy: "Indicators, toggles, active rows",
  smooth: "Panels, sheets, layout changes",
  bouncy: "Playful pops: likes, badges, ratings",
};

const patterns = [
  {
    name: "Enter",
    body: "Fade in from opacity 0, a 4px blur and an 8px y-offset over base duration with ease-out. Exits are faster than enters.",
    code: "enterVariants(reduceMotion)",
  },
  {
    name: "Overlay",
    body: "Popovers, menus and dialogs scale from 0.96 to 1 with a light blur, from the trigger's side when possible.",
    code: "overlayVariants(reduceMotion)",
  },
  {
    name: "Sliding indicator",
    body: "Active pills and underlines share a layoutId and move on the snappy spring.",
    code: '<motion.span layoutId="indicator" transition={spring.snappy} />',
  },
  {
    name: "Stagger",
    body: "Lists stagger children by 30–60ms. Keep total sequences under about 400ms.",
    code: "staggerVariants(stagger.base)",
  },
];

export default async function MotionPage() {
  const source = await readProjectFile("src/lib/motion.ts");

  return (
    <DocsPage toc={<TableOfContents items={toc} />}>
      <PageHeader
        title="Motion"
        description="One shared vocabulary of durations, curves and springs, defined in lib/motion.ts and used by every component."
      />

      <SectionHeading id="durations" className="mt-0">
        Durations
      </SectionHeading>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="bg-surface text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">Token</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Value</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Use for</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border border-t border-border">
            {(Object.keys(duration) as (keyof typeof duration)[]).map((key) => (
              <tr key={key}>
                <td className="px-4 py-3"><code className="font-mono text-[13px] text-foreground">duration.{key}</code></td>
                <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground tabular-nums">{duration[key] * 1000}ms</td>
                <td className="px-4 py-3 text-muted-foreground">{durationUse[key]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionHeading id="curves">Curves</SectionHeading>
      <Prose className="mb-5">
        <p>
          Use <code>ease.out</code> for nearly everything that enters or responds to input: it starts fast and settles
          gently. Use <code>ease.inOut</code> for things that move between two resting states on their own, like
          a drawn stroke. Press play to compare.
        </p>
      </Prose>
      <div className="space-y-3">
        <MotionSample
          label="ease.out"
          detail={`[${ease.out.join(", ")}]`}
          curve={ease.out}
          transition={{ duration: duration.slow, ease: ease.out }}
        />
        <MotionSample
          label="ease.inOut"
          detail={`[${ease.inOut.join(", ")}]`}
          curve={ease.inOut}
          transition={{ duration: duration.slow, ease: ease.inOut }}
        />
      </div>

      <SectionHeading id="springs">Springs</SectionHeading>
      <Prose className="mb-5">
        <p>Springs handle anything the user can interrupt, such as indicators, drags and toggles, because they keep their velocity when retargeted.</p>
      </Prose>
      <div className="space-y-3">
        {(Object.keys(spring) as (keyof typeof spring)[]).map((key) => (
          <MotionSample
            key={key}
            label={`spring.${key}`}
            detail={`stiffness ${spring[key].stiffness} · damping ${spring[key].damping} · ${springUse[key].toLowerCase()}`}
            transition={spring[key]}
          />
        ))}
      </div>

      <SectionHeading id="patterns">Patterns</SectionHeading>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {patterns.map((pattern) => (
          <li key={pattern.name} className="rounded-xl border border-border p-4">
            <p className="text-sm font-medium text-foreground">{pattern.name}</p>
            <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{pattern.body}</p>
            <code className="mt-3 block truncate rounded-md bg-surface px-2.5 py-1.5 font-mono text-xs text-foreground">
              {pattern.code}
            </code>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[13px] text-muted-foreground">
        Stagger presets: tight {stagger.tight * 1000}ms, base {stagger.base * 1000}ms, loose {stagger.loose * 1000}ms.
      </p>

      <SectionHeading id="rules">Rules</SectionHeading>
      <Prose>
        <ul className="list-disc space-y-2 pl-5 marker:text-border">
          <li>
            Only animate <code>transform</code>, <code>opacity</code>, <code>filter</code> and <code>clip-path</code>. Size
            changes use <code>layout</code> animations or a <code>grid-template-rows: 0fr → 1fr</code> transition.
          </li>
          <li>Hover and focus styles use CSS transitions. Motion is for state changes, gestures and enters and exits.</li>
          <li>Clean up every listener, timer and animation frame. Nothing animates while it is off-screen.</li>
          <li>Never block input while an animation plays. Interrupted animations retarget from where they are.</li>
        </ul>
      </Prose>

      <SectionHeading id="reduced-motion">Reduced motion</SectionHeading>
      <Prose>
        <p>
          Every component calls <code>useReducedMotion()</code>. When the user asks for less motion, movement, scaling
          and blur are replaced with short opacity fades. State changes stay visible; only the travel is removed.
          The helpers in <code>lib/motion.ts</code> take the flag and return the right variants.
        </p>
      </Prose>

      <SectionHeading id="source">Source</SectionHeading>
      <CodeBlock code={source} lang="ts" title="lib/motion.ts" collapsible />

      <Pager prev={{ href: "/docs/theming", title: "Theming" }} />
    </DocsPage>
  );
}
