import { FixedSizeBeet } from "@glow-xyz/beet";
import { FixableBeet } from "@glow-xyz/beet";
import { Buffer } from "buffer";

// https://github.com/solana-labs/solana/blob/master/web3.js/src/util/shortvec-encoding.ts
export namespace CompactArray {
  export const Borsh: FixableBeet<number, number> = {
    description: "CompactArrayLength",
    toFixedFromValue(value: number): FixedSizeBeet<number, number> {
      const { byteSize, buffer: bufferToInsert } = CompactArray.encodeLength({
        value,
      });

      return {
        byteSize,
        description: "CompactArrayLength",
        read: () => {
          return value;
        },
        write: (buffer, offset) => {
          bufferToInsert.copy(buffer, offset, 0);
        },
      };
    },
    toFixedFromData: (
      buffer: Buffer,
      offset: number
    ): FixedSizeBeet<number, number> => {
      const { value: length, byteSize } = CompactArray.decodeLength({
        buffer,
        offset,
      });

      return {
        byteSize,
        description: "CompactArrayLength",
        read: () => {
          return length;
        },
        write: (buffer, offset, value) => {
          const { buffer: bufferToInsert } = CompactArray.encodeLength({
            value,
          });
          bufferToInsert.copy(buffer, offset, 0);
        },
      };
    },
  };

  export function decodeLength({
                                 buffer,
                                 offset,
                               }: {
    buffer: Buffer;
    offset: number;
  }): {
    value: number;
    byteSize: number;
  } {
    let length = 0;
    let size = 0;

    for (;;) {
      const elem = buffer[offset + size];

      length |= (elem & 0x7f) << (size * 7);
      size += 1;
      if ((elem & 0x80) === 0) {
        break;
      }
    }

    return { value: length, byteSize: size };
  }

  export function encodeLength({ value }: { value: number }): {
    buffer: Buffer;
    byteSize: number;
  } {
    let rem_len = value;
    const bytes = [];

    for (;;) {
      let elem = rem_len & 0x7f;
      rem_len >>= 7;
      if (rem_len == 0) {
        bytes.push(elem);
        break;
      } else {
        elem |= 0x80;
        bytes.push(elem);
      }
    }

    return { buffer: Buffer.from(bytes), byteSize: bytes.length };
  }
}
