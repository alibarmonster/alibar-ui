"use client";

import { CardWallet, type WalletCard } from "@/components/ui/card-wallet/card-wallet";
import { mockAccount, mockBalances, mockTokens } from "@/lib/web3/mock";
import { toUsd } from "@/lib/web3/format";

// Fictional issuers and numbers: only the last four digits are ever shown.
const cards: WalletCard[] = [
  {
    id: "harbor",
    issuer: "Harbor Bank",
    product: "Everyday Metal",
    lastFour: "4821",
    holder: "Alibar",
    material: "metal",
    expires: "09/29",
    balance: 2481.2,
    balanceLabel: "Available balance",
    transactions: [
      { id: "t1", merchant: "Corner Roastery", detail: "Today · Coffee", amount: -4.8 },
      { id: "t2", merchant: "Salary", detail: "Yesterday · Studio North", amount: 3200 },
      { id: "t3", merchant: "Metro Pass", detail: "Mon · Transit", amount: -38 },
    ],
  },
  {
    id: "lumen",
    issuer: "Lumen Credit",
    product: "Black Reserve",
    lastFour: "0067",
    holder: "Alibar",
    material: "black",
    expires: "03/28",
    balance: 12750,
    balanceLabel: "Credit available",
    transactions: [
      { id: "t4", merchant: "Skyline Air", detail: "Today · Flights", amount: -642.5 },
      { id: "t5", merchant: "Hotel Ombak", detail: "Sat · Lodging", amount: -318 },
      { id: "t6", merchant: "Payment received", detail: "Fri · Thank you", amount: 1500 },
    ],
  },
  {
    id: "frost",
    issuer: "Frost & Co.",
    product: "Glass Membership",
    lastFour: "7710",
    holder: "Alibar",
    material: "glass",
    expires: "12/27",
    balance: 86,
    balanceLabel: "Points",
    transactions: [
      { id: "t7", merchant: "Bookshop Lantern", detail: "Today · +12 points", amount: 12 },
      { id: "t8", merchant: "Members' night", detail: "Wed · Redeemed", amount: -40 },
      { id: "t9", merchant: "Welcome bonus", detail: "Jan · Gift", amount: 100 },
    ],
  },
  {
    id: "atlas",
    issuer: "Atlas Pay",
    product: "Travel Card",
    lastFour: "3394",
    holder: "Alibar",
    material: "color",
    tint: "#0F766E",
    expires: "06/30",
    balance: 640.75,
    balanceLabel: "Travel wallet",
    transactions: [
      { id: "t10", merchant: "Night Market", detail: "Today · Food", amount: -12.4 },
      { id: "t11", merchant: "Top-up", detail: "Tue · From Harbor Bank", amount: 500 },
      { id: "t12", merchant: "Ferry Ticket", detail: "Sun · Transport", amount: -24 },
    ],
  },
];

export function Wallet() {
  return <CardWallet cards={cards} label="Wallet" />;
}

export function Rupiah() {
  const idr = cards.map((card) => ({
    ...card,
    balance: Math.round(card.balance * 16000),
    transactions: card.transactions.map((tx) => ({ ...tx, amount: Math.round(tx.amount * 16000) })),
  }));
  return <CardWallet cards={idr} label="Dompet" currency="IDR" locale="id-ID" />;
}

/** The Web3 mock tokens as cards: balances in USD from bigint math. */
export function Crypto() {
  const picks = ["ETH", "USDC", "WBTC"] as const;
  const crypto: WalletCard[] = picks.map((symbol, i) => {
    const token = mockTokens.find((t) => t.symbol === symbol)!;
    const usd = Number(toUsd(mockBalances[symbol] ?? BigInt(0), token.decimals, token.price)) / 1e8;
    return {
      id: symbol,
      issuer: "Harbor Wallet",
      product: token.name,
      lastFour: mockAccount.address.slice(-4).toUpperCase(),
      holder: mockAccount.label,
      material: (["black", "color", "metal"] as const)[i],
      tint: token.color,
      network: <span className="text-[3.6cqw] font-semibold tracking-[0.12em]">{symbol}</span>,
      balance: Math.round(usd * 100) / 100,
      balanceLabel: `${symbol} balance (USD)`,
      transactions: [
        { id: `${symbol}-1`, merchant: `Swap to ${symbol}`, detail: "2h ago · Simulated", amount: 120 },
        { id: `${symbol}-2`, merchant: "Sent to Raka", detail: "Yesterday · Simulated", amount: -45.5 },
        { id: `${symbol}-3`, merchant: "Staking reward", detail: "Mon · Simulated", amount: 3.21 },
      ],
    };
  });
  return <CardWallet cards={crypto} label="Crypto wallet" />;
}
