import * as beet from "@glow-xyz/beet";
import { TransactionInstruction } from "@solana/web3.js";
import { Buffer } from "buffer";
import { Base58, Base64, Solana } from "../base-types";
import {
  FixableGlowBorsh,
  GlowBorsh,
  GlowBorshTypes,
  InstructionRawType,
  TransactionInstructionFormat,
} from "../borsh";
import { SolanaRpcTypes } from "../client/rpc-types";

export class VTransaction {
  public transactionBase64: Base64;
  private meta: SolanaRpcTypes.TransactionRawMeta;

  public signature: Base58 | null;
  public signatures: Array<{ signature: Base58; address: Solana.Address }>;
  public recentBlockhash: Base58;

  private addressTableLookups: AddressTableLookup[];

  constructor({
    transactionBase64,
    meta,
  }: {
    transactionBase64: Base64;
    meta: SolanaRpcTypes.TransactionRawMeta;
  }) {
    this.transactionBase64 = transactionBase64;
    this.meta = meta;

    this.parse();
  }

  private parse = () => {
    // Figure out what everything is
    const buffer = Buffer.from(this.transactionBase64, "base64");
    const signaturesCoder =
      GlowBorshTypes.transactionSignaturesSection.toFixedFromData(buffer, 0);

    const sigs = signaturesCoder.read(buffer, 0);

    this.signatures = sigs.map((signature) => ({ signature, address: null }));
    this.recentBlockhash = "";
    this.addressTableLookups = [];
  };
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

const V0TransactionMessageFormat = new FixableGlowBorsh<{
  numRequiredSigs: number;
  numReadonlySigned: number;
  numReadonlyUnsigned: number;
  addresses: Solana.Address[];
  recentBlockhash: string;
  instructions: InstructionRawType[];
  addressTableLookups: AddressTableLookup[];
}>({
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
