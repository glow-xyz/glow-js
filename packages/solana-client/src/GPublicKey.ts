/**
 * This is a lighter version of the public key in `@solana/web3.js`
 */
import { sha256 } from "@noble/hashes/sha256";
import BN from "bn.js";
import bs58 from "bs58";
import { Buffer } from "buffer";
import { isOnCurve } from "./utils/ed25519";
import { Solana } from "./base-types";

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

const MAX_SEED_LENGTH = 32;

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

  /**
   * Derive a program address from seeds and a program ID.
   */
  static createProgramAddress(
    seeds: Array<Buffer>,
    programId: Solana.Address
  ): Solana.Address {
    let buffer = Buffer.alloc(0);
    seeds.forEach(function (seed) {
      if (seed.length > MAX_SEED_LENGTH) {
        throw new TypeError(`Max seed length exceeded`);
      }
      buffer = Buffer.concat([buffer, seed]);
    });
    buffer = Buffer.concat([
      buffer,
      new GPublicKey(programId).toBuffer(),
      Buffer.from("ProgramDerivedAddress"),
    ]);
    const publicKeyBytes = sha256(buffer);
    if (isOnCurve(publicKeyBytes)) {
      throw new Error(`Invalid seeds, address must fall off the curve`);
    }
    return new GPublicKey(publicKeyBytes).toBase58();
  }

  /**
   * Find a valid program address
   *
   * Valid program addresses must fall off the ed25519 curve.  This function
   * iterates a nonce until it finds one that when combined with the seeds
   * results in a valid program address.
   */
  static findProgramAddress(
    seeds: Array<Buffer>,
    programId: Solana.Address
  ): [Solana.Address, number] {
    let nonce = 255;
    let address: Solana.Address;
    while (nonce != 0) {
      try {
        const seedsWithNonce = seeds.concat(Buffer.from([nonce]));
        address = GPublicKey.createProgramAddress(seedsWithNonce, programId);
      } catch (err) {
        if (err instanceof TypeError) {
          throw err;
        }
        nonce--;
        continue;
      }
      return [address, nonce];
    }
    throw new Error(`Unable to find a viable program address nonce`);
  }

  /**
   * Check that a pubkey is on the ed25519 curve.
   */
  static isOnCurve(pubkeyData: PublicKeyInitData): boolean {
    const pubkey = new GPublicKey(pubkeyData);
    return isOnCurve(pubkey.toBytes());
  }
}
