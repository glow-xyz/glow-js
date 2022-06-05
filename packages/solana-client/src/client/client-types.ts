import {Buffer} from "buffer";
import { DateTime } from "luxon";
import { Solana } from "../base-types";
import { GTransaction } from "../GTransaction";

/**
 * Here are the types that SolanaClient exports, those that are consumed by
 * callers of SolanaClient.
 *
 * In some cases they may differ from SolanaRpcTypes, which are the raw,
 * unmodified types returned by the Solana RPC, or may be exactly the same
 * (for example, SolanaClientTypes.PerformanceSample and
 * SolanaRpcTypes.PerformanceSampleZ represent the same type as of the date when
 * this comment was written).
 *
 * In that case, we prefer to duplicate the type rather than infer it from zod
 * in order to be explicit and enable both types to evolve differently.
 */
export namespace SolanaClientTypes {
  export type ParsedAccount<Data> = {
    parsed: true;
    pubkey: Solana.Address;
    /** `true` if this account's data contains a loaded program */
    executable: boolean;
    /** Identifier of the program that owns the account, this is the _program_ owner */
    owner: Solana.Address;
    lamports: number; // TODO: replace this with a string
    rentEpoch?: number;

    data: Data;
    buffer?: never;
  };

  export type ParsedAccountGeneric = ParsedAccount<Record<string, any>>;

  export type Account = {
    parsed: false;
    pubkey: Solana.Address;
    /** `true` if this account's data contains a loaded program */
    executable: boolean;
    /** Identifier of the program that owns the account, this is the _program_ owner */
    owner: Solana.Address;
    lamports: number; // TODO: replace this with a string
    rentEpoch?: number;

    buffer: Buffer;
    data?: never;
  };

  export type TransactionWithMeta = {
    slot: number | null;
    transaction: GTransaction.GTransaction;
    block_time: DateTime | null;
    meta: TransactionMeta | null;
  };

  export type TokenAccount = {
    address: Solana.Address;
    amount: string;
    decimals: number;
    uiAmountString: string;
  };

  export type TokenBalance = {
    accountIndex: number;
    mint: string;
    owner?: string;
    uiTokenAmount: {
      amount: string;
      decimals: number;
    };
  };

  export type TransactionMeta = {
    // TODO make this unknown to force callers of SolanaClient to parse this with zod
    err?: any;
    fee: number;
    preBalances: number[];
    postBalances: number[];
    innerInstructions?: Array<{
      index: number;
      instructions: Array<GTransaction.Instruction>;
    }>;
    preTokenBalances: Array<TokenBalance> | null;
    postTokenBalances: Array<TokenBalance> | null;
    logMessages: string[] | null;
  };

  export type PerformanceSample = {
    numSlots: number;
    numTransactions: number;
    samplePeriodSecs: number;
    slot: number;
  };
}
