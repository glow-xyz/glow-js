import * as beet from "@glow-xyz/beet";
import { Buffer } from "buffer";
import { Base64, Solana } from "../base-types";
import {
  FixableGlowBorsh,
  GlowBorsh,
  InstructionRawType,
  TransactionInstructionFormat,
} from "../borsh";
import { SolanaRpcTypes } from "../client/rpc-types";
import { getTransactionVersion } from "./transaction-utils";

type Account = {
  address: Solana.Address;
  signer: boolean;
  writable: boolean;
  wasLookedUp: boolean;
  idx: number;
};

type Instruction = {
  accounts: Solana.Address[];
  program: Solana.Address;
  data_base64: Base64;
};

export class VTransaction {
  public transactionBase64: Base64;
  private meta: SolanaRpcTypes.TransactionRawMeta;

  // public signature: Base58 | null;
  // // public signatures: Array<{ signature: Base58; address: Solana.Address }>;
  // public recentBlockhash: Base58;
  //
  // private addressTableLookups: AddressTableLookup[];

  // private staticAddresses: Array<Solana.Address>;
  // private accountKeysFromLookups: {
  //   writable: Array<Solana.Address>;
  //   readonly: Array<Solana.Address>;
  // };

  constructor({
    transactionBase64,
    meta,
  }: {
    transactionBase64: Base64;
    meta: SolanaRpcTypes.TransactionRawMeta;
  }) {
    this.transactionBase64 = transactionBase64;
    this.meta = meta;
  }

  get addresses(): Solana.Address[] {
    return this.accounts.map((account) => account.address);
  }

  get instructions(): Array<Instruction> {
    const accounts = this.accounts;
    const message = this.message;

    return message.instructions.map((rawIx) => {
      return {
        accounts: rawIx.accountIdxs.map((idx) => accounts[idx].address),
        program: accounts[rawIx.programIdx].address,
        data_base64: rawIx.data.toString("base64"),
      };
    });
  }

  get accounts(): Array<Account> {
    const message = this.message;
    const loadedAddresses = this.meta.loadedAddresses;

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
      idx,
    }));

    for (const lookupTable of message.addressTableLookups) {
      for (const [
        writableIndex,
        overallIdx,
      ] of lookupTable.writableIndexes.entries()) {
        const address = loadedAddresses.writable[writableIndex];
        out.push({
          address,
          writable: true,
          signer: false,
          wasLookedUp: true,
          idx: overallIdx + addresses.length,
        });
      }

      for (const [
        readonlyIndex,
        overallIdx,
      ] of lookupTable.readonlyIndexes.entries()) {
        const address = loadedAddresses.readonly[readonlyIndex];
        out.push({
          address,
          writable: false,
          signer: false,
          wasLookedUp: true,
          idx: overallIdx + addresses.length,
        });
      }
    }

    return out;
  }

  get message(): V0Message {
    const buffer = Buffer.from(this.transactionBase64, "base64");
    const { messageBuffer } = getTransactionVersion({ buffer });

    const message = V0TransactionMessageFormat.parse({
      buffer: messageBuffer,
    });

    if (!message) {
      throw new Error("Could not parse message.");
    }

    return message;
  }
}

type AddressTableLookup = {
  lookupTableAddress: Solana.Address;
  writableIndexes: number[];
  readonlyIndexes: number[];
};

const AddressTableLookupFormat = new FixableGlowBorsh<AddressTableLookup>({
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

const V0TransactionMessageFormat = new FixableGlowBorsh<V0Message>({
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
        elemCoder: AddressTableLookupFormat,
      }),
    ],
  ],
});
