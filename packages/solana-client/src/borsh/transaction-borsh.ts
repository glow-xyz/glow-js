import * as beet from "@metaplex-foundation/beet";
import { FixableBeet, FixedSizeBeet } from "@metaplex-foundation/beet";
import { Buffer } from "buffer";
import { Solana } from "../base-types";
import { FixableGlowBorsh, GlowBorsh } from "./base";

type InstructionRaw = {
  programIdx: number;
  accountIdxs: number[];
  data: Buffer;
};

const TransactionInstruction: FixableBeet<InstructionRaw, InstructionRaw> = {
  description: "TransactionInstruction",
  toFixedFromValue: (
    ix: InstructionRaw
  ): FixedSizeBeet<InstructionRaw, InstructionRaw> => {
    const accountsCoderFixable = FixableGlowBorsh.compactArray({
      itemCoder: beet.u8,
    });
    const accountsCoder = accountsCoderFixable.toFixedFromValue(ix.accountIdxs);

    const dataCoderFixable = FixableGlowBorsh.compactArray({
      itemCoder: beet.u8,
    });
    const dataCoder = dataCoderFixable.toFixedFromValue(Array.from(ix.data));

    const byteSize = 1 + accountsCoder.byteSize + dataCoder.byteSize;

    return {
      description: "TransactionInstruction",
      write: function (buff: Buffer, offset: number, ix: InstructionRaw): void {
        let cursor = offset;
        beet.u8.write(buff, cursor, ix.programIdx);
        cursor += beet.u8.byteSize;

        accountsCoder.write(buff, cursor, ix.accountIdxs);
        cursor += accountsCoder.byteSize;

        dataCoder.write(buff, cursor, ix.accountIdxs);
      },

      read: function (buff: Buffer, offset: number): InstructionRaw {
        let cursor = offset;
        const programIdx = beet.u8.read(buff, cursor);
        cursor += beet.u8.byteSize;

        const accountIdxs = accountsCoder.read(buff, cursor);
        cursor += accountsCoder.byteSize;

        const data = dataCoder.read(buff, cursor);
        return { programIdx, accountIdxs, data: Buffer.from(data) };
      },
      byteSize,
    };
  },
  toFixedFromData: (
    buff: Buffer,
    offset: number
  ): FixedSizeBeet<InstructionRaw, InstructionRaw> => {
    let cursor = offset + 1; // + 1 for the programIdx which is a u8

    const accountsCoderFixable = FixableGlowBorsh.compactArray({
      itemCoder: beet.u8,
    });
    const accountsCoder = accountsCoderFixable.toFixedFromData(buff, cursor);
    cursor += accountsCoder.byteSize;

    const dataCoderFixable = FixableGlowBorsh.compactArray({
      itemCoder: beet.u8,
    });
    const dataCoder = dataCoderFixable.toFixedFromData(buff, cursor);

    const byteSize = 1 + accountsCoder.byteSize + dataCoder.byteSize;

    return {
      description: "TransactionInstruction",
      write: function (buf: Buffer, offset: number, ix: InstructionRaw): void {
        let cursor = offset;
        beet.u8.write(buff, cursor, ix.programIdx);
        cursor += beet.u8.byteSize;

        accountsCoder.write(buff, cursor, ix.accountIdxs);
        cursor += accountsCoder.byteSize;

        dataCoder.write(buff, cursor, ix.accountIdxs);
      },

      read: function (buf: Buffer, offset: number): InstructionRaw {
        let cursor = offset;
        const programIdx = beet.u8.read(buff, cursor);
        cursor += beet.u8.byteSize;

        const accountIdxs = accountsCoder.read(buff, cursor);
        cursor += accountsCoder.byteSize;

        const data = dataCoder.read(buff, cursor);
        return { programIdx, accountIdxs, data: Buffer.from(data) };
      },
      byteSize,
    };
  },
};

export const TRANSACTION_MESSAGE = new FixableGlowBorsh<{
  numRequiredSigs: number;
  numReadonlySigned: number;
  numReadonlyUnsigned: number;
  addresses: Solana.Address[];
  recentBlockhash: string;
  instructions: InstructionRaw[];
}>({
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
        elemCoder: TransactionInstruction,
      }),
    ],
  ],
});
