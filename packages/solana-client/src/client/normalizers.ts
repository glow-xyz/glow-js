import * as bs58 from "bs58";
import { Buffer } from "buffer";
import { DateTime } from "luxon";
import { Solana } from "../base-types";
import { GTransaction } from "../GTransaction";
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
  | SolanaClientTypes.Account
  | SolanaClientTypes.ParsedAccountGeneric => {
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
  txContainer: SolanaRpcTypes.TransactionRawWithMeta
): SolanaClientTypes.TransactionWithMeta => {
  const {
    blockTime,
    slot,
    transaction: [transaction_base64],
    meta,
  } = txContainer;
  const transaction = GTransaction.parse({
    buffer: Buffer.from(transaction_base64, "base64"),
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
        })
      ),
    },
  };
};
