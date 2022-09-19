import { sha256 } from "@noble/hashes/sha256";
import { Buffer } from "buffer";
import { Solana } from "./base-types";
import { GPublicKey, PublicKeyInitData } from "./GPublicKey";
import { isOnCurve as _isOnCurve } from "./utils/ed25519";

const MAX_SEED_LENGTH = 32;

/**
 * We pull these out to a different namespace as GPublicKey because the crypto libraries
 * from `@noble` import modern features that will break older browsers.
 */
export namespace EllipticCurve {
  /**
   * Check that a pubkey is on the ed25519 curve.
   */
  export const isOnCurve = (pubkeyData: PublicKeyInitData): boolean => {
    const pubkey = new GPublicKey(pubkeyData);
    return _isOnCurve(pubkey.toBytes());
  };

  /**
   * Derive a program address from seeds and a program ID.
   */
  export const createProgramAddress = (
    seeds: Array<Buffer>,
    programId: Solana.Address
  ): Solana.Address => {
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
  };

  /**
   * Find a valid program address
   *
   * Valid program addresses must fall off the ed25519 curve.  This function
   * iterates a nonce until it finds one that when combined with the seeds
   * results in a valid program address.
   */
  export const findProgramAddress = (
    seeds: Array<Buffer>,
    programId: Solana.Address
  ): [Solana.Address, number] => {
    let nonce = 255;
    let address: Solana.Address;
    while (nonce != 0) {
      try {
        const seedsWithNonce = seeds.concat(Buffer.from([nonce]));
        address = createProgramAddress(seedsWithNonce, programId);
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
  };
}
