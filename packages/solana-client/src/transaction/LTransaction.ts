import * as beet from "@glow-xyz/beet";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { Buffer } from "buffer";
import { Base64, Hex, Solana } from "../base-types";
import {
  FixableGlowBorsh,
  GlowBorsh,
  GlowBorshTypes,
  InstructionRawType,
  TransactionInstructionFormat,
} from "../borsh";
import { GKeypair } from "../GKeypair";
import { getTransactionVersion } from "./transaction-utils";
import {
  SignatureInfo,
  TransactionAccount,
  TransactionInstruction,
  TransactionInterface,
} from "./TransactionInterface";

/**
 * This is for a legacy transactions which as of 2022-10-14 are
 * the most common transaction type.
 *
 * This is designed to resemble VTransaction. We are moving away from GTransaction
 * and I hope to phase it out by the end of the year.
 */
export class LTransaction implements TransactionInterface {
  #signatureInfos: Array<SignatureInfo>;
  readonly #byteLength: number;
  readonly #messageBuffer: Buffer;
  readonly #message: LegacyTransactionMessage;

  constructor({ base64 }: { base64: Base64 }) {
    const txBuffer = Buffer.from(base64, "base64");
    const { version, messageBuffer, signatures } = getTransactionVersion({
      buffer: txBuffer,
    });

    if (version !== "legacy") {
      throw new Error(
        `Unsupported transaction version. Expected legacy, received ${version}.`
      );
    }

    const message = LegacyTransactionMessageFormat.parse({
      buffer: messageBuffer,
    });

    if (!message) {
      throw new Error("Could not parse message.");
    }

    this.#byteLength = txBuffer.byteLength;
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

  get numRequiredSigs(): number {
    return this.#message.numRequiredSigs;
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

  get accounts(): Array<TransactionAccount> {
    const message = this.#message;

    const {
      numReadonlySigned,
      numReadonlyUnsigned,
      numRequiredSigs,
      addresses,
    } = message;

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

type LegacyTransactionMessage = {
  numRequiredSigs: number;
  numReadonlySigned: number;
  numReadonlyUnsigned: number;
  addresses: Solana.Address[];
  recentBlockhash: string;
  instructions: InstructionRawType[];
};

export const LegacyTransactionMessageFormat =
  new FixableGlowBorsh<LegacyTransactionMessage>({
    fields: [
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
    ],
  });
