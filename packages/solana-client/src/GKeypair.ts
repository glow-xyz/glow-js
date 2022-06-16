import nacl from "tweetnacl";
import { Solana } from "./base-types";
import { GPublicKey } from "./GPublicKey";


interface Ed25519Keypair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

/**
 * An account keypair used for signing transactions.
 */
export class GKeypair {
  private _keypair: Ed25519Keypair;

  /**
   * Create a new keypair instance.
   * Generate random keypair if no {@link Ed25519Keypair} is provided.
   *
   * @param keypair ed25519 keypair
   */
  constructor(keypair?: Ed25519Keypair) {
    if (keypair) {
      this._keypair = keypair;
    } else {
      this._keypair = nacl.sign.keyPair();
    }
  }

  static generate(): GKeypair {
    return new GKeypair(nacl.sign.keyPair());
  }

  /**
   * Create a keypair from a raw secret key byte array.
   *
   * This method should only be used to recreate a keypair from a previously
   * generated secret key. Generating keypairs from a random seed should be done
   * with the {@link Keypair.fromSeed} method.
   *
   * @throws error if the provided secret key is invalid and validation is not skipped.
   *
   * @param secretKey secret key byte array
   * @param options: skip secret key validation
   */
  static fromSecretKey(
    secretKey: Uint8Array,
    options?: { skipValidation?: boolean }
  ): GKeypair {
    const keypair = nacl.sign.keyPair.fromSecretKey(secretKey);
    if (!options || !options.skipValidation) {
      const encoder = new TextEncoder();
      const signData = encoder.encode("@glow-app/solana-client-validation-v1");
      const signature = nacl.sign.detached(signData, keypair.secretKey);
      if (!nacl.sign.detached.verify(signData, signature, keypair.publicKey)) {
        throw new Error("provided secretKey is invalid");
      }
    }
    return new GKeypair(keypair);
  }

  static fromSeed(seed: Uint8Array): GKeypair {
    return new GKeypair(nacl.sign.keyPair.fromSeed(seed));
  }

  get publicKey(): GPublicKey {
    return new GPublicKey(this._keypair.publicKey);
  }

  get address(): Solana.Address {
    return new GPublicKey(this._keypair.publicKey).toString();
  }

  get secretKey(): Uint8Array {
    return this._keypair.secretKey;
  }
}
