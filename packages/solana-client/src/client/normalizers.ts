import { Buffer } from "buffer";

import * as bs58 from "bs58";
import { DateTime } from "luxon";

import { Solana } from "../base-types";
import { GTransaction } from "../GTransaction";
import { getTransactionVersion } from "../transaction/transaction-utils";
import { VTransaction } from "../transaction/VTransaction";
import { SolanaClientTypes } from "./client-types";
import { SolanaRpcTypes } from "./rpc-types";

export const normalizeRpcAccountWithPubkey = ({
  account,
  pubkey,
}: SolanaRpcTypes.AccountWithPubkey): SolanaClientTypes.Account => {
  return {
    buffer: Buffer.from(account.data[0], "base64"),
    executable: account.executable,
    lamports: account.lamports,
    owner: account.owner,
    parsed: false,
    rentEpoch: account.rentEpoch,
    pubkey,
  };
};

export const normalizeRpcParsedAccountWithPubkey = ({
  account,
  pubkey,
}: SolanaRpcTypes.ParsedAccountWithPubkey):
  SolanaClientTypes.Account | SolanaClientTypes.ParsedAccountGeneric => {
  if (Array.isArray(account.data) && account.data[1] === "base64") {
    return normalizeRpcAccountWithPubkey({
      account: {
        ...account,
        data: account.data as [string, "base64"],
      },
      pubkey,
    });
  }

  return {
    data: account.data,
    executable: account.executable,
    lamports: account.lamports,
    owner: account.owner,
    parsed: true,
    rentEpoch: account.rentEpoch,
    pubkey,
  };
};

export const normalizeTransactionWithMeta = (
  txContainer: SolanaRpcTypes.TransactionRawWithMeta,
): SolanaClientTypes.TransactionWithMeta => {
  const {
    blockTime,
    slot,
    transaction: [transaction_base64],
    meta,
  } = txContainer;
  const transaction = parseTransaction({
    base64: transaction_base64,
    loadedAddresses: meta?.loadedAddresses ?? null,
  });
  const addressAtIndex = (idx: number): Solana.Address =>
    transaction.accounts[idx].address;

  return {
    block_time: blockTime ? DateTime.fromSeconds(blockTime) : null,
    slot: slot ?? null,
    transaction,
    meta: meta && {
      ...meta,
      logMessages: meta.logMessages || null,
      innerInstructions: meta.innerInstructions?.map(
        ({ index, instructions }) => ({
          index,
          instructions: instructions.map((ix) => ({
            accounts: ix.accounts.map(addressAtIndex),
            // TODO: are we actually getting base58 inner instruction data?
            data_base64: ix.data
              ? Buffer.from(bs58.decode(ix.data)).toString("base64")
              : "",
            program: addressAtIndex(ix.programIdIndex),
          })),
        }),
      ),
    },
  };
};

// Returns a GTransaction for both legacy and v0 transactions. For v0, `accounts`
// includes the addresses loaded from lookup tables, in the order Solana indexes them.
const parseTransaction = ({
  base64,
  loadedAddresses,
}: {
  base64: string;
  loadedAddresses: SolanaRpcTypes.LoadedAddresses | null;
}): GTransaction.GTransaction => {
  const buffer = Buffer.from(base64, "base64");
  const { version, signatures, messageBuffer } = getTransactionVersion({
    buffer,
  });

  if (version === "legacy") {
    return GTransaction.parse({ buffer });
  }

  if (version !== 0) {
    throw new Error(`Unsupported transaction version: ${version}.`);
  }

  const vTransaction = new VTransaction({ base64, loadedAddresses });
  const accounts = vTransaction.accounts;

  return {
    signature: vTransaction.signature,
    signatures: signatures.map((signature, idx) => ({
      signature,
      address: accounts[idx].address,
    })),
    accounts: accounts.map(({ address, signer, writable }) => ({
      address,
      signer,
      writable,
    })),
    latestBlockhash: vTransaction.latestBlockhash,
    instructions: vTransaction.instructions,
    messageBase64: messageBuffer.toString("base64"),
  };
};
