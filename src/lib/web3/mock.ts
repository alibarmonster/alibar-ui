import { getAddress, parseGwei, parseUnits, type Address, type Hash } from "viem";
import { arbitrum, base, mainnet, optimism, polygon } from "viem/chains";
import { toUsd, USD_DECIMALS } from "./format";

/**
 * Mock data for demos and docs only. Nothing here touches a wallet or an RPC: addresses and
 * hashes are generated from seeds, timestamps are fixed (so server and client render the same
 * thing), and every amount is a bigint with its decimals.
 */

/** Deterministic hex characters from a seed (FNV-1a, then a murmur3 finalizer). Not a real account, contract or transaction. */
function seededHex(seed: string, length: number) {
  let out = "";
  for (let round = 0; out.length < length; round++) {
    let hash = 0x811c9dc5;
    for (const char of `${round}:${seed}`) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193);
    hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
    hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
    hash ^= hash >>> 16;
    out += (hash >>> 0).toString(16).padStart(8, "0");
  }
  return out.slice(0, length);
}

/** A checksummed, made-up address for a seed. */
export const mockAddress = (seed: string): Address => getAddress(`0x${seededHex(seed, 40)}`);

/** A made-up 32-byte transaction hash for a seed. */
export const mockTxHash = (seed: string): Hash => `0x${seededHex(seed, 64)}`;

const usd = (value: string) => parseUnits(value, USD_DECIMALS);

// ── Chains ──────────────────────────────────────────────────────────────────

export interface MockChain {
  id: number;
  name: string;
  /** Short label for tight spaces. */
  shortName: string;
  nativeSymbol: string;
  /** Fill of the generated chain avatar. */
  color: string;
  /** Block explorer base URL, without a trailing slash. */
  explorerUrl: string;
}

function chainFrom(
  chain: { id: number; name: string; nativeCurrency: { symbol: string }; blockExplorers?: { default: { url: string } } },
  shortName: string,
  color: string,
): MockChain {
  return {
    id: chain.id,
    name: chain.name,
    shortName,
    nativeSymbol: chain.nativeCurrency.symbol,
    color,
    explorerUrl: (chain.blockExplorers?.default.url ?? "").replace(/\/$/, ""),
  };
}

export const mockChains: MockChain[] = [
  chainFrom(mainnet, "Ethereum", "#6366F1"),
  chainFrom(base, "Base", "#2563EB"),
  chainFrom(arbitrum, "Arbitrum", "#0EA5E9"),
  chainFrom(optimism, "Optimism", "#EF4444"),
  chainFrom(polygon, "Polygon", "#8B5CF6"),
];

export const getMockChain = (id: number) => mockChains.find((chain) => chain.id === id) ?? mockChains[0];

// ── Tokens ──────────────────────────────────────────────────────────────────

export interface MockToken {
  symbol: string;
  name: string;
  decimals: number;
  address: Address;
  chainId: number;
  /** USD price with USD_DECIMALS decimals. */
  price: bigint;
  /** 24h change as a ratio: 0.0123 is +1.23%. */
  change24h: number;
  /** Fill of the generated token avatar. */
  color: string;
}

function token(symbol: string, name: string, decimals: number, price: string, change24h: number, color: string): MockToken {
  return { symbol, name, decimals, address: mockAddress(`token:${symbol}`), chainId: mainnet.id, price: usd(price), change24h, color };
}

export const mockTokens: MockToken[] = [
  token("ETH", "Ether", 18, "3412.58", 0.0214, "#6366F1"),
  token("USDC", "USD Coin", 6, "1.0000", 0.0001, "#2563EB"),
  token("USDT", "Tether USD", 6, "0.9998", -0.0002, "#16A34A"),
  token("WBTC", "Wrapped Bitcoin", 8, "97234.10", 0.0087, "#F59E0B"),
  token("DAI", "Dai Stablecoin", 18, "1.0001", 0, "#EAB308"),
  token("ARB", "Arbitrum", 18, "0.8123", -0.0341, "#0EA5E9"),
  token("OP", "Optimism", 18, "1.7342", 0.0518, "#EF4444"),
  token("LINK", "Chainlink", 18, "18.42", -0.0126, "#3B82F6"),
  token("UNI", "Uniswap", 18, "9.87", 0.0093, "#EC4899"),
  token("AAVE", "Aave", 18, "284.30", 0.0412, "#8B5CF6"),
  token("POL", "Polygon", 18, "0.4120", -0.0077, "#A855F7"),
  token("NOVA", "Nova Protocol", 18, "0.000042", 0.1834, "#14B8A6"),
];

export const getMockToken = (symbol: string) => {
  const found = mockTokens.find((t) => t.symbol === symbol);
  if (!found) throw new Error(`Unknown mock token "${symbol}"`);
  return found;
};

/** Tokens offered as one-tap chips in selectors. */
export const popularTokenSymbols = ["ETH", "USDC", "USDT", "WBTC", "DAI"];

// ── Account and balances ────────────────────────────────────────────────────

export const mockAccount = {
  address: mockAddress("account:alibar"),
  label: "alibar",
  chainId: mainnet.id,
};

/** Wallet balances by symbol. Includes dust (DAI) and a zero balance (UNI) for edge cases. */
export const mockBalances: Record<string, bigint> = {
  ETH: parseUnits("2.481532", 18),
  USDC: parseUnits("1840.52", 6),
  USDT: parseUnits("250", 6),
  WBTC: parseUnits("0.0421", 8),
  DAI: parseUnits("0.42", 18),
  ARB: parseUnits("312.5", 18),
  OP: parseUnits("88.04", 18),
  LINK: parseUnits("45.12", 18),
  UNI: BigInt(0),
  AAVE: parseUnits("1.5", 18),
  POL: parseUnits("620", 18),
  NOVA: parseUnits("1250000", 18),
};

/** Total USD value of a set of balances, as a bigint with USD_DECIMALS. */
export function totalUsd(balances: Record<string, bigint> = mockBalances) {
  return mockTokens.reduce((sum, t) => sum + toUsd(balances[t.symbol] ?? BigInt(0), t.decimals, t.price), BigInt(0));
}

// ── Quotes ──────────────────────────────────────────────────────────────────

export interface MockQuote {
  amountIn: bigint;
  amountOut: bigint;
  /** amountOut after slippage: the least the swap may return. */
  minimumOut: bigint;
  /** Units of the output token per one whole input token, in output decimals. */
  rate: bigint;
  /** Price impact in basis points. */
  priceImpactBps: bigint;
  /** Protocol fee in basis points. */
  feeBps: bigint;
  /** Hops by symbol, e.g. ["ARB", "ETH", "USDC"]. */
  route: string[];
  /** Seconds until the quote should be refreshed. */
  expiresIn: number;
}

/**
 * A deterministic quote from the mock prices: a 0.3% fee plus price impact that grows with
 * size (1 bp per $1,000, capped at 25%). Pure bigint math.
 */
export function mockQuote(from: MockToken, to: MockToken, amountIn: bigint, slippageBps = BigInt(50)): MockQuote {
  const feeBps = BigInt(30);
  const usdIn = toUsd(amountIn, from.decimals, from.price);
  const thousand = BigInt(1000) * BigInt(10) ** BigInt(USD_DECIMALS);
  const priceImpactBps = usdIn / thousand > BigInt(2500) ? BigInt(2500) : usdIn / thousand;
  const usdOut = (usdIn * (BigInt(10_000) - feeBps - priceImpactBps)) / BigInt(10_000);
  const amountOut = (usdOut * BigInt(10) ** BigInt(to.decimals)) / to.price;
  const stable = (t: MockToken) => t.symbol === "USDC" || t.symbol === "USDT" || t.symbol === "DAI";
  const direct = from.symbol === "ETH" || to.symbol === "ETH" || (stable(from) && stable(to));
  return {
    amountIn,
    amountOut,
    minimumOut: (amountOut * (BigInt(10_000) - slippageBps)) / BigInt(10_000),
    rate: (from.price * BigInt(10) ** BigInt(to.decimals)) / to.price,
    priceImpactBps,
    feeBps,
    route: direct ? [from.symbol, to.symbol] : [from.symbol, "ETH", to.symbol],
    expiresIn: 20,
  };
}

// ── Gas ─────────────────────────────────────────────────────────────────────

export interface MockGasOption {
  id: "slow" | "standard" | "fast";
  label: string;
  /** Max fee per gas, in wei. */
  maxFeePerGas: bigint;
  /** Priority fee per gas, in wei. */
  priorityFee: bigint;
  /** Typical confirmation time, in seconds. */
  seconds: number;
}

export const mockGasOptions: MockGasOption[] = [
  { id: "slow", label: "Slow", maxFeePerGas: parseGwei("8"), priorityFee: parseGwei("0.5"), seconds: 180 },
  { id: "standard", label: "Standard", maxFeePerGas: parseGwei("12"), priorityFee: parseGwei("1"), seconds: 30 },
  { id: "fast", label: "Fast", maxFeePerGas: parseGwei("18"), priorityFee: parseGwei("2"), seconds: 12 },
];

/** Gas used by a typical swap. */
export const SWAP_GAS_UNITS = BigInt(150_000);

/** Network fee in wei for a gas option and gas amount. */
export const gasCost = (option: MockGasOption, gasUnits = SWAP_GAS_UNITS) => option.maxFeePerGas * gasUnits;

// ── Transactions ────────────────────────────────────────────────────────────

export type MockTxType = "swap" | "send" | "receive" | "approve" | "bridge" | "stake" | "claim";
export type MockTxStatus = "pending" | "confirmed" | "failed";

export interface MockTransaction {
  hash: Hash;
  type: MockTxType;
  status: MockTxStatus;
  /** ISO 8601 timestamp. */
  timestamp: string;
  chainId: number;
  from: Address;
  to: Address;
  /** One-line description, e.g. "Swap 0.5 ETH for 1,702.1 USDC". */
  summary: string;
  /** Main value moved, if any. */
  amount?: { symbol: string; value: bigint; decimals: number; direction: "in" | "out" };
  /** Network fee in wei. */
  fee: bigint;
}

const me = mockAccount.address;
const tx = (
  seed: string,
  type: MockTxType,
  status: MockTxStatus,
  timestamp: string,
  summary: string,
  to: Address,
  amount?: MockTransaction["amount"],
  fee = parseUnits("0.00184", 18),
): MockTransaction => ({
  hash: mockTxHash(`tx:${seed}`),
  type,
  status,
  timestamp,
  chainId: mainnet.id,
  from: type === "receive" ? mockAddress(`peer:${seed}`) : me,
  to: type === "receive" ? me : to,
  summary,
  ...(amount ? { amount } : {}),
  fee,
});

export const mockTransactions: MockTransaction[] = [
  tx("1", "swap", "pending", "2026-11-01T09:42:00Z", "Swap 0.5 ETH for USDC", mockAddress("contract:router"), {
    symbol: "ETH",
    value: parseUnits("0.5", 18),
    decimals: 18,
    direction: "out",
  }),
  tx("2", "receive", "confirmed", "2026-11-01T08:15:00Z", "Received 250 USDT", me, {
    symbol: "USDT",
    value: parseUnits("250", 6),
    decimals: 6,
    direction: "in",
  }),
  tx("3", "approve", "confirmed", "2026-10-31T19:03:00Z", "Approve USDC for swaps", mockAddress("contract:router"), undefined, parseUnits("0.00061", 18)),
  tx("4", "send", "failed", "2026-10-31T16:40:00Z", "Send 120 ARB", mockAddress("peer:raka"), {
    symbol: "ARB",
    value: parseUnits("120", 18),
    decimals: 18,
    direction: "out",
  }),
  tx("5", "bridge", "confirmed", "2026-10-30T11:27:00Z", "Bridge 0.8 ETH to Base", mockAddress("contract:bridge"), {
    symbol: "ETH",
    value: parseUnits("0.8", 18),
    decimals: 18,
    direction: "out",
  }),
  tx("6", "stake", "confirmed", "2026-10-29T21:10:00Z", "Stake 1.5 AAVE", mockAddress("contract:staking"), {
    symbol: "AAVE",
    value: parseUnits("1.5", 18),
    decimals: 18,
    direction: "out",
  }),
  tx("7", "claim", "confirmed", "2026-10-29T21:12:00Z", "Claim 0.0421 AAVE rewards", mockAddress("contract:staking"), {
    symbol: "AAVE",
    value: parseUnits("0.0421", 18),
    decimals: 18,
    direction: "in",
  }),
];
