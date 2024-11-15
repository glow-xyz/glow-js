import { Buffer } from "buffer";
import { Base58, Base64, Hex, Solana } from "../base-types";
import { GKeypair } from "../GKeypair";

export interface TransactionInterface {
  sign: (args: { signers: GKeypair[] }) => TransactionInterface;
  toBuffer: () => Buffer;
  toHex: () => Hex;
  toBase64: () => Base64;

  addresses: Solana.Address[];
  instructions: TransactionInstruction[];
  accounts: TransactionAccount[];
  signature: Solana.Signature;
  feePayer: Solana.Address;
  latestBlockhash: string;

  numRequiredSigs: number;
}

export type TransactionInstruction = {
  accounts: Solana.Address[];
  program: Solana.Address;
  data_base64: Base64;
};

export type TransactionAccount = {
  address: Solana.Address;
  signer: boolean;
  writable: boolean;
  wasLookedUp: boolean;
};

export type SignatureInfo = {
  signature: Base58;
  address: Solana.Address;
};
