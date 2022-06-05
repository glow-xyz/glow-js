import * as beet from "@metaplex-foundation/beet";
import { FixableBeet, FixedSizeBeet } from "@metaplex-foundation/beet";
import bs58 from "bs58";
import { Base58 } from "../base-types";

import { CompactArray } from "./CompactArray";

export namespace GlowBorshTypes {
  // Specifically for transaction signatures
  export const signature: FixedSizeBeet<Base58, Base58> = {
    byteSize: 64,
    description: "Signature",
    read: function (buffer, offset) {
      const signatureLength = 64;
      const signatureBeet = beet.fixedSizeUint8Array(signatureLength);

      return bs58.encode(signatureBeet.read(buffer, offset));
    },
    write: function (buffer, offset, value) {
      const signatureLength = 64;
      const signatureBeet = beet.fixedSizeUint8Array(signatureLength);

      signatureBeet.write(buffer, offset, bs58.decode(value));
    },
  };

  /**
   * De/Serializes an array of signatures. Buffer consists of
   * - {@link CompactArray} length of variable size
   * - array of {@link GlowBorshTypes.signature}s
   */
  const fixedSizeSignaturesArray: (
    length: number
  ) => FixedSizeBeet<string[], string[]> = (length: number) => {
    const prefixByteSize = CompactArray.encodeLength({
      value: length,
    }).byteSize;

    return {
      byteSize: prefixByteSize + length * GlowBorshTypes.signature.byteSize,
      description: `TransactionSignaturesSection(${length})`,
      elementByteSize: GlowBorshTypes.signature.byteSize,
      lenPrefixByteSize: prefixByteSize,
      length,
      read: (buf: Buffer, offset: number) => {
        const lengthBorsh = CompactArray.Borsh.toFixedFromData(buf, offset);
        const length = lengthBorsh.read(buf, offset);
        const cursor = offset + lengthBorsh.byteSize;
        return beet
          .uniformFixedSizeArray(GlowBorshTypes.signature, length, false)
          .read(buf, cursor);
      },
      write: (buf: Buffer, offset: number, signatures: string[]) => {
        const lengthBorsh = CompactArray.Borsh.toFixedFromValue(
          signatures.length
        );
        lengthBorsh.write(buf, offset, signatures.length);
        const signaturesStartCursor = offset + lengthBorsh.byteSize;
        beet
          .uniformFixedSizeArray(GlowBorshTypes.signature, length, false)
          .write(buf, signaturesStartCursor, signatures);
      },
    };
  };

  /**
   * De/Serializes section of signatures in transaction header.
   * Uses {@link fixedSizeSignaturesArray} underneath.
   */
  export const transactionSignaturesSection: FixableBeet<string[], string[]> = {
    toFixedFromData(
      buf: Buffer,
      offset: number
    ): FixedSizeBeet<string[], string[]> {
      const { value: length } = CompactArray.decodeLength({
        buffer: buf,
        offset,
      });

      return fixedSizeSignaturesArray(length);
    },

    toFixedFromValue(signatures: string[]): FixedSizeBeet<string[], string[]> {
      return fixedSizeSignaturesArray(signatures.length);
    },

    description: `TransactionSignaturesSection`,
  };
}
