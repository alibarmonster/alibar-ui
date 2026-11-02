import { useMemo } from "react";
import { getAddress } from "viem";
import { formatAmount, formatUsd, parseAmount, toUsd, USD_DECIMALS } from "@/lib/web3/format";
import type { Token } from "@/lib/web3/types";

/**
 * A scripted wallet agent for prototypes and demos. It parses three simple intents with regular
 * expressions and returns the steps, the reply text and a transaction card to review. It never
 * talks to a wallet, an RPC or a model, and nothing it returns is signed. All amounts are bigint.
 */

/** A token the agent can move: its balance in token units and its USD price (USD_DECIMALS). */
export interface AgentToken extends Token {
  balance: bigint;
  price: bigint;
}

/** A saved contact, or a spender for approvals. */
export interface AgentContact {
  name: string;
  address: string;
}

interface CardBase {
  id: string;
  /** Network fee in USD with USD_DECIMALS. */
  networkFeeUsd: bigint;
}

export interface SwapCard extends CardBase {
  kind: "swap";
  from: AgentToken;
  to: AgentToken;
  amountIn: bigint;
  amountOut: bigint;
  /** Hops by symbol, e.g. ["ARB", "ETH", "USDC"]. */
  route: string[];
  feeBps: number;
  priceImpactBps: number;
}

export interface SendCard extends CardBase {
  kind: "send";
  token: AgentToken;
  amount: bigint;
  to: AgentContact;
}

export interface ApproveCard extends CardBase {
  kind: "approve";
  token: AgentToken;
  spender: AgentContact;
  /** Allowance in token units, or null for an unlimited allowance. */
  amount: bigint | null;
}

export type AgentActionCard = SwapCard | SendCard | ApproveCard;

export interface AgentReply {
  /** Tool steps shown one by one, e.g. "Checking balance". */
  steps: string[];
  /** The reply text, streamed in after the steps. */
  text: string;
  /** A transaction to review, if the request made one. */
  card?: AgentActionCard;
  /** Follow-up prompts offered as chips. */
  suggestions?: string[];
}

export interface WalletAgent {
  /** Answers a prompt with a scripted reply. */
  respond: (prompt: string) => AgentReply;
}

const FEE_BPS = 30;
const usd = (dollars: string) => parseAmount(dollars, USD_DECIMALS) ?? BigInt(0);
const NETWORK_FEE = { swap: usd("4.18"), send: usd("1.12"), approve: usd("0.86") };

/** A deterministic, checksummed placeholder address for a name (not a real account). */
export function placeholderAddress(seed: string) {
  let hex = "";
  for (let round = 0; hex.length < 40; round++) {
    let hash = 0x811c9dc5;
    for (const char of `${round}:${seed}`) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193);
    hash ^= hash >>> 15;
    hex += (hash >>> 0).toString(16).padStart(8, "0");
  }
  return getAddress(`0x${hex.slice(0, 40)}`);
}

/**
 * A quote from USD prices: a 0.3% fee plus price impact that grows with size (1 bp per $1,000,
 * capped at 25%). `jitterBps` nudges the output to simulate a refreshed quote.
 */
export function quoteSwap(from: AgentToken, to: AgentToken, amountIn: bigint, jitterBps = 0) {
  const usdIn = toUsd(amountIn, from.decimals, from.price);
  const thousand = BigInt(1000) * BigInt(10) ** BigInt(USD_DECIMALS);
  const impact = usdIn / thousand > BigInt(2500) ? 2500 : Number(usdIn / thousand);
  const usdOut = (usdIn * BigInt(10_000 - FEE_BPS - impact + jitterBps)) / BigInt(10_000);
  const amountOut = to.price > BigInt(0) ? (usdOut * BigInt(10) ** BigInt(to.decimals)) / to.price : BigInt(0);
  const stable = (t: Token) => ["USDC", "USDT", "DAI"].includes(t.symbol);
  const direct = from.symbol === "ETH" || to.symbol === "ETH" || (stable(from) && stable(to));
  return { amountOut, priceImpactBps: impact, route: direct ? [from.symbol, to.symbol] : [from.symbol, "ETH", to.symbol] };
}

const amountText = (token: AgentToken, value: bigint) => `${formatAmount(value, token.decimals)} ${token.symbol}`;
const usdText = (token: AgentToken, value: bigint) => formatUsd(toUsd(value, token.decimals, token.price));

let counter = 0;
const nextId = () => `card-${Date.now().toString(36)}-${(counter++).toString(36)}`;

const SWAP = /^(?:swap|trade|convert|exchange)\s+([\d.,]+|all|max)\s+([a-z0-9]+)\s+(?:to|for|into)\s+([a-z0-9]+)\b/i;
const SEND = /^(?:send|pay|transfer)\s+([\d.,]+)\s+([a-z0-9]+)\s+to\s+(.+?)\.?$/i;
const APPROVE = /^(?:approve|allow)\s+(unlimited|[\d.,]+)\s+([a-z0-9]+)\s+(?:for|to)\s+(.+?)\.?$/i;

/** Builds a scripted agent over the given tokens and contacts. */
export function createMockWalletAgent(tokens: AgentToken[], contacts: AgentContact[]): WalletAgent {
  const find = (symbol: string) => tokens.find((t) => t.symbol.toLowerCase() === symbol.toLowerCase());
  const help: AgentReply = {
    steps: ["Reading your request"],
    text: "I can prepare three kinds of transactions: a swap (\"swap 0.5 ETH to USDC\"), a payment to a saved contact (\"send 120 USDC to Maya\") or a token allowance (\"approve 500 USDC for Tidepool Router\"). Each one comes back as a card you review; nothing is signed until you approve it.",
    suggestions: ["Swap 0.5 ETH to USDC", `Send 50 USDC to ${contacts[0]?.name ?? "Maya"}`, "Approve 500 USDC for Tidepool Router"],
  };
  const unknownToken = (symbol: string): AgentReply => ({
    steps: ["Reading your request", "Looking up tokens"],
    text: `I couldn't find ${symbol.toUpperCase()} in this wallet. You hold ${tokens
      .filter((t) => t.balance > BigInt(0))
      .slice(0, 5)
      .map((t) => t.symbol)
      .join(", ")}.`,
    suggestions: tokens.slice(0, 2).length === 2 ? [`Swap 10 ${tokens[1].symbol} to ${tokens[0].symbol}`] : [],
  });

  return {
    respond(prompt) {
      const text = prompt.trim();

      const swap = text.match(SWAP);
      if (swap) {
        const from = find(swap[2]);
        const to = find(swap[3]);
        if (!from) return unknownToken(swap[2]);
        if (!to) return unknownToken(swap[3]);
        if (from.symbol === to.symbol) return { steps: ["Reading your request"], text: `${from.symbol} to ${to.symbol} is the same token, so there is nothing to swap.`, suggestions: [`Swap 0.1 ${from.symbol} to ${tokens.find((t) => t !== from)?.symbol ?? "USDC"}`] };
        const amountIn = /^(all|max)$/i.test(swap[1]) ? from.balance : (parseAmount(swap[1], from.decimals) ?? BigInt(0));
        if (amountIn <= BigInt(0)) return help;
        if (amountIn > from.balance) {
          return {
            steps: ["Checking balance"],
            text: `You have ${amountText(from, from.balance)}, which is less than the ${amountText(from, amountIn)} you asked to swap. I can prepare a swap for your full balance instead.`,
            suggestions: [`Swap max ${from.symbol} to ${to.symbol}`],
          };
        }
        const quote = quoteSwap(from, to, amountIn);
        return {
          steps: ["Checking balance", "Fetching quote", "Simulating transaction"],
          text: `Here's the best route I found: ${amountText(from, amountIn)} (${usdText(from, amountIn)}) for about ${amountText(to, quote.amountOut)}${quote.route.length > 2 ? ` through ${quote.route[1]}` : ""}. The quote refreshes every 15 seconds while you review it.`,
          card: { kind: "swap", id: nextId(), from, to, amountIn, amountOut: quote.amountOut, route: quote.route, feeBps: FEE_BPS, priceImpactBps: quote.priceImpactBps, networkFeeUsd: NETWORK_FEE.swap },
          suggestions: [`Send 25 ${to.symbol} to ${contacts[0]?.name ?? "Maya"}`, `Swap 0.1 ${to.symbol === "ETH" ? "USDC" : "ETH"} to ${to.symbol === "ETH" ? "ETH" : to.symbol}`],
        };
      }

      const send = text.match(SEND);
      if (send) {
        const token = find(send[2]);
        if (!token) return unknownToken(send[2]);
        const name = send[3].trim();
        const contact = contacts.find((c) => c.name.toLowerCase() === name.toLowerCase());
        if (!contact) {
          return {
            steps: ["Reading your request", "Searching contacts"],
            text: `I don't have a saved contact named ${name}. To keep payments safe I only send to saved contacts: ${contacts.map((c) => c.name).join(", ")}.`,
            suggestions: contacts.slice(0, 2).map((c) => `Send ${send[1]} ${token.symbol} to ${c.name}`),
          };
        }
        const amount = parseAmount(send[1], token.decimals) ?? BigInt(0);
        if (amount <= BigInt(0)) return help;
        if (amount > token.balance) {
          return { steps: ["Checking balance"], text: `You have ${amountText(token, token.balance)}, so I can't send ${amountText(token, amount)}.`, suggestions: [`Swap 0.5 ETH to ${token.symbol}`] };
        }
        return {
          steps: ["Checking balance", "Resolving contact", "Simulating transaction"],
          text: `Ready to send ${amountText(token, amount)} (${usdText(token, amount)}) to ${contact.name}. Check the address on the card before you approve.`,
          card: { kind: "send", id: nextId(), token, amount, to: contact, networkFeeUsd: NETWORK_FEE.send },
          suggestions: [`Send 10 ${token.symbol} to ${contacts.find((c) => c !== contact)?.name ?? contact.name}`, "Swap 0.25 ETH to USDC"],
        };
      }

      const approve = text.match(APPROVE);
      if (approve) {
        const token = find(approve[2]);
        if (!token) return unknownToken(approve[2]);
        const name = approve[3].trim();
        const spender = contacts.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? { name, address: placeholderAddress(`spender:${name.toLowerCase()}`) };
        const unlimited = /^unlimited$/i.test(approve[1]);
        const amount = unlimited ? null : (parseAmount(approve[1], token.decimals) ?? BigInt(0));
        return {
          steps: ["Reading your request", "Checking current allowance", "Simulating transaction"],
          text: unlimited
            ? `This lets ${spender.name} spend all of your ${token.symbol}, now and later. I'd suggest a cap instead; you can set one on the card.`
            : `This lets ${spender.name} spend up to ${amountText(token, amount ?? BigInt(0))}. You can lower or revoke it at any time.`,
          card: { kind: "approve", id: nextId(), token, spender, amount, networkFeeUsd: NETWORK_FEE.approve },
          suggestions: [`Swap 100 ${token.symbol} to ETH`],
        };
      }

      return help;
    },
  };
}

/** `createMockWalletAgent` as a hook, rebuilt only when the tokens or contacts change. */
export function useMockWalletAgent({ tokens, contacts }: { tokens: AgentToken[]; contacts: AgentContact[] }) {
  return useMemo(() => createMockWalletAgent(tokens, contacts), [tokens, contacts]);
}
