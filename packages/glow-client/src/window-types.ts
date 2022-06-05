import { PublicKey, Transaction } from "@solana/web3.js";
import EventEmitter from "eventemitter3";
import { z } from "zod";

export const AddressRegex = /^[5KL1-9A-HJ-NP-Za-km-z]{32,44}$/;
export const AddressZ = z.string().regex(AddressRegex);
export type Address = z.infer<typeof AddressZ>;

export enum Network {
  Mainnet = "mainnet",
  Devnet = "devnet",
  Localnet = "localnet",
}

/**
 * This is based off of:
 * https://github.com/solana-labs/wallet-adapter/blob/master/packages/wallets/phantom/src/adapter.ts#L26
 *
 * We want to be compatible with Phantom's interface. For `window.glow` we want to expose a nicer API
 * for people to consume. For example, instead of `.connect` we will expose `glow.signIn` which will
 * sign a message that includes a nonce + the time / recent blockhash + the origin.
 */
export interface PhantomWalletEvents {
  connect(...args: unknown[]): unknown;
  disconnect(...args: unknown[]): unknown;
  accountChanged(publicKey: PublicKey | null): unknown;
}

/**
 * The first version of the Glow API is compatible with Phantom's API to make it easier for dApps
 * to be compatible with Phantom and Glow.
 *
 * We plan on deviating from the Phantom API in `window.glow` which will offer an improved API
 * and better developer experience.
 */
export interface PhantomAdapter extends EventEmitter<PhantomWalletEvents> {
  // Properties
  publicKey?: { toBytes(): Uint8Array; toBase58(): string } | null;
  isConnected: boolean;

  // Methods
  connect: (params?: {
    onlyIfTrusted: true;
  }) => Promise<{ publicKey: PublicKey | null }>;
  disconnect: () => Promise<void>;
  signMessage: (
    message: Uint8Array
  ) => Promise<{ signature: Uint8Array | null }>;
  signTransaction: (
    transaction: Transaction,
    // The network parameter is not supported on Phantom
    network?: Network
  ) => Promise<Transaction>;
  signAllTransactions(
    transactions: Transaction[],
    // The network parameter is not supported on Phantom
    network?: Network
  ): Promise<Transaction[]>;
}

export interface GlowAdapter {
  signIn: () => Promise<{
    address: Address;
    signatureBase64: string;
    message: string;
  }>;
  connect: () => Promise<{ publicKey: PublicKey; address: Address }>;
  signOut: () => Promise<null>;
  signMessage: (params: {
    messageBase64: string;
  }) => Promise<{ signedMessageBase64: string }>;
  signAndSendTransaction: (params: {
    transactionBase64: string;
    network: Network;
    waitForConfirmation?: boolean;
  }) => Promise<{ signature: string }>;
  signTransaction: (params: {
    transactionBase64: string;
    network: Network;
  }) => Promise<{ signature: string; signedTransactionBase64: string }>;
}

export interface SolanaWindow extends Window {
  solana: PhantomAdapter;
  glowSolana: PhantomAdapter;
  glow: GlowAdapter;
}
