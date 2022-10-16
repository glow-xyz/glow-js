import { z } from "zod";
import { Solana } from "../base-types";

/**
 * Here are the types returned directly by the Solana RPC, with no modification.
 *
 * We want these to only be used internally within SolanaClient and never be
 * leaked outside to our application.
 *
 * This means that each type here should correspond with one type in
 * SolanaClientTypes, which are the types actually exported to our app. This
 * corresponding type may be exactly the same, or may be modified with some data
 * parsing or a nicer structure (the RPC types sometimes are quite complex).
 */
export namespace SolanaRpcTypes {
  const BaseAccountZ = z.object({
    executable: z.boolean(),
    owner: Solana.AddressZ,
    lamports: z.number(),
    rentEpoch: z.number(),
  });

  export const AccountZ = BaseAccountZ.and(
    z.object({
      data: z.tuple([z.string(), z.literal("base64")]),
    })
  );

  export const ParsedAccountZ = BaseAccountZ.and(
    z.object({
      data: z
        .tuple([z.string(), z.literal("base64")])
        .or(z.record(z.string(), z.any())),
    })
  );

  export const AccountWithPubkeyZ = z.object({
    account: AccountZ,
    pubkey: Solana.AddressZ,
  });
  export type AccountWithPubkey = z.infer<typeof AccountWithPubkeyZ>;

  export const ParsedAccountWithPubkeyZ = z.object({
    account: ParsedAccountZ,
    pubkey: Solana.AddressZ,
  });
  export type ParsedAccountWithPubkey = z.infer<
    typeof ParsedAccountWithPubkeyZ
  >;

  export const InstructionZ = z.object({
    accounts: z.array(z.number()),
    data: z.string().nullish(), // This is base58 data
    programIdIndex: z.number(),
  });
  export type Instruction = z.infer<typeof InstructionZ>;

  export const TokenBalanceZ = z.object({
    accountIndex: z.number(),
    mint: z.string(),
    owner: Solana.AddressZ.optional(),
    uiTokenAmount: z.object({
      amount: z.string(),
      decimals: z.number(),
    }),
  });

  // encoding=base64
  export const TransactionRawMetaZ = z.object({
    // Errors can be of many types and may presumably be added as Solana evolves
    // The possible errors are defined at the SDK instead of at the RPC, which
    // means that the RPC itself is not making any guarantees about what kinds
    // of errors will we get here.
    // Because of this, it's better to not make any assumptions about errors
    // and leave their parsing to the callers of SolanaClient. We don't want a
    // newly added error to break a whole SolanaClient endpoint.
    err: z.any(),
    fee: z.number(),
    innerInstructions: z
      .array(
        z.object({
          index: z.number(),
          instructions: z.array(InstructionZ),
        })
      )
      .nullish(),
    logMessages: z.array(z.string()).nullish(),
    postBalances: z.array(z.number()),
    preBalances: z.array(z.number()),
    preTokenBalances: z.array(TokenBalanceZ).nullable(),
    postTokenBalances: z.array(TokenBalanceZ).nullable(),
    loadedAddresses: z
      .object({
        readonly: z.array(Solana.AddressZ),
        writable: z.array(Solana.AddressZ),
      })
      .optional(),
  });
  export type TransactionRawMeta = z.infer<typeof TransactionRawMetaZ>;
  export type LoadedAddresses = TransactionRawMeta["loadedAddresses"];
  // https://github.com/luma-team/solana/blob/6d5bbca630bd59fb64f2bc446793c83482d8fba4/transaction-status/src/lib.rs#L403
  export const TransactionRawWithMetaZ = z.object({
    slot: z.number().optional(),
    transaction: z.tuple([z.string(), z.literal("base64")]),
    blockTime: z.number().optional().nullable(),
    meta: TransactionRawMetaZ.nullable(),
  });
  export type TransactionRawWithMeta = z.infer<typeof TransactionRawWithMetaZ>;

  export const PerformanceSampleZ = z.object({
    numSlots: z.number(),
    numTransactions: z.number(),
    samplePeriodSecs: z.number(),
    slot: z.number(),
  });

  export type Filter =
    | {
        dataSize: number;
      }
    | {
        memcmp: {
          bytes: string;
          offset: number;
        };
      }
    | null
    | false;
}
