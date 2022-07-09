import * as beet from "@glow-xyz/beet";
import sum from "lodash/sum";
import range from "lodash/range";
import {
  BeetField,
  BeetStruct,
  FixableBeet,
  FixableBeetStruct,
  FixedBeetField,
  FixedSizeBeet,
  i64,
} from "@glow-xyz/beet";
import BN from "bn.js";
import { Buffer } from "buffer";
import { sha256 } from "js-sha256";
import { DateTime } from "luxon";
import { Solana } from "../base-types";
import { GlowError } from "../error";
import { GPublicKey } from "../GPublicKey";
import { CompactArray } from "./CompactArray";

/**
 * `new GlowBorsh(...)` is the equivalent of `new beet.BeetArgsStruct(...)`
 */
export class GlowBorsh<InOut> extends BeetStruct<InOut, InOut> {
  constructor({ fields }: { fields: FixedBeetField<InOut>[] }) {
    super(fields, (args) => args, "GlowBorsh");
  }

  toBuffer(instance: InOut): Buffer {
    return super.serialize(instance)[0];
  }

  parse({
    suppress_logs = true,
    ...params
  }: {
    suppress_logs?: boolean;
  } & (
    | {
        base64: string;
        buffer?: never;
        hex?: never;
      }
    | {
        base64?: never;
        buffer?: never;
        hex: string;
      }
    | {
        base64?: never;
        buffer: Buffer;
        hex?: never;
      }
  )): InOut | null {
    let buffer: Buffer;

    if (params.buffer != null) {
      buffer = params.buffer;
    } else if (params.base64 != null) {
      buffer = Buffer.from(params.base64, "base64");
    } else if (params.hex != null) {
      buffer = Buffer.from(params.hex, "hex");
    } else {
      throw new GlowError("Invalid data passed to parse function.", {
        extraData: { params },
      });
    }

    try {
      const [parsed] = super.deserialize(buffer);

      return parsed;
    } catch (error) {
      if (!suppress_logs) {
        console.error("Error parsing", error);
      }
      return null;
    }
  }

  static solAmount: FixedSizeBeet<Solana.SolAmount, Solana.SolAmount> = {
    byteSize: 8,
    description: "solAmount",
    read: function (buffer, offset) {
      const slice = buffer.slice(offset, offset + this.byteSize);
      const bn = new BN(slice, "le");
      return {
        lamports: bn.toString(),
      };
    },
    write: function (buffer, offset, value) {
      const bn = new BN(value.lamports);
      const bytesArray = bn.toArray("le", this.byteSize);
      const bytesArrayBuf = Buffer.from(bytesArray);
      bytesArrayBuf.copy(buffer, offset, 0, this.byteSize);
    },
  };

  static address: FixedSizeBeet<Solana.Address, Solana.Address> = {
    byteSize: GPublicKey.byteLength,
    description: "address",
    read: function (buffer, offset) {
      const slice = buffer.slice(offset, offset + GPublicKey.byteLength);
      const pkey = new GPublicKey(slice);
      return pkey.toString();
    },
    write: function (buffer, offset, address) {
      const addressBuffer = new GPublicKey(address).toBuffer();
      addressBuffer.copy(buffer, offset, 0, GPublicKey.byteLength);
    },
  };

  static addressNullable: FixedSizeBeet<
    Solana.Address | null,
    Solana.Address | null
  > = {
    byteSize: 32,
    description: "addressNullable",
    read: function (buffer, offset) {
      const address = GlowBorsh.address.read(buffer, offset);
      if (address === GPublicKey.nullString) {
        return null;
      }
      return address;
    },
    write: function (buffer, offset, address) {
      GlowBorsh.address.write(buffer, offset, address || GPublicKey.nullString);
    },
  };

  static tokenAmount: FixedSizeBeet<Solana.TokenAmount, Solana.TokenAmount> = {
    byteSize: 8,
    description: "tokenAmount",
    read: function (buffer, offset) {
      const slice = buffer.slice(offset, offset + this.byteSize);
      const bn = new BN(slice, "le");
      return {
        units: bn.toString(),
      };
    },
    write: function (buffer, offset, value) {
      const bn = new BN(value.units);
      const bytesArray = bn.toArray("le", this.byteSize);
      const bytesArrayBuf = Buffer.from(bytesArray);
      bytesArrayBuf.copy(buffer, offset, 0, this.byteSize);
    },
  };

  /**
   * Note, this is pretty different than the Borsh spec's serialization of a utf-8 string. Borsh
   * prefixes the string with 4 bytes that indicate the length of the string.
   *
   * This stores utf-8 bytes in a fixed length buffer. A string that does not fill the buffer will
   * be padded with 00 bytes which get decoded to the Unicode NULL \0 character. A string that is
   * too long to fit in the buffer will be truncated.
   */
  static utf8String = (length: number): FixedSizeBeet<string, string> => {
    return {
      write: function (buf: Buffer, offset: number, value: string) {
        const stringBuf = Buffer.alloc(length);
        stringBuf.write(value);
        stringBuf.copy(buf, offset, 0, length);
      },

      read: function (buf: Buffer, offset: number): string {
        const stringSlice: Buffer = buf.slice(offset, offset + length);
        return stringSlice.toString("utf8").replace(/\0/g, "");
      },

      elementByteSize: 1,
      length: length,
      lenPrefixByteSize: 0,
      byteSize: length,
      description: `GlowString(${length})`,
    };
  };

  /**
   * De/Serializes a UTF8 string of a particular size. This stores the size at the front of the array
   * while `utf8String` doesn't store the size.
   *
   * https://github.com/metaplex-foundation/beet/blob/82283026660e7e821ee5e05bb05dddb9ba30474b/beet/src/beets/string.ts
   */
  static fixedSizeUtf8String: (
    length: number
  ) => FixedSizeBeet<string, string> = (length: number) => {
    return {
      write: function (buf: Buffer, offset: number, value: string) {
        const stringBuf = Buffer.from(value, "utf-8");

        if (stringBuf.byteLength !== length) {
          throw new Error(`${value} has invalid byte size`);
        }
        beet.u32.write(buf, offset, length);
        stringBuf.copy(buf, offset + 4, 0, length);
      },

      read: function (buf: Buffer, offset: number): string {
        const size = beet.u32.read(buf, offset);
        if (size !== length) {
          return `invalid byte size`;
        }
        const stringSlice = buf.slice(offset + 4, offset + 4 + length);
        return stringSlice.toString("utf8").replace(/\0/g, "");
      },
      elementByteSize: 1,
      length: length,
      lenPrefixByteSize: 4,
      byteSize: 4 + length,
      description: `Utf8String(4 + ${length})`,
    };
  };

  /**
   * This improves on beet.u64 by making the type narrower
   */
  static u64: FixedSizeBeet<BN, BN> = {
    byteSize: 8,
    description: "u64",
    read: function (buffer, offset) {
      const slice = buffer.slice(offset, offset + 8);
      return new BN(slice, "le");
    },
    write: function (buffer, offset, bn) {
      const bytesArray = bn.toArray("le", 8);
      const bytesArrayBuf = Buffer.from(bytesArray);
      bytesArrayBuf.copy(buffer, offset, 0, 8);
    },
  };

  /**
   * The discriminator has a fixed value and the parsing only succeeds if the discriminator is equal
   * to the expected value.
   *
   * We can use the input / output value `null` since we never care about passing in or reading the
   * value from the discriminator, we just care it matches what we expect.
   */
  static discriminator = (hex: string): FixedSizeBeet<null, null> => {
    return {
      write: function (buf: Buffer, offset: number) {
        const stringBuf = Buffer.from(hex, "hex");
        if (stringBuf.byteLength !== 8) {
          throw new Error(`${hex} has invalid byte size`);
        }
        stringBuf.copy(buf, offset, 0, 8);
      },

      read: function (buf: Buffer, offset: number): null {
        const stringSlice: Buffer = buf.slice(offset, offset + 8);
        const expected = stringSlice.toString("hex");
        if (expected !== hex) {
          throw new Error("Did not get expected value.");
        }

        return null;
      },

      length: 8,
      byteSize: 8,
      description: `Discriminator`,
    };
  };

  /**
   * This is a single byte discriminator, this is often used with the SPL programs.
   */
  static discriminatorU8 = (num: number): FixedSizeBeet<null, null> => {
    if (num > 256) {
      throw new Error("u8 discriminator must be less than 8 bits.");
    }

    return {
      write: function (buf: Buffer, offset: number) {
        buf.writeUInt8(num, offset);
      },

      read: function (buf: Buffer, offset: number): null {
        const elem = buf.at(offset);
        if (elem !== num) {
          throw new Error("Did not get expected value.");
        }

        return null;
      },

      length: 1,
      byteSize: 1,
      description: `DiscriminatorU8`,
    };
  };

  /**
   * This is adapted from Anchor's `sighash` which creates a discriminator from
   * an instruction name.
   *
   * `ixName` should be `snake_case`
   */
  static ixDiscriminator = ({
    nameSpace = "global",
    ix_name,
  }: {
    nameSpace?: string;
    ix_name: string;
  }): FixedSizeBeet<null, null> => {
    const preimage = `${nameSpace}:${ix_name}`;
    const hex = Buffer.from(sha256.digest(preimage))
      .slice(0, 8)
      .toString("hex");
    return GlowBorsh.discriminator(hex);
  };

  /**
   * https://github.com/project-serum/anchor/blob/9c49e7642dbf9cfcbef122ff9d7785f3d885297d/ts/src/coder/borsh/accounts.ts#L96
   *
   * `AccountName` should be `PascalCase`
   */
  static accountDiscriminator = (
    AccountName: string
  ): FixedSizeBeet<null, null> => {
    const preimage = `account:${AccountName}`;
    const hex = Buffer.from(sha256.digest(preimage))
      .slice(0, 8)
      .toString("hex");
    return GlowBorsh.discriminator(hex);
  };

  /**
   * Seconds from epoch timestamp in i64 container.
   * Example usage in vote program: https://solscan.io/tx/67jJmMHBu1vqYc5dw8i6eS27aw8Xb1H7xNMWxHdbqvLyza5DY14ptKEpe8KUr9nKTWHHZ6D21otgVA6EPCWwRe9A
   */
  static timestamp: FixedSizeBeet<DateTime, DateTime> = {
    byteSize: 8,
    description: "timestamp",
    read: function (buffer, offset) {
      const timestamp = i64.read(buffer, offset);
      return DateTime.fromSeconds(
        typeof timestamp === "number" ? timestamp : timestamp.toNumber()
      );
    },
    write: function (buffer, offset, datetime) {
      const timestamp = new BN(datetime.toSeconds());
      i64.write(buffer, offset, timestamp);
    },
  };
}

/**
 * Sometimes (eg. when using an optional argument, beet.coption)
 * we need a less strict than fixed - fixable format.
 */
export class FixableGlowBorsh<InOut> extends FixableBeetStruct<InOut, InOut> {
  constructor({ fields }: { fields: BeetField<InOut, any>[] }) {
    super(fields, (args) => args, "FixableGlowBorsh");
  }

  parse({
    suppress_logs = true,
    ...params
  }: {
    suppress_logs?: boolean;
  } & (
    | {
        base64: string;
        buffer?: never;
        hex?: never;
      }
    | {
        base64?: never;
        buffer?: never;
        hex: string;
      }
    | {
        base64?: never;
        buffer: Buffer;
        hex?: never;
      }
  )): InOut | null {
    let buffer: Buffer;

    if (params.buffer != null) {
      buffer = params.buffer;
    } else if (params.base64 != null) {
      buffer = Buffer.from(params.base64, "base64");
    } else if (params.hex != null) {
      buffer = Buffer.from(params.hex, "hex");
    } else {
      throw new GlowError("Invalid data passed to parse function.", {
        extraData: { params },
      });
    }

    try {
      const [parsed] = super.deserialize(buffer);

      return parsed;
    } catch (error) {
      if (!suppress_logs) {
        console.error("Error parsing", error);
      }
      return null;
    }
  }

  toBuffer(data: InOut): Buffer {
    return super.serialize(data)[0];
  }

  static utf8String: FixableBeet<string, string> = {
    toFixedFromData(
      buf: Buffer,
      offset: number
    ): FixedSizeBeet<string, string> {
      const len = beet.u32.read(buf, offset);
      return GlowBorsh.fixedSizeUtf8String(len);
    },

    toFixedFromValue(val: string): FixedSizeBeet<string, string> {
      const len = Buffer.from(val).byteLength;
      return GlowBorsh.fixedSizeUtf8String(len);
    },

    description: `Utf8String`,
  };

  /**
   * This encodes an array of fixed size items with the length of the array a compact length
   * encoded number. This is used in Solana Transactions.
   */
  static compactArray = <Item>({
    itemCoder,
  }: {
    itemCoder: FixedSizeBeet<Item, Item>;
  }): FixableBeet<Item[], Item[]> => {
    return {
      description: "CompactArray",
      toFixedFromValue(val: Item[]): FixedSizeBeet<Item[], Item[]> {
        const compactArrayLength = CompactArray.Borsh.toFixedFromValue(
          val.length
        );
        const byteSize =
          compactArrayLength.byteSize + itemCoder.byteSize * val.length;

        return {
          description: "CompactArray",
          write: function (buf: Buffer, offset: number, items: Item[]): void {
            compactArrayLength.write(buf, offset, items.length);

            let cursor = offset + compactArrayLength.byteSize;
            for (const item of items) {
              itemCoder.write(buf, cursor, item);
              cursor += itemCoder.byteSize;
            }
          },

          read: function (buf: Buffer, offset: number): Item[] {
            let cursor = offset + compactArrayLength.byteSize;

            const output: Item[] = [];
            for (let i = 0; i < val.length; i++) {
              output.push(itemCoder.read(buf, cursor));
              cursor += itemCoder.byteSize;
            }

            return output;
          },
          byteSize,
        };
      },
      toFixedFromData(
        buff: Buffer,
        offset: number
      ): FixedSizeBeet<Item[], Item[]> {
        const compactArrayLength = CompactArray.Borsh.toFixedFromData(
          buff,
          offset
        );
        const length = compactArrayLength.read(buff, offset);
        const byteSize =
          compactArrayLength.byteSize + itemCoder.byteSize * length;

        return {
          description: "CompactArray",
          write: function (buf: Buffer, offset: number, items: Item[]): void {
            compactArrayLength.write(buf, offset, items.length);

            let cursor = offset + compactArrayLength.byteSize;
            for (const item of items) {
              itemCoder.write(buf, cursor, item);
              cursor += itemCoder.byteSize;
            }
          },

          read: function (buf: Buffer, offset: number): Item[] {
            let cursor = offset + compactArrayLength.byteSize;

            const output: Item[] = [];
            for (let i = 0; i < length; i++) {
              output.push(itemCoder.read(buf, cursor));
              cursor += itemCoder.byteSize;
            }

            return output;
          },
          byteSize,
        };
      },
    };
  };

  /**
   * This encodes an array of fixable size items.
   */
  static compactArrayFixable = <Item>({
    elemCoder,
  }: {
    elemCoder: FixableBeet<Item, Item>;
  }): FixableBeet<Item[], Item[]> => {
    return {
      description: "CompactArrayFixable",
      toFixedFromValue(items: Item[]): FixedSizeBeet<Item[], Item[]> {
        const compactArrayLength = CompactArray.Borsh.toFixedFromValue(
          items.length
        );
        const itemCoders = items.map((item) =>
          elemCoder.toFixedFromValue(item)
        );
        const itemsByteSize = sum(itemCoders.map((ic) => ic.byteSize));
        const byteSize = compactArrayLength.byteSize + itemsByteSize;

        return {
          description: "CompactArrayFixable",
          write: function (buf: Buffer, offset: number, items: Item[]): void {
            compactArrayLength.write(buf, offset, items.length);

            let cursor = offset + compactArrayLength.byteSize;
            for (const [idx, item] of items.entries()) {
              const itemCoder = itemCoders[idx];
              itemCoder.write(buf, cursor, item);
              cursor += itemCoder.byteSize;
            }
          },

          read: function (buf: Buffer, offset: number): Item[] {
            let cursor = offset + compactArrayLength.byteSize;

            const output: Item[] = [];
            for (let i = 0; i < items.length; i++) {
              const itemCoder = itemCoders[i];
              output.push(itemCoder.read(buf, cursor));
              cursor += itemCoder.byteSize;
            }

            return output;
          },
          byteSize,
        };
      },
      toFixedFromData(
        buff: Buffer,
        offset: number
      ): FixedSizeBeet<Item[], Item[]> {
        const compactArrayLength = CompactArray.Borsh.toFixedFromData(
          buff,
          offset
        );
        let cursor = offset + compactArrayLength.byteSize;
        const length = compactArrayLength.read(buff, offset);

        const itemCoders: FixedSizeBeet<Item>[] = [];
        for (const _idx of range(length)) {
          const itemCoder = elemCoder.toFixedFromData(buff, cursor);
          itemCoders.push(itemCoder);
          cursor += itemCoder.byteSize;
        }

        const itemsByteSize = sum(itemCoders.map((ic) => ic.byteSize));
        const byteSize = compactArrayLength.byteSize + itemsByteSize;

        return {
          description: "CompactArrayFixable",
          write: function (buf: Buffer, offset: number, items: Item[]): void {
            compactArrayLength.write(buf, offset, items.length);

            let cursor = offset + compactArrayLength.byteSize;
            for (const [idx, item] of items.entries()) {
              const itemCoder = itemCoders[idx];
              itemCoder.write(buf, cursor, item);
              cursor += itemCoder.byteSize;
            }
          },

          read: function (buf: Buffer, offset: number): Item[] {
            let cursor = offset + compactArrayLength.byteSize;

            const output: Item[] = [];
            for (const itemCoder of itemCoders) {
              output.push(itemCoder.read(buf, cursor));
              cursor += itemCoder.byteSize;
            }

            return output;
          },
          byteSize,
        };
      },
    };
  };
}
