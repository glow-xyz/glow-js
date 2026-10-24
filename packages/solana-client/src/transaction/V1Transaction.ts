import { Buffer } from "buffer";

import bs58 from "bs58";
import nacl from "tweetnacl";

import { Base58, Base64, Hex, Solana } from "../base-types";
import { InstructionRawType } from "../borsh";
import { GKeypair } from "../GKeypair";
import {
  SignatureInfo,
  TransactionAccount,
  TransactionInstruction,
  TransactionInterface,
} from "./TransactionInterface";

export const V1_VERSION_BYTE = 0x81;

const SIGNATURE_LENGTH = 64;
const ADDRESS_LENGTH = 32;

/**
 * Fields set in the transaction's config mask. A field is null when its bit
 * isn't set, which matches how the RPC returns `transactionConfig`.
 */
export type V1TransactionConfig = {
  priorityFee: number | null; // Total lamports, not a per-CU price
  computeUnitLimit: number | null;
  loadedAccountsDataSizeLimit: number | null;
  heapSize: number | null;
};

type V1Message = {
  numRequiredSigs: number;
  numReadonlySigned: number;
  numReadonlyUnsigned: number;
  latestBlockhash: string;
  addresses: Solana.Address[];
  config: V1TransactionConfig;
  instructions: InstructionRawType[];
};

/**
 * This is for v1 transactions, which have no address lookup tables and put
 * compute budget settings in the message instead of in instructions.
 * https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0385-transaction-v1.md
 */
export class V1Transaction implements TransactionInterface {
  #signatureInfos: Array<SignatureInfo>;
  readonly #messageBuffer: Buffer;
  readonly #message: V1Message;

  constructor({ base64 }: { base64: Base64 }) {
    const { message, messageBuffer, signatures } = parseV1Transaction({
      buffer: Buffer.from(base64, "base64"),
    });

    this.#messageBuffer = messageBuffer;
    this.#message = message;
    this.#signatureInfos = signatures.map((signature, idx) => ({
      signature,
      address: message.addresses[idx],
    }));
  }

  get addresses(): Solana.Address[] {
    return this.#message.addresses;
  }

  get latestBlockhash(): string {
    return this.#message.latestBlockhash;
  }

  get config(): V1TransactionConfig {
    return this.#message.config;
  }

  toBuffer(): Buffer {
    // Unlike legacy and v0 transactions, signatures come after the message
    return Buffer.concat([
      this.#messageBuffer,
      ...this.#signatureInfos.map((i) => Buffer.from(bs58.decode(i.signature))),
    ]);
  }

  toBase64(): Base64 {
    return this.toBuffer().toString("base64");
  }

  toHex(): Hex {
    return this.toBuffer().toString("hex");
  }

  sign({ signers }: { signers: GKeypair[] }) {
    const newSigs = [...this.#signatureInfos];

    for (const { secretKey } of signers) {
      const keypair = nacl.sign.keyPair.fromSecretKey(secretKey);
      const address = bs58.encode(keypair.publicKey);

      const accountIndex = this.#signatureInfos.findIndex(
        (i) => i.address === address,
      );
      if (accountIndex === -1) {
        continue;
      }

      const signatureUint = nacl.sign.detached(this.#messageBuffer, secretKey);

      newSigs[accountIndex] = {
        signature: bs58.encode(signatureUint),
        address,
      };
    }

    this.#signatureInfos = newSigs;

    return this;
  }

  get feePayer(): Solana.Address {
    return this.#signatureInfos[0].address;
  }

  get signature(): Solana.Signature {
    return this.#signatureInfos[0].signature;
  }

  get instructions(): Array<TransactionInstruction> {
    const addresses = this.#message.addresses;

    return this.#message.instructions.map((rawIx) => ({
      accounts: rawIx.accountIdxs.map((idx) => addresses[idx]),
      program: addresses[rawIx.programIdx],
      data_base64: rawIx.data.toString("base64"),
    }));
  }

  get numRequiredSigs(): number {
    return this.#message.numRequiredSigs;
  }

  get accounts(): Array<TransactionAccount> {
    const {
      numReadonlySigned,
      numReadonlyUnsigned,
      numRequiredSigs,
      addresses,
    } = this.#message;

    return addresses.map((address, idx) => ({
      address,
      signer: idx < numRequiredSigs,
      writable:
        idx < numRequiredSigs - numReadonlySigned ||
        (idx >= numRequiredSigs &&
          idx < addresses.length - numReadonlyUnsigned),
      wasLookedUp: false,
    }));
  }
}

/**
 * Splits a v1 transaction into its message and signatures. Throws if the
 * buffer is not a well-formed v1 transaction.
 *
 * Layout: version (u8), header (u8 x3), config mask (u32), blockhash,
 * num instructions (u8), num addresses (u8), addresses, config values,
 * instruction headers (u8, u8, u16), instruction payloads, signatures.
 */
export const parseV1Transaction = ({
  buffer,
}: {
  buffer: Buffer;
}): {
  message: V1Message;
  messageBuffer: Buffer;
  signatures: Base58[];
} => {
  let cursor = 0;
  const take = (length: number): Buffer => {
    if (cursor + length > buffer.length) {
      throw new Error("Cannot parse v1 transaction: unexpected end of data.");
    }
    const bytes = buffer.subarray(cursor, cursor + length);
    cursor += length;
    return bytes;
  };

  if (take(1)[0] !== V1_VERSION_BYTE) {
    throw new Error("Cannot parse v1 transaction: wrong version byte.");
  }

  const [numRequiredSigs, numReadonlySigned, numReadonlyUnsigned] = take(3);
  const configMask = take(4).readUInt32LE(0);
  const latestBlockhash = bs58.encode(take(ADDRESS_LENGTH));
  const numInstructions = take(1)[0];
  const numAddresses = take(1)[0];

  if (numReadonlySigned >= numRequiredSigs) {
    throw new Error("Cannot parse v1 transaction: invalid header.");
  }
  if (numAddresses < numRequiredSigs + numReadonlyUnsigned) {
    throw new Error("Cannot parse v1 transaction: too few addresses.");
  }

  const addresses: Solana.Address[] = [];
  for (let i = 0; i < numAddresses; i++) {
    addresses.push(bs58.encode(take(ADDRESS_LENGTH)));
  }

  const config = parseConfigValues({ configMask, take });

  const instructionHeaders: Array<{
    programIdx: number;
    numAccounts: number;
    numDataBytes: number;
  }> = [];
  for (let i = 0; i < numInstructions; i++) {
    const header = take(4);
    instructionHeaders.push({
      programIdx: header[0],
      numAccounts: header[1],
      numDataBytes: header.readUInt16LE(2),
    });
  }

  const instructions: InstructionRawType[] = instructionHeaders.map(
    ({ programIdx, numAccounts, numDataBytes }) => {
      const accountIdxs = Array.from(take(numAccounts));
      if ([programIdx, ...accountIdxs].some((idx) => idx >= numAddresses)) {
        throw new Error("Cannot parse v1 transaction: invalid account index.");
      }
      return {
        programIdx,
        accountIdxs,
        data: Buffer.from(take(numDataBytes)),
      };
    },
  );

  const messageBuffer = buffer.subarray(0, cursor);

  const signatures: Base58[] = [];
  for (let i = 0; i < numRequiredSigs; i++) {
    signatures.push(bs58.encode(take(SIGNATURE_LENGTH)));
  }

  if (cursor !== buffer.length) {
    throw new Error("Cannot parse v1 transaction: trailing data.");
  }

  return {
    message: {
      numRequiredSigs,
      numReadonlySigned,
      numReadonlyUnsigned,
      latestBlockhash,
      addresses,
      config,
      instructions,
    },
    messageBuffer,
    signatures,
  };
};

// Each set bit in the mask is 4 bytes of config values, in bit order. The
// priority fee is a u64, so it uses both bits 0 and 1.
const parseConfigValues = ({
  configMask,
  take,
}: {
  configMask: number;
  take: (length: number) => Buffer;
}): V1TransactionConfig => {
  const config: V1TransactionConfig = {
    priorityFee: null,
    computeUnitLimit: null,
    loadedAccountsDataSizeLimit: null,
    heapSize: null,
  };

  const hasBit = (bit: number) => (configMask & (1 << bit)) !== 0;
  if (hasBit(0) !== hasBit(1)) {
    throw new Error("Cannot parse v1 transaction: invalid priority fee bits.");
  }

  for (let bit = 0; bit < 32; bit++) {
    if (!hasBit(bit)) {
      continue;
    }

    if (bit === 0) {
      // Lamport totals fit well within Number.MAX_SAFE_INTEGER
      config.priorityFee = Number(take(8).readBigUInt64LE(0));
      bit++;
    } else if (bit === 2) {
      config.computeUnitLimit = take(4).readUInt32LE(0);
    } else if (bit === 3) {
      config.loadedAccountsDataSizeLimit = take(4).readUInt32LE(0);
    } else if (bit === 4) {
      config.heapSize = take(4).readUInt32LE(0);
    } else {
      // Skip fields added after this was written
      take(4);
    }
  }

  return config;
};
