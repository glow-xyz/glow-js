import * as beet from "@glow-xyz/beet";
import { FixableBeet, FixedSizeBeet } from "@glow-xyz/beet";
import bs58 from "bs58";
import { Buffer } from "buffer";
import { Base58 } from "../base-types";
import { FixableGlowBorsh } from "./base";

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

  export const signatureNullable: FixedSizeBeet<Base58 | null, Base58 | null> =
    {
      byteSize: 64,
      description: "SignatureNullable",
      read: function (buffer, offset) {
        const signatureLength = 64;
        const signatureBeet = beet.fixedSizeUint8Array(signatureLength);

        const signatureArray = signatureBeet.read(buffer, offset);
        if (signatureArray.every((byte) => byte === 0)) {
          return null;
        }
        return bs58.encode(signatureArray);
      },
      write: function (buffer, offset, value) {
        const signatureLength = 64;
        const signatureBeet = beet.fixedSizeUint8Array(signatureLength);

        signatureBeet.write(
          buffer,
          offset,
          value ? bs58.decode(value) : Buffer.alloc(64)
        );
      },
    };

  export const transactionSignaturesSection: FixableBeet<Base58[], Base58[]> =
    FixableGlowBorsh.compactArray({ itemCoder: GlowBorshTypes.signature });
}
