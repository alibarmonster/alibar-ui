import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/site/docs-blocks";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Templates",
  description: "Complete websites built from alibar/ui components. Open one, then copy the parts you need.",
};

const templates = [
  {
    slug: "pennant",
    name: "Pennant",
    kind: "SaaS marketing site",
    description: "Spend control for teams and their AI agents: a live dashboard hero, agent cards, a feature bento, pricing, FAQ and more.",
    image: "/templates/pennant.png",
    source: "src/app/templates/pennant/pennant-site.tsx",
    components: ["Icon Headline", "Spend Meter", "Credit Trend", "Logo Grid", "Foil Card Drift", "Feature Bento", "Agent Steps", "Spring Switch", "Tumbling Tags", "Stats Section", "Testimonial Wall", "Pricing Section", "FAQ Section", "CTA with Border Beam"],
  },
];

export default function TemplatesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-24 sm:px-6">
      <PageHeader title="Templates" description="Complete websites built from alibar/ui components. Open one to see it live, then copy the parts you need." />
      <ul className="mt-10 grid gap-8">
        {templates.map((t) => (
          <li key={t.slug} className="overflow-hidden rounded-2xl border border-border bg-background">
            <Link href={`/templates/${t.slug}`} className="focus-ring group block overflow-hidden border-b border-border bg-surface">
              <Image src={t.image} alt={`${t.name} template preview`} width={1440} height={900} className="w-full transition-transform duration-500 ease-out group-hover:scale-[1.015] motion-reduce:transition-none" priority />
            </Link>
            <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-start">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t.kind}</p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">{t.name}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t.description}</p>
                <ul aria-label="Components used" className="mt-4 flex flex-wrap gap-1.5">
                  {t.components.map((c) => (
                    <li key={c} className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs text-foreground">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2 md:flex-col">
                <Link href={`/templates/${t.slug}`} className="focus-ring inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background">
                  Open template
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
                <a href={`${siteConfig.github}/blob/main/${t.source}`} target="_blank" rel="noreferrer" className="focus-ring inline-flex h-9 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-foreground hover:bg-surface-2">
                  View source
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
