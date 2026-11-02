import { mockAddress } from "@/lib/web3/mock";
import type { DailyUsage, UsageCategory, UsageResource, UsageTeammate, UsageWorkflow } from "@/lib/usage/types";

/**
 * Demo-only usage and billing data. Everything here is fictional and deterministic (fixed dates, a
 * seeded generator), so server and browser render the same numbers. Money is integer cents,
 * credits are integers. Components never import this file; demos pass the data in as props.
 */

/** A small seeded generator (mulberry32), so "random" mock data is the same on every render. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Spend Meter ─────────────────────────────────────────────────────────────

/** This month's spend by resource, in cents. Totals $55.80. */
export const mockResources: UsageResource[] = [
  { id: "inference", name: "Model inference", amount: 3124, detail: "1.8M tokens across 3 models" },
  { id: "tools", name: "Tool calls", amount: 1606, detail: "4,212 calls to 18 tools" },
  { id: "storage", name: "Knowledge storage", amount: 850, detail: "12.4 GB indexed in 6 sources" },
];

/** The same month for a team on an IDR plan, in sen (Rp 892.800 total). */
export const mockResourcesIdr: UsageResource[] = [
  { id: "inference", name: "Model inference", amount: 49_984_000, detail: "1,8 jt token di 3 model" },
  { id: "tools", name: "Tool calls", amount: 25_696_000, detail: "4.212 panggilan ke 18 tool" },
  { id: "storage", name: "Knowledge storage", amount: 13_600_000, detail: "12,4 GB terindeks" },
];

// ── Categories ──────────────────────────────────────────────────────────────

/** Credit categories in their stable color order (see `categoryColor`). */
export const mockCategories: UsageCategory[] = [
  { id: "chat", name: "Chat & reasoning" },
  { id: "agents", name: "Agent runs" },
  { id: "search", name: "Search & retrieval" },
  { id: "media", name: "Images & audio" },
];

// ── Credit Trend: a 30-day billing cycle ────────────────────────────────────

/** The cycle runs Oct 20 to Nov 18, 2026 and renews Nov 19. "Today" is Nov 2 (day 14). */
export const mockCycle = {
  start: "2026-10-20",
  days: 30,
  today: "2026-11-02",
  renewsOn: "2026-11-19",
  /** Credits per day the plan allows (500,000 a cycle). */
  dailyBudget: 16_000,
};

function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Daily credits per category for the whole cycle; days after today have empty `values`. */
export const mockDailyUsage: DailyUsage[] = (() => {
  const rand = seeded(174);
  const base: Record<string, number> = { chat: 6200, agents: 4800, search: 2600, media: 1300 };
  const todayIndex = 13;
  return Array.from({ length: mockCycle.days }, (_, i) => {
    const date = addDays(mockCycle.start, i);
    if (i > todayIndex) return { date, values: {} };
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    const weekend = weekday === 0 || weekday === 6 ? 0.55 : 1;
    // Usage creeps up through the cycle, with a launch-day spike on day 9.
    const growth = 1 + i * 0.018 + (i === 9 ? 0.5 : 0);
    const values = Object.fromEntries(
      Object.entries(base).map(([id, credits]) => [id, Math.round((credits * weekend * growth * (0.8 + rand() * 0.4)) / 10) * 10]),
    );
    return { date, values };
  });
})();

// ── Workflows and teammates ─────────────────────────────────────────────────

const trend = (seed: number, start: number, drift: number) => {
  const rand = seeded(seed);
  return Array.from({ length: 14 }, (_, i) => Math.max(10, Math.round(start * (1 + drift * i) * (0.75 + rand() * 0.5))));
};

/** Workflows for the current cycle, credits and hours to date. */
export const mockWorkflows: UsageWorkflow[] = [
  { id: "triage", name: "Support ticket triage", subtitle: "On new ticket", category: "chat", runs: 3_412, hours: 142, credits: 71_400, previous: 62_100, trend: trend(1, 4800, 0.02) },
  { id: "research", name: "Account research brief", subtitle: "On new lead", category: "agents", runs: 618, hours: 206, credits: 64_900, previous: 70_300, trend: trend(2, 4900, -0.012) },
  { id: "digest", name: "Weekly metrics digest", subtitle: "Every Monday 08:00", category: "agents", runs: 52, hours: 39, credits: 18_200, previous: 15_800, trend: trend(3, 1200, 0.015) },
  { id: "kb", name: "Help center search", subtitle: "Widget on docs site", category: "search", runs: 9_870, hours: 61, credits: 33_600, previous: 28_900, trend: trend(4, 2300, 0.025) },
  { id: "review", name: "Pull request review", subtitle: "On opened PR", category: "chat", runs: 744, hours: 118, credits: 41_700, previous: 43_000, trend: trend(5, 3000, -0.004) },
  { id: "contracts", name: "Contract clause check", subtitle: "On upload to Legal", category: "search", runs: 212, hours: 84, credits: 22_300, previous: 17_100, trend: trend(6, 1500, 0.03) },
  { id: "thumbs", name: "Listing image variants", subtitle: "On new product", category: "media", runs: 1_390, hours: 27, credits: 19_800, previous: 21_400, trend: trend(7, 1450, -0.01) },
  { id: "voice", name: "Call summary voiceover", subtitle: "After each sales call", category: "media", runs: 305, hours: 22, credits: 9_400, previous: 6_200, trend: trend(8, 600, 0.04) },
];

/** Teammates for the current cycle. */
export const mockTeammates: UsageTeammate[] = [
  { id: "rina", name: "Rina Halim", role: "Support lead", category: "chat", runs: 2_980, hours: 131, credits: 68_200 },
  { id: "theo", name: "Theo Marsh", role: "Account executive", category: "agents", runs: 540, hours: 172, credits: 58_900 },
  { id: "ayu", name: "Ayu Pratama", role: "Staff engineer", category: "chat", runs: 812, hours: 109, credits: 44_100 },
  { id: "jonas", name: "Jonas Weber", role: "Docs and community", category: "search", runs: 6_420, hours: 57, credits: 31_800 },
  { id: "mei", name: "Mei Tanaka", role: "Legal counsel", category: "search", runs: 230, hours: 88, credits: 23_600 },
  { id: "omar", name: "Omar Haddad", role: "Growth designer", category: "media", runs: 1_510, hours: 41, credits: 24_900 },
  { id: "lena", name: "Lena Novak", role: "Operations", category: "agents", runs: 104, hours: 46, credits: 19_900 },
];

/** Scale a list of workflows or teammates to another period, with a little variance per row. */
function scaleRows<T extends { runs: number; hours: number; credits: number; previous?: number }>(rows: T[], factor: number, seed: number): T[] {
  const rand = seeded(seed);
  return rows.map((row) => {
    const f = factor * (0.85 + rand() * 0.3);
    return {
      ...row,
      runs: Math.max(1, Math.round(row.runs * f)),
      hours: Math.max(1, Math.round(row.hours * f)),
      credits: Math.round((row.credits * f) / 10) * 10,
      ...(row.previous !== undefined ? { previous: Math.round((row.previous * f) / 10) * 10 } : {}),
    };
  });
}

/** Credit Breakdown periods: last 7 days, 30 days and the quarter. */
export const mockBreakdownPeriods = [
  { id: "7d", label: "7 days", workflows: scaleRows(mockWorkflows, 0.24, 11), teammates: scaleRows(mockTeammates, 0.24, 12) },
  { id: "30d", label: "30 days", workflows: mockWorkflows, teammates: mockTeammates },
  { id: "quarter", label: "Quarter", workflows: scaleRows(mockWorkflows, 2.85, 13), teammates: scaleRows(mockTeammates, 2.85, 14) },
];

/** The plan shown in Credit Breakdown's header. */
export const mockPlan = { name: "Team Pro", included: 500_000, used: 427_200, renewsOn: "2026-11-19" };

// ── Printed Receipt ─────────────────────────────────────────────────────────

/** A fictional coffee roaster. */
export const mockMerchant = {
  name: "Kettle & Kiln Roasters",
  address: ["48 Harbour Lane", "Portside, NC 28411"],
  phone: "(910) 555-0142",
};

/** One order, cents. Card number is fictional; only a brand name and last four are shown. */
export const mockOrder = {
  number: "KK-20481",
  date: "2026-11-02T09:41:00Z",
  items: [
    { id: "1", name: "Ethiopia Guji, whole bean", qty: 2, price: 1850, note: "340 g · light roast" },
    { id: "2", name: "Ceramic pour-over cone", qty: 1, price: 2400, note: "Speckled sand" },
    { id: "3", name: "Paper filters (100)", qty: 1, price: 650 },
    { id: "4", name: "Oat flat white", qty: 1, price: 525, note: "Extra shot" },
  ],
  adjustments: [
    { id: "code", label: "Code BREWDAY", amount: -730 },
    { id: "ship", label: "Shipping", amount: 595 },
  ],
  taxRate: 0.0725,
  payment: { type: "card" as const, brand: "Orbit", lastFour: "4821" },
  delivery: { method: "Ground · 2–4 days", to: "J. Rivera, Wilmington NC" },
};

/** The same receipt in IDR for a Jakarta café, in sen. */
export const mockOrderIdr = {
  number: "KK-JKT-0917",
  date: "2026-11-02T02:41:00Z",
  items: [
    { id: "1", name: "Kopi susu gula aren", qty: 2, price: 2_800_000 },
    { id: "2", name: "Croissant mentega", qty: 1, price: 3_200_000, note: "Dipanaskan" },
    { id: "3", name: "Biji kopi Gayo 250 g", qty: 1, price: 11_500_000 },
  ],
  adjustments: [{ id: "member", label: "Diskon member", amount: -1_500_000 }],
  taxRate: 0.11,
  payment: { type: "card" as const, brand: "Orbit", lastFour: "7302" },
};

export const mockMerchantIdr = { name: "Kettle & Kiln Kemang", address: ["Jl. Kemang Raya 12", "Jakarta Selatan 12730"] };

// ── Wallet Agent Chat ───────────────────────────────────────────────────────

/** Saved contacts for the wallet agent. Addresses are generated, not real. */
export const mockContacts = [
  { name: "Maya", address: mockAddress("contact:maya") },
  { name: "Rafi", address: mockAddress("contact:rafi") },
  { name: "Studio Pay", address: mockAddress("contact:studio") },
];

/** Starter prompts for the empty state. */
export const mockStarterPrompts = [
  { title: "Swap tokens", prompt: "Swap 0.5 ETH to USDC" },
  { title: "Pay a contact", prompt: "Send 120 USDC to Maya" },
  { title: "Set an allowance", prompt: "Approve 500 USDC for Tidepool Router" },
];
