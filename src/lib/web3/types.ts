/** Shapes the web3 components accept. Your own token and chain objects only need these fields. */

export interface Token {
  symbol: string;
  name?: string;
  /** Token decimals: 18 for ETH, 6 for USDC. Amounts are bigint in these units. */
  decimals: number;
  address?: string;
  /** Logo URL. Without one, a generated avatar (colored circle and symbol) is shown. */
  iconUrl?: string;
  /** Avatar color for the generated icon. Picked from the symbol when omitted. */
  color?: string;
  /** USD price as a bigint with USD_DECIMALS (8) decimals. */
  price?: bigint;
}

export interface Chain {
  id: number;
  name: string;
  shortName?: string;
  iconUrl?: string;
  color?: string;
  /** Block explorer base URL without a trailing slash, e.g. https://etherscan.io */
  explorerUrl?: string;
  nativeSymbol?: string;
}

export interface WalletOption {
  id: string;
  name: string;
  /** Logo URL. Without one, a generated squircle with the wallet's initial is shown. */
  iconUrl?: string;
  color?: string;
  /** Shows a "Recent" badge. */
  recent?: boolean;
  /** The wallet is detected in this browser. */
  installed?: boolean;
  /** Connects by scanning a QR code with a phone instead of a browser extension. */
  qr?: boolean;
  /** Short helper line under the name. */
  description?: string;
}

/** Lifecycle of anything the user signs: every state gets its own visual. */
export type TxStatus = "idle" | "awaiting-signature" | "pending" | "confirmed" | "failed";

/** Explorer URL for an address or transaction, or undefined without an explorer. */
export function explorerLink(explorerUrl: string | undefined, kind: "address" | "tx", value: string) {
  return explorerUrl ? `${explorerUrl.replace(/\/$/, "")}/${kind}/${value}` : undefined;
}
