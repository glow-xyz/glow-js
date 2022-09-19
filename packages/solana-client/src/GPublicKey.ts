/**
 * This is a lighter version of the public key in `@solana/web3.js`
 */
import BN from "bn.js";
import bs58 from "bs58";
import { Buffer } from "buffer";

/**
 * Value to be converted into public key
 */
export type PublicKeyInitData =
  | number
  | string
  | Buffer
  | Uint8Array
  | Array<number>
  | PublicKeyData;

/**
 * JSON object representation of GPublicKey class
 */
export type PublicKeyData = {
  _bn: BN;
};

function isPublicKeyData(value: PublicKeyInitData): value is PublicKeyData {
  return (value as PublicKeyData)._bn !== undefined;
}

export class GPublicKey {
  private _bn: BN;

  /**
   * Create a new GPublicKey object
   * @param value ed25519 public key as buffer or base-58 encoded string
   */
  constructor(value: PublicKeyInitData) {
    if (isPublicKeyData(value)) {
      this._bn = value._bn;
    } else {
      if (typeof value === "string") {
        // assume base 58 encoding by default
        const decoded = bs58.decode(value);
        if (decoded.length != 32) {
          throw new Error(`Invalid public key input`);
        }
        this._bn = new BN(decoded);
      } else {
        this._bn = new BN(value);
      }

      if (this._bn.byteLength() > 32) {
        throw new Error(`Invalid public key input`);
      }
    }
  }

  static nullString: string = "11111111111111111111111111111111";

  static default: GPublicKey = new GPublicKey(GPublicKey.nullString);

  static byteLength: number = 32;

  equals(publicKey: GPublicKey): boolean {
    return this._bn.eq(publicKey._bn);
  }

  toBase58(): string {
    return bs58.encode(this.toBytes());
  }

  toJSON(): string {
    return this.toBase58();
  }

  toBytes(): Uint8Array {
    return this.toBuffer();
  }

  toBuffer(): Buffer {
    const b = this._bn.toArrayLike(Buffer);
    if (b.length === 32) {
      return b;
    }

    const zeroPad = Buffer.alloc(32);
    b.copy(zeroPad, 32 - b.length);
    return zeroPad;
  }

  toString(): string {
    return this.toBase58();
  }
}
