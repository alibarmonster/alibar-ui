/** Money is integer minor units (cents, or sen for IDR); credits are integers. */

export interface UsageCategory {
  id: string;
  name: string;
}

export interface UsageResource {
  id: string;
  name: string;
  /** Amount spent this period, in minor units (cents). */
  amount: number;
  /** A detail line, e.g. "1.8M tokens across 3 models". */
  detail?: string;
}

export interface DailyUsage {
  /** ISO date, "2026-10-15". */
  date: string;
  /** Credits per category id. Days after today are left out of `values` (an empty object). */
  values: Record<string, number>;
}

export interface UsageWorkflow {
  id: string;
  name: string;
  /** A subtitle such as the trigger ("On new ticket"). */
  subtitle?: string;
  /** Category id. */
  category: string;
  runs: number;
  /** Hours of work returned. */
  hours: number;
  credits: number;
  /** Credits in the previous cycle, for the change column. */
  previous?: number;
  /** Recent daily credits, for the sparkline. */
  trend?: number[];
}

export interface UsageTeammate {
  id: string;
  name: string;
  role: string;
  /** Category the teammate spends most on. */
  category: string;
  runs: number;
  hours: number;
  credits: number;
}
