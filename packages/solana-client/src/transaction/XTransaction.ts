import { Buffer } from "buffer";
import { Base64 } from "../base-types";
import { SolanaRpcTypes } from "../client/rpc-types";
import { LTransaction } from "./LTransaction";
import { getTransactionVersion } from "./transaction-utils";
import { TransactionInterface } from "./TransactionInterface";
import { VTransaction } from "./VTransaction";

/**
 * This is intended to be a more abstract class that can be used for both old and new transaction
 * types.
 */
export namespace XTransaction {
  export const parse = ({
    base64,
    loadedAddresses,
  }: {
    base64: Base64;
    loadedAddresses: SolanaRpcTypes.LoadedAddresses | null;
  }): TransactionInterface => {
    const buffer = Buffer.from(base64, "base64");
    const { version } = getTransactionVersion({ buffer });

    if (version === "legacy") {
      return new LTransaction({ base64 });
    }

    if (version === 0) {
      return new VTransaction({ base64, loadedAddresses });
    }

    throw new Error("Invalid transaction format.");
  };
}
