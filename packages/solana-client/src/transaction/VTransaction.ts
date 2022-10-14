import * as beet from "@glow-xyz/beet";
import bs58 from "bs58";
import { Buffer } from "buffer";
import nacl from "tweetnacl";
import { Base58, Base64, Solana } from "../base-types";
import {
  FixableGlowBorsh,
  GlowBorsh,
  InstructionRawType,
  TransactionInstructionFormat,
} from "../borsh";
import { SolanaRpcTypes } from "../client/rpc-types";
import { GKeypair } from "../GKeypair";
import { getTransactionVersion } from "./transaction-utils";

type Account = {
  address: Solana.Address;
  signer: boolean;
  writable: boolean;
  wasLookedUp: boolean;
};

type Instruction = {
  accounts: Solana.Address[];
  program: Solana.Address;
  data_base64: Base64;
};

type SignatureInfo = {
  signature: Base58;
  address: Solana.Address;
};

export class VTransaction {
  #signatureInfos: Array<SignatureInfo>;
  readonly #loadedAddresses: SolanaRpcTypes.LoadedAddresses;
  readonly #messageBuffer: Buffer;
  readonly #message: V0Message;

  constructor({
    transactionBase64,
    loadedAddresses,
  }: {
    transactionBase64: Base64;
    loadedAddresses: SolanaRpcTypes.LoadedAddresses;
  }) {
    const { version, messageBuffer, signatures } = getTransactionVersion({
      buffer: Buffer.from(transactionBase64, "base64"),
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

    this.#loadedAddresses = loadedAddresses;
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

  sign({ signers }: { signers: GKeypair[] }) {
    const newSigs = [...this.#signatureInfos];

    for (const { secretKey } of signers) {
      const keypair = nacl.sign.keyPair.fromSecretKey(secretKey);
      const address = bs58.encode(keypair.publicKey);

      // TODO: check if address is required to be a signer

      const signatureUint = nacl.sign.detached(this.#messageBuffer, secretKey);

      const accountIndex = this.#message.addresses.findIndex(
        (a) => a === address
      );
      newSigs[accountIndex] = {
        signature: bs58.encode(signatureUint),
        address,
      };
    }

    this.#signatureInfos = newSigs;
  }

  get instructions(): Array<Instruction> {
    const accounts = this.accounts;

    return this.#message.instructions.map((rawIx) => {
      return {
        accounts: rawIx.accountIdxs.map((idx) => accounts[idx].address),
        program: accounts[rawIx.programIdx].address,
        data_base64: rawIx.data.toString("base64"),
      };
    });
  }

  get accounts(): Array<Account> {
    const message = this.#message;
    const loadedAddresses = this.#loadedAddresses;

    const {
      numReadonlySigned,
      numReadonlyUnsigned,
      numRequiredSigs,
      addresses,
    } = message;

    const out: Account[] = addresses.map((address, idx) => ({
      address,
      signer: idx < numRequiredSigs,
      writable:
        idx < numRequiredSigs - numReadonlySigned ||
        (idx >= numRequiredSigs &&
          idx < addresses.length - numReadonlyUnsigned),
      wasLookedUp: false,
    }));

    for (const address of loadedAddresses.writable) {
      out.push({
        address,
        writable: true,
        signer: false,
        wasLookedUp: true,
      });
    }
    for (const address of loadedAddresses.readonly) {
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
    ["numRequiredSigs", beet.u8], // The first bit here will indicate if it's a versioned tx
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
