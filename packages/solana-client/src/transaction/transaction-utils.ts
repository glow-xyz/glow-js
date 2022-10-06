import { Buffer } from "buffer";
import { GlowBorshTypes } from "../borsh";

const VERSION_PREFIX_MASK = 0x7f;
export type TransactionVersion = "legacy" | number;

export const getTransactionVersion = ({
  buffer,
}: {
  buffer: Buffer;
}): TransactionVersion => {
  const signaturesCoder =
    GlowBorshTypes.transactionSignaturesSection.toFixedFromData(buffer, 0);

  const signaturesLength = signaturesCoder.byteSize;
  const prefix = buffer[signaturesLength];

  const maskedPrefix = prefix & VERSION_PREFIX_MASK;
  if (maskedPrefix === prefix) {
    return "legacy";
  }

  return maskedPrefix;
};
