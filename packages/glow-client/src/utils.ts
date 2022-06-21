import { Buffer } from "buffer";
import { sign } from "tweetnacl";
import { DateTime } from "luxon";
import { Address } from "./window-types";
import bs58 from "bs58";

export const verifySignIn = ({
  message,
  expectedDomain,
  expectedAddress,
  signature,
}: {
  message: string;
  expectedDomain: string;
  expectedAddress: Address;
  signature: string; // base64
}): {
  appName: string;
  domain: string;
  address: Address;
  nonce: string;
  requestedAt: DateTime;
} => {
  if (!expectedAddress) {
    throw new Error("Missing expected address.");
  }

  const regexStr =
    `^(?<appName>.{0,100}) would like you to sign in with your Solana account:
        (?<address>[5KL1-9A-HJ-NP-Za-km-z]{32,44})

        Domain: (?<domain>[A-Za-z0-9.\\-]+)
        Requested At: (?<requestedAt>.+)
        Nonce: (?<nonce>[A-Za-z0-9\-\.]+)$`
      .split("\n")
      .map((s) => s.trim())
      .join("\n");
  const regex = new RegExp(regexStr);

  const match = message.match(regex);

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

  if (expectedDomain !== domain) {
    throw new Error("Domain does not match expected domain.");
  }

  if (expectedAddress !== address) {
    throw new Error("Address does not match expected address.");
  }

  const timeDiff = DateTime.now().diff(requestedAt);
  if (Math.abs(timeDiff.as("minute")) > 10) {
    throw new Error("Message is not recent.");
  }

  verifySignature({ signature, message, signer: address });

  return {
    appName,
    domain,
    address,
    nonce,
    requestedAt,
  };
};

export const verifySignature = ({
  signature,
  message,
  signer,
}: {
  signature: string; // base64
  message: string;
  signer: Address;
}) => {
  const messageUint = new Uint8Array(Buffer.from(message));
  const signatureUint = new Uint8Array(Buffer.from(signature, "base64"));
  const addressUint = bs58.decode(signer);

  if (!sign.detached.verify(messageUint, signatureUint, addressUint)) {
    console.error("Problem verifying signature...");
    throw new Error("The Solana signature is invalid.");
  }
};
