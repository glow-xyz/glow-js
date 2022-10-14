import { Buffer } from "buffer";
import { Base58 } from "../base-types";
import { GlowBorshTypes } from "../borsh";

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
} => {
  const signaturesCoder =
    GlowBorshTypes.transactionSignaturesSection.toFixedFromData(buffer, 0);
  const signatures = signaturesCoder.read(buffer, 0);

  const signaturesLength = signaturesCoder.byteSize;
  const prefix = buffer[signaturesLength];

  const maskedPrefix = prefix & VERSION_PREFIX_MASK;
  if (maskedPrefix === prefix) {
    const messageBuffer = buffer.slice(signaturesLength);
    return { version: "legacy", signatures, messageBuffer };
  }

  const messageBuffer = buffer.slice(signaturesLength + 1);
  return { version: maskedPrefix, messageBuffer, signatures };
};
