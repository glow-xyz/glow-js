import bs58 from "bs58";
import { Buffer } from "buffer";
import nacl from "tweetnacl";
import { Base58, Base64, Solana } from "../base-types";
import { GlowBorshTypes } from "../borsh";
import { GKeypair } from "../GKeypair";
import { LegacyTransactionMessageFormat } from "./LTransaction";
import { parseV1Transaction, V1_VERSION_BYTE } from "./V1Transaction";
import { V0TransactionMessageFormat } from "./VTransaction";

const VERSION_PREFIX_MASK = 0x7f;
export type TransactionVersion = "legacy" | number;

export const getTransactionVersion = ({
  buffer,
}: {
  buffer: Buffer;
}): {
  version: TransactionVersion;
  signatures: Base58[];
  messageBuffer: Buffer;
  addresses: Solana.Address[];
} => {
  // A legacy or v0 transaction starts with its signature count, which can't be
  // 0x81 since that would mean at least 129 signatures
  if (buffer[0] === V1_VERSION_BYTE) {
    const { message, messageBuffer, signatures } = parseV1Transaction({
      buffer,
    });
    return {
      version: 1,
      signatures,
      messageBuffer,
      addresses: message.addresses,
    };
  }

  const signaturesCoder =
    GlowBorshTypes.transactionSignaturesSection.toFixedFromData(buffer, 0);
  const signatures = signaturesCoder.read(buffer, 0);

  const signaturesLength = signaturesCoder.byteSize;
  const messageBuffer = buffer.slice(signaturesLength);

  const prefix = buffer[signaturesLength];

  const maskedPrefix = prefix & VERSION_PREFIX_MASK;

  if (maskedPrefix === prefix) {
    const message = LegacyTransactionMessageFormat.parse({
      buffer: messageBuffer,
    });
    if (!message) {
      throw new Error("Cannot parse transaction.");
    }

    return {
      version: "legacy",
      signatures,
      messageBuffer,
      addresses: message.addresses,
    };
  }

  if (maskedPrefix !== 0) {
    throw new Error("We only support 'legacy' and '0' versions.");
  }

  const message = V0TransactionMessageFormat.parse({ buffer: messageBuffer });
  if (!message) {
    throw new Error("Cannot parse transaction.");
  }

  return {
    version: maskedPrefix,
    messageBuffer,
    signatures,
    addresses: message.addresses,
  };
};

export const signXTransaction = ({
  base64,
  signer,
}: {
  base64: Base64;
  signer: GKeypair;
}): {
  signature: Buffer;
  signed_transaction: Buffer;
} => {
  const txBuffer = Buffer.from(base64, "base64");

  const {
    version,
    messageBuffer,
    addresses,
    signatures: oldSignatures,
  } = getTransactionVersion({
    buffer: txBuffer,
  });

  const signature = Buffer.from(
    nacl.sign.detached(new Uint8Array(messageBuffer), signer.secretKey)
  );
  const signatureIdx = addresses.findIndex(
    (address) => address === signer.address
  );

  const newSignatures = oldSignatures.map((sig, idx) => {
    if (idx === signatureIdx) {
      return bs58.encode(signature);
    }
    return sig;
  });

  if (version === 1) {
    // v1 transactions put the signatures after the message
    const signed_transaction = Buffer.concat([
      messageBuffer,
      ...newSignatures.map((sig) => Buffer.from(bs58.decode(sig))),
    ]);
    return { signature, signed_transaction };
  }

  const signaturesCoder =
    GlowBorshTypes.transactionSignaturesSection.toFixedFromData(txBuffer, 0);
  const signed_transaction = Buffer.alloc(txBuffer.byteLength);
  signaturesCoder.write(signed_transaction, 0, newSignatures);
  messageBuffer.copy(signed_transaction, signaturesCoder.byteSize);

  return { signature, signed_transaction };
};
