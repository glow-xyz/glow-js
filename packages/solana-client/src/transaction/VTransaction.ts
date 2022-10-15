import * as beet from "@glow-xyz/beet";
import bs58 from "bs58";
import { Buffer } from "buffer";
import nacl from "tweetnacl";
import { Base64, Hex, Solana } from "../base-types";
import {
  FixableGlowBorsh,
  GlowBorsh,
  GlowBorshTypes,
  InstructionRawType,
  TransactionInstructionFormat,
} from "../borsh";
import { SolanaRpcTypes } from "../client/rpc-types";
import { GKeypair } from "../GKeypair";
import { getTransactionVersion } from "./transaction-utils";
import {
  SignatureInfo,
  TransactionAccount,
  TransactionInstruction,
  TransactionInterface,
} from "./TransactionInterface";

/**
 * This creates a Version 0 transaction. You need to have the lookup
 * tables populated when instantiating this or certain calls will error.
 */
export class VTransaction implements TransactionInterface {
  #signatureInfos: Array<SignatureInfo>;
  readonly #loadedAddresses: SolanaRpcTypes.LoadedAddresses;
  readonly #byteLength: number;
  readonly #messageBuffer: Buffer;
  readonly #message: V0Message;

  constructor({
    base64,
    loadedAddresses,
  }: {
    base64: Base64;
    loadedAddresses: SolanaRpcTypes.LoadedAddresses | null;
  }) {
    const txBuffer = Buffer.from(base64, "base64");
    const { version, messageBuffer, signatures } = getTransactionVersion({
      buffer: txBuffer,
    });

    if (version !== 0) {
      throw new Error(
        `Unsupported transaction version. Expected 0, received ${version}.`
      );
    }

    const message = V0TransactionMessageFormat.parse({
      buffer: messageBuffer,
    });

    if (!message) {
      throw new Error("Could not parse message.");
    }

    this.#byteLength = txBuffer.byteLength;
    this.#loadedAddresses = loadedAddresses || { writable: [], readonly: [] };
    this.#messageBuffer = messageBuffer;
    this.#message = message;
    this.#signatureInfos = signatures.map((signature, idx) => ({
      signature,
      address: message.addresses[idx],
    }));
  }

  get addresses(): Solana.Address[] {
    return this.accounts.map((account) => account.address);
  }

  toBuffer(): Buffer {
    const signatures = this.#signatureInfos.map((i) => i.signature);
    const signaturesCoder =
      GlowBorshTypes.transactionSignaturesSection.toFixedFromValue(signatures);

    const buffer = Buffer.alloc(this.#byteLength);
    signaturesCoder.write(buffer, 0, signatures);

    this.#messageBuffer.copy(buffer, signaturesCoder.byteSize);

    return buffer;
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

      const accountIndex = this.#message.addresses.findIndex(
        (a) => a === address
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

  get instructions(): Array<TransactionInstruction> {
    const accounts = this.accounts;

    return this.#message.instructions.map((rawIx) => {
      return {
        accounts: rawIx.accountIdxs.map((idx) => accounts[idx].address),
        program: accounts[rawIx.programIdx].address,
        data_base64: rawIx.data.toString("base64"),
      };
    });
  }

  get numRequiredSigs(): number {
    return this.#message.numRequiredSigs;
  }

  get accounts(): Array<TransactionAccount> {
    const message = this.#message;
    const loadedAddresses = this.#loadedAddresses;

    const {
      numReadonlySigned,
      numReadonlyUnsigned,
      numRequiredSigs,
      addresses,
    } = message;

    const out: TransactionAccount[] = addresses.map((address, idx) => ({
      address,
      signer: idx < numRequiredSigs,
      writable:
        idx < numRequiredSigs - numReadonlySigned ||
        (idx >= numRequiredSigs &&
          idx < addresses.length - numReadonlyUnsigned),
      wasLookedUp: false,
    }));

    for (const address of loadedAddresses?.writable ?? []) {
      out.push({
        address,
        writable: true,
        signer: false,
        wasLookedUp: true,
      });
    }
    for (const address of loadedAddresses?.readonly ?? []) {
      out.push({
        address,
        writable: false,
        signer: false,
        wasLookedUp: true,
      });
    }

    return out;
  }
}

type AddressTableLookup = {
  lookupTableAddress: Solana.Address;
  writableIndexes: number[];
  readonlyIndexes: number[];
};

const AddressTableLookup = new FixableGlowBorsh<AddressTableLookup>({
  fields: [
    ["lookupTableAddress", GlowBorsh.address],
    ["writableIndexes", FixableGlowBorsh.compactArray({ itemCoder: beet.u8 })],
    ["readonlyIndexes", FixableGlowBorsh.compactArray({ itemCoder: beet.u8 })],
  ],
});

type V0Message = {
  maskedVersion: number;
  numRequiredSigs: number;
  numReadonlySigned: number;
  numReadonlyUnsigned: number;
  addresses: Solana.Address[];
  recentBlockhash: string;
  instructions: InstructionRawType[];
  addressTableLookups: AddressTableLookup[];
};

export const V0TransactionMessageFormat = new FixableGlowBorsh<V0Message>({
  fields: [
    // In a very confusing naming format, they are calling the second version of txs "V0"
    // https://beta.docs.solana.com/proposals/transactions-v2
    ["maskedVersion", beet.u8], // The first bit here will indicate if it's a versioned tx
    ["numRequiredSigs", beet.u8],
    ["numReadonlySigned", beet.u8],
    ["numReadonlyUnsigned", beet.u8],
    [
      "addresses",
      FixableGlowBorsh.compactArray({ itemCoder: GlowBorsh.address }),
    ],
    ["recentBlockhash", GlowBorsh.address],
    [
      "instructions",
      FixableGlowBorsh.compactArrayFixable({
        elemCoder: TransactionInstructionFormat,
      }),
    ],
    [
      "addressTableLookups",
      FixableGlowBorsh.compactArrayFixable({
        elemCoder: AddressTableLookup,
      }),
    ],
  ],
});
