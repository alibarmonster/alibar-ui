"use client";

import Link from "next/link";
import { ArrowRight, Bot, CreditCard, Receipt, ShieldCheck, Users, Zap } from "lucide-react";
import { placeholderLogos } from "@/components/site/placeholder-logos";
import { AgentSteps } from "@/components/ui/agent-steps/agent-steps";
import { CreditTrend } from "@/components/ui/credit-trend/credit-trend";
import { CtaSection } from "@/components/ui/cta-section/cta-section";
import { FaqSection } from "@/components/ui/faq-section/faq-section";
import { FeatureBento } from "@/components/ui/feature-bento/feature-bento";
import { FoilCardDrift } from "@/components/ui/foil-card-drift/foil-card-drift";
import { IconHeadline } from "@/components/ui/icon-headline/icon-headline";
import { LogoGrid } from "@/components/ui/logo-grid/logo-grid";
import { NumberTicker } from "@/components/ui/number-ticker/number-ticker";
import { PricingSection } from "@/components/ui/pricing-section/pricing-section";
import { Sparkline } from "@/components/ui/sparkline/sparkline";
import { SpendMeter } from "@/components/ui/spend-meter/spend-meter";
import { SpringSwitch } from "@/components/ui/spring-switch/spring-switch";
import { StatsSection } from "@/components/ui/stats-section/stats-section";
import { TestimonialWall } from "@/components/ui/testimonial-wall/testimonial-wall";
import { TumblingTags } from "@/components/ui/tumbling-tags/tumbling-tags";
import { mockCategories, mockCycle, mockDailyUsage } from "@/lib/usage/mock";

/*
 * Pennant is a fictional company. Everything on this page is a template built from alibar/ui
 * components with invented copy, people and numbers.
 */

const icon = "size-[0.5em] text-white";
const container = "mx-auto w-full max-w-6xl px-5 sm:px-8";

function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M5 3v18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M6 4h12.5l-3.2 4.5 3.2 4.5H6z" fill="currentColor" />
    </svg>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur-xl">
      <nav aria-label="Main" className={`${container} flex h-16 items-center gap-8`}>
        <Link href="/templates/pennant" className="flex items-center gap-2 rounded-md text-[17px] font-semibold tracking-tight text-[#0b0f0e] outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Mark className="size-5 text-[#0f7a5f]" />
          Pennant
        </Link>
        <ul className="hidden items-center gap-7 text-[14px] text-[#4b5552] md:flex">
          {["Product", "Agents", "Customers", "Pricing"].map((item) => (
            <li key={item}>
              <a href={`#${item.toLowerCase()}`} className="rounded outline-none transition-colors hover:text-[#0b0f0e] focus-visible:ring-2 focus-visible:ring-ring">
                {item}
              </a>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-2">
          <a href="#" className="hidden h-9 items-center rounded-full px-3 text-[14px] text-[#4b5552] hover:text-[#0b0f0e] sm:inline-flex">
            Sign in
          </a>
          <a href="#pricing" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#0b0f0e] px-4 text-[14px] font-medium text-white outline-none transition-transform hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            Start free
          </a>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-10 sm:pt-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,#e8f6f0,transparent_70%)]" />
      <div className={`${container} flex flex-col items-center text-center`}>
        <a href="#agents" className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#0f7a5f]/20 bg-white px-3 py-1 text-[13px] text-[#0f5c48] shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
          <span className="rounded-full bg-[#0f7a5f] px-1.5 py-px text-[11px] font-semibold text-white">New</span>
          Agent cards with per-task budgets
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </a>
        <IconHeadline
          className="max-w-4xl text-[#0b0f0e]"
          parts={[
            "Spend control for",
            { icons: [<Users key="u" className={icon} />, <CreditCard key="c" className={icon} />], backgrounds: ["#0f7a5f", "#2563eb"] },
            "teams and",
            { icons: [<Bot key="b" className={icon} />, <Zap key="z" className={icon} />], backgrounds: ["#7c3aed", "#ea580c"] },
            "their AI agents",
          ]}
        />
        <p className="mt-6 max-w-xl text-[17px] leading-7 text-[#4b5552]">
          Issue cards, set budgets that hold, and see every dollar your people and your agents spend, the moment they spend it.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#pricing" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#0b0f0e] px-6 text-[15px] font-medium text-white outline-none transition-transform hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            Start free
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
          <a href="#product" className="inline-flex h-11 items-center rounded-full border border-black/10 bg-white px-6 text-[15px] font-medium text-[#0b0f0e] outline-none hover:bg-[#f4f6f5] focus-visible:ring-2 focus-visible:ring-ring">
            Book a demo
          </a>
        </div>
        <p className="mt-4 text-[13px] text-[#6b7572]">Free for teams under 10. No card needed.</p>
      </div>

      {/* Product shot: the live dashboard, built from Spend Meter and Credit Trend. */}
      <div id="product" className={`${container} mt-16 scroll-mt-24`}>
        <div className="rounded-[22px] border border-black/[0.06] bg-[#f6f7f6] p-2 shadow-[0_40px_80px_-40px_rgb(15_60_45/0.35)] sm:p-3">
          <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
            <div className="flex items-center gap-2 border-b border-black/[0.06] px-4 py-3">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-4 rounded-md bg-[#f4f6f5] px-3 py-1 text-[12px] text-[#6b7572]">app.pennant.example / spend</span>
            </div>
            <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
              <SpendMeter
                title="AI spend"
                periodLabel="November 2026"
                defaultBudget={10000}
                resources={[
                  { id: "models", name: "Model inference", amount: 3124, detail: "Research agent, support bot, 4 more" },
                  { id: "tools", name: "Tool calls", amount: 1606, detail: "4,212 calls to 18 tools" },
                  { id: "saas", name: "Agent card purchases", amount: 850, detail: "3 vendors, all within policy" },
                ]}
                className="max-w-none"
              />
              <CreditTrend title="Credits this cycle" categories={mockCategories} days={mockDailyUsage} today={mockCycle.today} renewsOn={mockCycle.renewsOn} dailyBudget={mockCycle.dailyBudget} className="max-w-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Agents() {
  return (
    <section id="agents" aria-labelledby="agents-title" className="scroll-mt-20 py-24">
      <div className={`${container} grid items-end gap-6 md:grid-cols-2`}>
        <div>
          <p className="text-[13px] font-semibold tracking-wide text-[#0f7a5f] uppercase">Agent cards</p>
          <h2 id="agents-title" className="mt-3 text-[clamp(2rem,4vw,2.75rem)] leading-[1.1] font-semibold tracking-[-0.02em] text-[#0b0f0e]">
            A card for every agent, with a limit it can&apos;t talk its way past.
          </h2>
        </div>
        <ul className="space-y-3 text-[15px] text-[#4b5552]">
          {[
            "Budgets per task, per day or per vendor, enforced at the moment of purchase.",
            "Every charge arrives with the prompt and tool call that made it.",
            "Freeze a card from chat, the dashboard or the API.",
          ].map((line) => (
            <li key={line} className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#0f7a5f]" aria-hidden="true" />
              {line}
            </li>
          ))}
        </ul>
      </div>
      <FoilCardDrift
        className="mt-10"
        label="Pennant cards"
        cards={[
          { id: "obsidian", label: "Obsidian corporate card", design: "obsidian" },
          { id: "agent", label: "Agent card for the research agent", children: <AgentCardFace name="research-agent" tint="linear-gradient(135deg,#0f7a5f,#064e3b)" /> },
          { id: "sky", label: "Team card for Serena Lo", design: "sky", holder: "Serena Lo" },
          { id: "agent-2", label: "Agent card for the support bot", children: <AgentCardFace name="support-bot" tint="linear-gradient(135deg,#7c3aed,#312e81)" /> },
          { id: "chrome", label: "Chrome finance card", design: "chrome" },
        ]}
      />
    </section>
  );
}

function AgentCardFace({ name, tint }: { name: string; tint: string }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-5 text-white" style={{ background: tint }}>
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium opacity-90">
        <Bot className="size-3.5" aria-hidden="true" /> Agent card
      </span>
      <span className="font-mono text-[13px] tracking-wide">{name}</span>
    </div>
  );
}

function Features() {
  return (
    <div className="bg-[#f6f7f6] py-24">
      <div className={container}>
        <FeatureBento
          eyebrow="Product"
          title="Finance that runs itself, until it shouldn't"
          description="Rules handle the routine. You get pulled in only for the spend that needs a human."
          features={[
            {
              title: "Live spend",
              description: "Every swipe, invoice and API bill lands within seconds, already categorized.",
              className: "@[48rem]:col-span-2",
              visual: (
                <div className="flex w-full max-w-md flex-wrap items-end justify-between gap-x-6 gap-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Spent today</p>
                    <p className="font-mono text-3xl font-semibold tracking-tight whitespace-nowrap text-foreground tabular-nums">
                      $<NumberTicker value={18420} />
                    </p>
                  </div>
                  <Sparkline data={[8, 12, 10, 15, 21, 18, 24, 28, 26, 31, 35, 33, 40]} label="Spend over the last 13 hours" width={200} height={64} area drawOn color="#0f7a5f" />
                </div>
              ),
            },
            {
              title: "Approvals in one tap",
              description: "Pennant checks policy, then asks the right person.",
              visual: (
                <AgentSteps
                  className="w-full max-w-60 text-left"
                  steps={[
                    { id: "1", title: "Matched to policy", status: "done" },
                    { id: "2", title: "Over $2,000: asked Mina", status: "done" },
                    { id: "3", title: "Paying vendor", status: "running" },
                  ]}
                />
              ),
            },
            {
              title: "Policies as switches",
              description: "Turn rules on without a ticket to finance.",
              visual: (
                <ul className="w-full max-w-56 space-y-2.5 text-left text-[13px] text-foreground">
                  {[
                    ["Block gambling merchants", true],
                    ["Receipts over $75", true],
                    ["Weekend spend", false],
                  ].map(([label, on]) => (
                    <li key={String(label)} className="flex items-center justify-between gap-3">
                      {label}
                      <SpringSwitch defaultChecked={Boolean(on)} aria-label={String(label)} />
                    </li>
                  ))}
                </ul>
              ),
            },
            {
              title: "Receipts, matched",
              description: "Forwarded, photographed or pulled from email, then matched for you.",
              visual: (
                <div className="flex w-full max-w-56 items-center gap-3 rounded-xl border border-border bg-background p-3 text-left shadow-xs">
                  <Receipt className="size-5 text-[#0f7a5f]" aria-hidden="true" />
                  <div className="min-w-0 text-[12px]">
                    <p className="truncate font-medium text-foreground">Kettle &amp; Kiln · $76.15</p>
                    <p className="text-muted-foreground">Matched to card ••4821</p>
                  </div>
                </div>
              ),
            },
            {
              title: "Books that close",
              description: "Synced to your ledger with the right accounts, every night.",
              visual: (
                <ul className="w-full max-w-56 divide-y divide-border rounded-xl border border-border bg-background text-left text-[12px] shadow-xs">
                  {[
                    ["Software", "6110", "$12,480"],
                    ["Travel", "6240", "$4,215"],
                    ["AI compute", "6115", "$8,902"],
                  ].map(([name, code, amount]) => (
                    <li key={name} className="flex items-center justify-between gap-2 px-3 py-2">
                      <span className="text-foreground">
                        {name} <span className="font-mono text-muted-foreground">{code}</span>
                      </span>
                      <span className="font-mono text-foreground tabular-nums">{amount}</span>
                    </li>
                  ))}
                </ul>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}

function Platform() {
  return (
    <section aria-labelledby="platform-title" className="py-24">
      <div className={`${container} text-center`}>
        <h2 id="platform-title" className="mx-auto max-w-2xl text-balance text-[clamp(2rem,4vw,2.75rem)] leading-[1.1] font-semibold tracking-[-0.02em] text-[#0b0f0e]">
          Everything spend touches, in one place
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-balance text-[16px] text-[#4b5552]">Start with cards. Add the rest when you need it; it&apos;s all the same ledger.</p>
        <TumblingTags
          className="mt-6"
          label="Pennant products"
          tags={[
            { label: "Cards", tone: { background: "#0b0f0e", color: "#fff" } },
            { label: "Bill pay", tone: { background: "#cfeee2", color: "#0b3d2e" } },
            { label: "Agent budgets", tone: { background: "#0f7a5f", color: "#fff" } },
            { label: "Reimbursements", tone: { background: "#efd5b8", color: "#7a3410" } },
            { label: "Accounting sync", tone: { background: "#e4e7ff", color: "#2b2f86" } },
          ]}
        />
      </div>
    </section>
  );
}

const testimonials = [
  { quote: "We gave our research agent a $400 daily card and stopped worrying about runaway API bills.", name: "Mina Okafor", title: "Head of Platform, Larkspur" },
  { quote: "Month-end close went from six days to two. The receipts are just there.", name: "Theo Marsh", title: "Controller, Fieldwork" },
  { quote: "The limits actually hold. Our agents hit the wall, ask for more, and someone approves it in Slack.", name: "Ayu Pratama", title: "Staff Engineer, Northwind" },
  { quote: "Finally one place for card spend and model spend. The budget meter is on our team TV.", name: "Rina Halim", title: "COO, Brightfold" },
  { quote: "Setting policies is a switch, not a ticket. Finance and engineering stopped arguing.", name: "Jonas Weber", title: "VP Finance, Tidepool" },
  { quote: "We rolled out cards to 140 people in an afternoon.", name: "Mei Tanaka", title: "People Ops, Cinder" },
  { quote: "Every charge tells you which prompt made it. That alone paid for Pennant.", name: "Omar Haddad", title: "CTO, Quillfeather" },
  { quote: "Our auditors asked how we got so organized. We told them.", name: "Lena Novak", title: "Finance Lead, Ashgrove" },
];

export function PennantSite() {
  return (
    // The brand green replaces the library's primary color, so every component on the page follows it.
    <div className="min-h-dvh bg-white font-sans text-[#0b0f0e] antialiased" style={{ "--primary": "#0f7a5f", "--chart-1": "#0f7a5f" } as React.CSSProperties}>
      <Nav />
      <main>
        <Hero />
        <div className="border-y border-black/[0.06] bg-surface">
          <div className={container}>
            <LogoGrid eyebrow="Trusted by finance and platform teams at fast-moving companies" items={placeholderLogos.slice(0, 8).map((l) => ({ ...l, href: "#customers" }))} columns={4} variant="plain" />
          </div>
        </div>
        <Agents />
        <Features />
        <Platform />
        <div className="border-y border-black/[0.06] bg-[#f6f7f6] py-16">
          <div className={container}>
            <StatsSection
              eyebrow="By the numbers"
              stats={[
                { value: 2.4, prefix: "$", suffix: "B", decimals: 1, label: "Spend managed", description: "Across cards, bills and agents" },
                { value: 14000, suffix: "+", label: "Teams", description: "From 3 people to 3,000" },
                { value: 62, suffix: "%", label: "Faster close", description: "Median, in the first quarter" },
                { value: 99.99, suffix: "%", decimals: 2, label: "Uptime", description: "Over the last 12 months" },
              ]}
            />
          </div>
        </div>
        <section id="customers" aria-labelledby="customers-title" className="scroll-mt-20 py-24">
          <div className={container}>
            <h2 id="customers-title" className="text-center text-[clamp(2rem,4vw,2.75rem)] leading-[1.1] font-semibold tracking-[-0.02em]">
              Teams that stopped chasing receipts
            </h2>
            <TestimonialWall className="mt-12" testimonials={testimonials} height={520} />
          </div>
        </section>
        <div id="pricing" className="scroll-mt-20 bg-[#f6f7f6] py-24">
          <div className={container}>
            <PricingSection
              title="Simple pricing that scales with you"
              description="Every plan includes unlimited cards and agent budgets."
              yearlyBadge="2 months free"
              plans={[
                { name: "Starter", description: "For small teams getting organized.", price: { monthly: 0, yearly: 0 }, features: ["Up to 10 people", "Physical and virtual cards", "Receipt matching"], cta: "Start free" },
                { name: "Team", description: "For growing teams and their agents.", price: { monthly: 12, yearly: 10 }, features: ["Everything in Starter", "Agent cards with budgets", "Approvals and policies", "Accounting sync"], cta: "Start trial", popular: true },
                { name: "Scale", description: "For finance teams with complex books.", price: { monthly: 29, yearly: 24 }, features: ["Everything in Team", "Multi-entity", "Custom roles and audit log", "Dedicated support"], cta: "Talk to sales" },
              ]}
            />
          </div>
        </div>
        <div className="py-24">
          <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
            <FaqSection
              title="Questions, answered"
              items={[
                { question: "How do agent cards work?", answer: "Each agent gets a virtual card with a budget per task, day or vendor. Purchases outside the budget are declined at the moment of purchase, and the agent can request more." },
                { question: "Is Pennant a bank?", answer: "No. Pennant is a fictional template. A real product would partner with a licensed bank to issue cards." },
                { question: "Which accounting tools do you sync with?", answer: "The common ledgers, with account mapping you set once. Sync runs nightly, or on demand." },
                { question: "Can I set different rules for different teams?", answer: "Yes. Policies can apply to a team, a person, a card or an agent, and the most specific one wins." },
                { question: "What happens when an agent hits its limit?", answer: "The charge is declined, the agent receives a clear error it can act on, and the owner gets a one-tap request to raise the limit." },
              ]}
            />
          </div>
        </div>
        <div className="pb-24">
          <div className={container}>
            <CtaSection
              eyebrow="Get started"
              title="Put every dollar on a budget"
              description="Set up in an afternoon. Free for teams under 10."
              primaryAction={{ label: "Start free", href: "#pricing" }}
              secondaryAction={{ label: "Book a demo", href: "#product" }}
              beamColor="#0f7a5f"
            />
          </div>
        </div>
      </main>
      <footer className="border-t border-black/[0.06]">
        <div className={`${container} grid gap-10 py-14 sm:grid-cols-[1.4fr_repeat(3,1fr)]`}>
          <div>
            <p className="flex items-center gap-2 text-[17px] font-semibold tracking-tight">
              <Mark className="size-5 text-[#0f7a5f]" />
              Pennant
            </p>
            <p className="mt-3 max-w-xs text-[14px] text-[#6b7572]">A fictional company. This page is a template built with alibar/ui.</p>
          </div>
          {[
            ["Product", ["Cards", "Agent budgets", "Bill pay", "Pricing"]],
            ["Company", ["About", "Customers", "Careers", "Press"]],
            ["Resources", ["Docs", "API", "Security", "Status"]],
          ].map(([title, links]) => (
            <div key={String(title)}>
              <p className="text-[13px] font-semibold">{title}</p>
              <ul className="mt-3 space-y-2 text-[14px] text-[#6b7572]">
                {(links as string[]).map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-[#0b0f0e]">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={`${container} flex flex-wrap justify-between gap-2 border-t border-black/[0.06] py-6 text-[13px] text-[#6b7572]`}>
          <p>© 2026 Pennant (fictional)</p>
          <Link href="/templates" className="hover:text-[#0b0f0e]">
            Built with alibar/ui · More templates
          </Link>
        </div>
      </footer>
    </div>
  );
}
