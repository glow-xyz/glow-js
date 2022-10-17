// This file is copied with modification from @wallet-standard/solana-chains

import { Network } from "@glow-xyz/glow-client";
import type { IdentifierString } from "@wallet-standard/base";

/** Solana Mainnet (beta) cluster, e.g. https://api.mainnet-beta.solana.com */
export const SOLANA_MAINNET_CHAIN = "solana:mainnet";

/** Solana Devnet cluster, e.g. https://api.devnet.solana.com */
export const SOLANA_DEVNET_CHAIN = "solana:devnet";

/** Array of Solana clusters (Glow doesn't support testnet) */
export const SOLANA_CHAINS = [
  SOLANA_MAINNET_CHAIN,
  SOLANA_DEVNET_CHAIN,
] as const;

/** Type of all Solana clusters */
export type SolanaChain = typeof SOLANA_CHAINS[number];

/**
 * Check if a chain corresponds with one of the Solana clusters.
 */
export function isSolanaChain(chain: IdentifierString): chain is SolanaChain {
  return SOLANA_CHAINS.includes(chain as SolanaChain);
}

/**
 * Map supported Solana clusters to supported Glow networks.
 */
export function getNetworkForChain(chain: SolanaChain): Network {
  switch (chain) {
    case SOLANA_MAINNET_CHAIN:
      return Network.Mainnet;
    case SOLANA_DEVNET_CHAIN:
      return Network.Devnet;
    default:
      return Network.Mainnet;
  }
}
