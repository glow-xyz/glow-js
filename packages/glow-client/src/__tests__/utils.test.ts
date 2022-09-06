import { GPublicKey, GKeypair, GTransaction } from "@glow-xyz/solana-client";
import bs58 from "bs58";
import { Buffer } from "buffer";
import { DateTime, Duration } from "luxon";
import nacl from "tweetnacl";
import {
  constructSignInMessage,
  constructSignInTx,
  NOTE_PROGRAM,
  verifySignature,
  verifySignIn,
} from "../utils";

describe("verifySignature", () => {
  test("confirms a valid signature", async () => {
    const message = "hi";
    const messageBuff = Buffer.from(message);
    const keypair = nacl.sign.keyPair();
    const signedMessage = nacl.sign.detached(messageBuff, keypair.secretKey);

    verifySignature({
      signature: Buffer.from(signedMessage).toString("base64"),
      message,
      signer: bs58.encode(keypair.publicKey),
    });
  });

  test("rejects an invalid signature", async () => {
    const keypair = nacl.sign.keyPair();
    await expect(async () => {
      verifySignature({
        signature: "ab",
        message: "hi",
        signer: bs58.encode(keypair.publicKey),
      });
    }).rejects.toThrow();
  });
});

describe("verifySignIn", () => {
  test("parses a localhost message", () => {
    const keypair = nacl.sign.keyPair();
    const expectedAddress = bs58.encode(keypair.publicKey);

    const _requestedAt = DateTime.now().toUTC().toISO();
    const message = `would like you to sign in with your Solana account:
${expectedAddress}

Domain: localhost
Requested At: ${_requestedAt}
Nonce: 825`;

    const { appName, domain, address, nonce, requestedAt } = verifySignIn({
      signature: signMessage(message, keypair),
      message,
      expectedAddress,
      expectedDomain: "localhost",
    });
    expect(appName).toEqual("");
    expect(domain).toEqual("localhost");
    expect(address).toEqual(expectedAddress);
    expect(nonce).toEqual("825");
    expect(requestedAt.toISO()).toEqual(_requestedAt);
  });

  test("approves a valid sign in", () => {
    const keypair = nacl.sign.keyPair();
    const expectedAddress = bs58.encode(keypair.publicKey);

    const _requestedAt = DateTime.now().toUTC().toISO();
    const message = `Glow Wallet would like you to sign in with your Solana account:
${expectedAddress}

Domain: glow.xyz
Requested At: ${_requestedAt}
Nonce: 869`;

    const { appName, domain, address, nonce, requestedAt } = verifySignIn({
      signature: signMessage(message, keypair),
      message,
      expectedAddress,
      expectedDomain: "glow.xyz",
    });
    expect(appName).toEqual("Glow Wallet");
    expect(domain).toEqual("glow.xyz");
    expect(address).toEqual(expectedAddress);
    expect(nonce).toEqual("869");
    expect(requestedAt.toISO()).toEqual(_requestedAt);

    verifySignIn({
      signature: signMessage(message, keypair),
      message,
      expectedAddress,
      expectedDomain: ["glow.xyz"],
    });
  });

  test("rejects a missing address", () => {
    const keypair = nacl.sign.keyPair();
    const expectedAddress = bs58.encode(keypair.publicKey);

    const _requestedAt = DateTime.now().toUTC().toISO();
    const message = `Glow Wallet would like you to sign in with your Solana account:
${expectedAddress}

Domain: glow.xyz
Requested At: ${_requestedAt}
Nonce: 869`;

    expect(() => {
      verifySignIn({
        signature: signMessage(message, keypair),
        message,
        expectedAddress: "",
        expectedDomain: "glow.xyz",
      });
    }).toThrow();

    expect(() => {
      verifySignIn({
        signature: signMessage(message, keypair),
        message,
        expectedAddress: null as any,
        expectedDomain: "glow.xyz",
      });
    }).toThrow();
  });

  test("rejects an invalid address", () => {
    const keypair = nacl.sign.keyPair();
    const expectedAddress = bs58.encode(keypair.publicKey);

    const _requestedAt = DateTime.now().toUTC().toISO();
    const message = `Glow Wallet would like you to sign in with your Solana account:
${expectedAddress}

Domain: glow.xyz
Requested At: ${_requestedAt}
Nonce: 869`;

    expect(() => {
      verifySignIn({
        signature: signMessage(message, keypair),
        message,
        expectedAddress: "636Lq2zGQDYZ3i6hahVcFWJkY6Jejndy5Qe4gBdukXDi",
        expectedDomain: "glow.xyz",
      });
    }).toThrow();
  });

  test("rejects an invalid domain", () => {
    const keypair = nacl.sign.keyPair();
    const expectedAddress = bs58.encode(keypair.publicKey);

    const _requestedAt = DateTime.now().toUTC().toISO();
    const message = `Glow Wallet would like you to sign in with your Solana account:
${expectedAddress}

Domain: glow.xyz
Requested At: ${_requestedAt}
Nonce: 869`;

    expect(() => {
      verifySignIn({
        signature: signMessage(message, keypair),
        message,
        expectedAddress,
        expectedDomain: "espn.com-invalid",
      });
    }).toThrow();
  });

  test("rejects a missing domain", () => {
    const keypair = nacl.sign.keyPair();
    const expectedAddress = bs58.encode(keypair.publicKey);

    const _requestedAt = DateTime.now().toUTC().toISO();
    const message = `Glow Wallet would like you to sign in with your Solana account:
${expectedAddress}

Domain: glow.xyz
Requested At: ${_requestedAt}
Nonce: 869`;

    expect(() => {
      verifySignIn({
        signature: signMessage(message, keypair),
        message,
        expectedAddress,
        expectedDomain: null as any,
      });
    }).toThrow();

    expect(() => {
      verifySignIn({
        signature: signMessage(message, keypair),
        message,
        expectedAddress,
        expectedDomain: ["glow.app"],
      });
    }).toThrow();

    expect(() => {
      verifySignIn({
        signature: signMessage(message, keypair),
        message,
        expectedAddress,
        expectedDomain: [],
      });
    }).toThrow();
  });

  test("rejects an old time", () => {
    const keypair = nacl.sign.keyPair();
    const expectedAddress = bs58.encode(keypair.publicKey);

    const _requestedAt = DateTime.now().minus({ days: 1 }).toUTC().toISO();
    const message = `Glow Wallet would like you to sign in with your Solana account:
${expectedAddress}

Domain: glow.xyz
Requested At: ${_requestedAt}
Nonce: 869`;

    expect(() => {
      verifySignIn({
        signature: signMessage(message, keypair),
        message,
        expectedAddress,
        expectedDomain: "glow.xyz",
      });
    }).toThrow();
  });

  test("accepts an old time if configured so", () => {
    const keypair = nacl.sign.keyPair();
    const expectedAddress = bs58.encode(keypair.publicKey);

    const _requestedAt = DateTime.now().minus({ days: 1 }).toUTC().toISO();
    const message = `Glow Wallet would like you to sign in with your Solana account:
${expectedAddress}

Domain: glow.xyz
Requested At: ${_requestedAt}
Nonce: 869`;

    expect(() => {
      verifySignIn({
        signature: signMessage(message, keypair),
        message,
        expectedAddress,
        expectedDomain: "glow.xyz",
        maxAllowedTimeDiffMs: Duration.fromObject({ days: 2 }).toMillis(),
      });
    }).not.toThrow();
  });

  test("rejects a future time", () => {
    const keypair = nacl.sign.keyPair();
    const expectedAddress = bs58.encode(keypair.publicKey);

    const _requestedAt = DateTime.now().plus({ days: 1 }).toUTC().toISO();
    const message = `Glow Wallet would like you to sign in with your Solana account:
${expectedAddress}

Domain: glow.xyz
Requested At: ${_requestedAt}
Nonce: 869`;

    expect(() => {
      verifySignIn({
        signature: signMessage(message, keypair),
        message,
        expectedAddress,
        expectedDomain: "glow.xyz",
      });
    }).toThrow();
  });

  test("rejects an invalid signature", () => {
    const _requestedAt = DateTime.now().toUTC().toISO();
    const keypair = nacl.sign.keyPair();
    const expectedAddress = bs58.encode(keypair.publicKey);
    const message = `Glow Wallet would like you to sign in with your Solana account:
${expectedAddress}

Domain: glow.xyz
Requested At: ${_requestedAt}
Nonce: 869`;

    expect(() => {
      verifySignIn({
        signature: signMessage(message, nacl.sign.keyPair()),
        message,
        expectedAddress,
        expectedDomain: "glow.xyz",
      });
    }).toThrow();
  });

  test("parses a signed transaction", () => {
    const keypair = nacl.sign.keyPair();
    const address = bs58.encode(keypair.publicKey);

    const { gtransaction, message } = constructSignInTx({
      address,
      appName: "Hi app",
      domain: "glow.app",
      signer: new GKeypair(keypair),
    });

    const {
      appName,
      domain,
      address: _address,
    } = verifySignIn({
      signed_transaction_base64: GTransaction.toBuffer({
        gtransaction,
      }).toString("base64"),
      message,
      expectedAddress: address,
      expectedDomain: "glow.app",
    });
    expect(appName).toEqual("Hi app");
    expect(domain).toEqual("glow.app");
    expect(address).toEqual(_address);
  });

  test("rejects a transaction with an invalid message", () => {
    const keypair = nacl.sign.keyPair();
    const address = bs58.encode(keypair.publicKey);

    const message = constructSignInMessage({
      appName: "Hi app",
      domain: "glow.app",
      address,
      nonce: Math.floor(Math.random() * 1000),
      requestedAt: DateTime.now(),
    });

    const gtransaction = GTransaction.create({
      instructions: [
        {
          accounts: [
            { address, signer: true },
            { address: GPublicKey.nullString, signer: true },
          ],
          program: NOTE_PROGRAM,
          data_base64: Buffer.from(message + "errrrrrrrr").toString("base64"),
        },
      ],
      recentBlockhash: GPublicKey.nullString,
      feePayer: GPublicKey.nullString,
      signers: [new GKeypair(keypair)],
    });

    expect(() => {
      verifySignIn({
        signed_transaction_base64: GTransaction.toBuffer({
          gtransaction,
        }).toString("base64"),
        message,
        expectedAddress: address,
        expectedDomain: "glow.app",
      });
    }).toThrow();
  });

  test("rejects an unsigned transaction", () => {
    const keypair = nacl.sign.keyPair();
    const address = bs58.encode(keypair.publicKey);

    const { gtransaction, message } = constructSignInTx({
      address,
      appName: "Hi app",
      domain: "glow.app",
    });

    expect(() => {
      verifySignIn({
        signed_transaction_base64: GTransaction.toBuffer({
          gtransaction,
        }).toString("base64"),
        message,
        expectedAddress: address,
        expectedDomain: "glow.app",
      });
    }).toThrow();
  });
});

const signMessage = (message: string, keypair: nacl.SignKeyPair): string => {
  const signedMessage = nacl.sign.detached(
    Buffer.from(message),
    keypair.secretKey
  );
  return Buffer.from(signedMessage).toString("base64");
};
