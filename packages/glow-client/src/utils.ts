import { GPublicKey, GTransaction, GKeypair } from "@glow-xyz/solana-client";
import bs58 from "bs58";
import { Buffer } from "buffer";
import { DateTime } from "luxon";
import { sign } from "tweetnacl";
import { Address } from "./window-types";

const SIGN_IN_REGEX_STR =
  `^(?<appName>.{0,100}?)[ ]?would like you to sign in with your Solana account:
        (?<address>[5KL1-9A-HJ-NP-Za-km-z]{32,44})

        Domain: (?<domain>[A-Za-z0-9.\\-]+)
        Requested At: (?<requestedAt>.+)
        Nonce: (?<nonce>[A-Za-z0-9\-\.]+)$`
    .split("\n")
    .map((s) => s.trim())
    .join("\n");
const SIGN_IN_REGEX = new RegExp(SIGN_IN_REGEX_STR);

/**
 * We take in either a signature or a signed transaction.
 *
 * The signed transaction option is useful for Ledger which does not support signing messages
 * directly.
 */
export const verifySignIn = ({
  message,
  expectedDomain,
  expectedAddress,
  ...params
}: {
  message: string;
  expectedDomain: string | string[];
  expectedAddress: Address;
} & (
  | {
      signature: string; // base64
      signed_transaction_base64?: string; // base64
    }
  | {
      signed_transaction_base64: string; // base64
      signature?: string; // base64
    }
)): {
  appName: string;
  domain: string;
  address: Address;
  nonce: string;
  requestedAt: DateTime;
} => {
  if (!expectedAddress) {
    throw new Error("Missing expected address.");
  }

  const match = message.match(SIGN_IN_REGEX);

  if (!match || !match.groups) {
    throw new Error("Invalid message format.");
  }

  const {
    appName,
    domain,
    address,
    nonce: _nonce,
    requestedAt: _requestedAt,
  } = match.groups;
  const nonce = _nonce;
  const requestedAt = DateTime.fromISO(_requestedAt).toUTC();

  if (Array.isArray(expectedDomain)) {
    if (expectedDomain.indexOf(domain) === -1) {
      throw new Error("Domain does not match expected domain.");
    }
  } else {
    if (expectedDomain !== domain) {
      throw new Error("Domain does not match expected domain.");
    }
  }

  if (expectedAddress !== address) {
    throw new Error("Address does not match expected address.");
  }

  const timeDiff = DateTime.now().diff(requestedAt);
  if (Math.abs(timeDiff.as("minute")) > 10) {
    throw new Error("Message is not recent.");
  }

  if ("signature" in params && typeof params.signature === "string") {
    verifySignature({ signature: params.signature, message, signer: address });
  } else {
    const gtransaction = GTransaction.parse({
      buffer: Buffer.from(params.signed_transaction_base64!, "base64"),
    });
    const messageFromTx = Buffer.from(
      gtransaction.instructions[0].data_base64,
      "base64"
    ).toString("utf-8");
    if (messageFromTx !== message) {
      throw new Error(
        "The transaction message does not match the message passed in."
      );
    }
    const signature = gtransaction.signatures.find(
      (s) => s.address === address
    )!.signature!;

    verifySignature({
      signature: Buffer.from(bs58.decode(signature)).toString("base64"),
      messageBuffer: Buffer.from(gtransaction.messageBase64, "base64"),
      signer: address,
    });
  }

  return {
    appName,
    domain,
    address,
    nonce,
    requestedAt,
  };
};

export const constructSignInMessage = ({
  appName,
  domain,
  address,
  nonce,
  requestedAt,
}: {
  appName: string | null;
  domain: string;
  address: string;
  nonce: number;
  requestedAt: DateTime;
}): string => {
  const message = `${
    appName ?? domain
  } would like you to sign in with your Solana account:
      ${address}

      Domain: ${domain}
      Requested At: ${requestedAt.toUTC().toISO()}
      Nonce: ${nonce}`;

  return message
    .split("\n")
    .map((line) => line.trim())
    .join("\n");
};

export const constructSignInTx = ({
  address,
  appName,
  domain,
  signer,
}: {
  address: string;
  appName: string;
  domain: string;
  signer?: GKeypair;
}): { gtransaction: GTransaction.GTransaction; message: string } => {
  const message = constructSignInMessage({
    appName,
    domain,
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
        data_base64: Buffer.from(message).toString("base64"),
      },
    ],
    recentBlockhash: GPublicKey.nullString,
    feePayer: GPublicKey.nullString,
    signers: signer ? [signer] : undefined,
  });

  return { gtransaction, message };
};

export const NOTE_PROGRAM = "noteD9tEFTDH1Jn9B1HbpoC7Zu8L9QXRo7FjZj3PT93";

export const verifySignature = ({
  signature,
  signer,
  ...params
}: {
  signature: string; // base64
  signer: Address;
} & (
  | {
      message: string;
    }
  | {
      messageBuffer: Buffer;
    }
)) => {
  const signatureUint = new Uint8Array(Buffer.from(signature, "base64"));
  const addressUint = bs58.decode(signer);

  let messageUint: Uint8Array;
  if ("message" in params) {
    messageUint = new Uint8Array(Buffer.from(params.message));
  } else {
    messageUint = new Uint8Array(params.messageBuffer);
  }

  if (!sign.detached.verify(messageUint, signatureUint, addressUint)) {
    console.error("Problem verifying signature...");
    throw new Error("The Solana signature is invalid.");
  }
};
