import axios from "axios";
import BigNumber from "bignumber.js";
import { Buffer } from "buffer";
import chunk from "lodash/chunk";
import { DateTime, Duration } from "luxon";
import pLimit from "p-limit";
import { z } from "zod";
import { Base58, Solana } from "../base-types";
import { FixableGlowBorsh, GlowBorsh } from "../borsh/base";
import {
  TOKEN_ACCOUNT,
  TOKEN_ACCOUNT_DATA,
} from "../borsh/programs/token-program";
import { GlowError } from "../error";
import { SolanaClientTypes } from "./client-types";
import { SolanaRpcError } from "./error-codes";
import {
  normalizeRpcAccountWithPubkey,
  normalizeRpcParsedAccountWithPubkey,
  normalizeTransactionWithMeta,
} from "./normalizers";
import { SolanaRpcTypes } from "./rpc-types";

type RequestConfig = {
  rpcUrl: string;
  label?: string;
  timeout?: Duration;
};

const MAX_ACCOUNTS_IN_ONE_REQUEST = 50;

/**
 * We are using our own wrapper of Solana's JSON RPC API instead of web3.js
 *
 * Here's why our wrapper is better (for us):
 * - we can add perf logging and timeouts
 * - we can add stricter schema parsing to make sure the API is returning correct data (pending)
 * - we can choose a different RPC provider depending on the method
 * - we remove a level of unhelpful obfuscation
 * - the web3.js is actually pretty hackily cobbled together
 */
export namespace SolanaClient {
  export const getBalance = async ({
    address,
    commitment = "confirmed",
    timeout = Duration.fromObject({ seconds: 10 }),
    ...config
  }: {
    address: Solana.Address;
    commitment?: "finalized" | "confirmed";
  } & RequestConfig): Promise<Solana.SolAmount> => {
    const result = await makeRpcRequest({
      method: "getBalance",
      params: [
        address,
        {
          commitment,
        },
      ],
      zod: z.object({
        value: z.number().or(z.string()),
      }),
      timeout,
      ...config,
    });

    return {
      lamports: result.value.toString(),
    };
  };

  export const getAccountInfo = async ({
    address,
    commitment = "confirmed",
    timeout = Duration.fromObject({ seconds: 10 }),
    ...config
  }: {
    address: Solana.Address;
    commitment?: "finalized" | "confirmed";
  } & RequestConfig): Promise<SolanaClientTypes.Account | null> => {
    const result = await makeRpcRequest({
      method: "getAccountInfo",
      params: [
        address,
        {
          encoding: "base64",
          commitment,
        },
      ],
      timeout,
      zod: z.object({
        value: SolanaRpcTypes.AccountZ.nullable(),
      }),
      ...config,
    });

    const value = result.value;
    if (value == null) {
      return null;
    }

    return normalizeRpcAccountWithPubkey({
      account: value,
      pubkey: address,
    });
  };

  export const getBorshAccountInfo = async <T>({
    address,
    commitment = "confirmed",
    format,
    ...config
  }: {
    address: string;
    commitment?: "finalized" | "confirmed";
    format: GlowBorsh<T> | FixableGlowBorsh<T>;
  } & RequestConfig): Promise<SolanaClientTypes.ParsedAccount<T> | null> => {
    const account = await getAccountInfo({
      address,
      commitment,
      ...config,
    });

    if (!account) {
      return null;
    }

    const parsed = format.parse({
      buffer: account.buffer,
    });

    if (!parsed) {
      return null;
    }

    return {
      data: parsed,
      executable: account.executable,
      lamports: account.lamports,
      owner: account.owner,
      parsed: true,
      pubkey: account.pubkey,
      rentEpoch: account.rentEpoch,
    };
  };

  export const getBorshAccounts = async <T>({
    addresses,
    commitment = "confirmed",
    format,
    rpcUrl,
  }: {
    addresses: Solana.Address[];
    commitment?: "finalized" | "confirmed";
    format: GlowBorsh<T>;
  } & RequestConfig): Promise<
    Record<Solana.Address, SolanaClientTypes.ParsedAccount<T> | null>
  > => {
    const addressToAccount = await getMultipleAccounts({
      addresses,
      commitment,
      rpcUrl: rpcUrl,
    });

    const addressToParsedAccount: Record<
      Solana.Address,
      SolanaClientTypes.ParsedAccount<T> | null
    > = {};

    for (const [address, account] of Object.entries(addressToAccount)) {
      if (account) {
        const parsed = format.parse({
          buffer: account.buffer,
        });

        if (!parsed) {
          addressToParsedAccount[address] = null;
          continue;
        }

        addressToParsedAccount[address] = {
          data: parsed,
          executable: account.executable,
          lamports: account.lamports,
          owner: account.owner,
          parsed: true,
          pubkey: account.pubkey,
          rentEpoch: account.rentEpoch,
        };
      } else {
        addressToParsedAccount[address] = null;
      }
    }

    return addressToParsedAccount;
  };

  export const getTransaction = async ({
    signature,
    commitment = "confirmed",
    timeout = Duration.fromObject({ seconds: 10 }),
    ...config
  }: {
    signature: string;
    commitment?: "finalized" | "confirmed";
  } & RequestConfig): Promise<SolanaClientTypes.TransactionWithMeta> => {
    const result = await makeRpcRequest({
      method: "getTransaction",
      params: [
        signature,
        {
          encoding: "base64",
          commitment,
        },
      ],
      zod: SolanaRpcTypes.TransactionRawWithMetaZ.nullable(),
      timeout,
      ...config,
    });

    if (result == null) {
      throw new GlowError(`Could not find transaction.`, {
        statusCode: 404,
        code: "could-not-find-transaction",
        extraData: {
          signature,
        },
      });
    }

    return normalizeTransactionWithMeta(result);
  };

  export const getProgramAccounts = async ({
    program,
    dataSlice,
    filters,
    commitment = "confirmed",
    label,
    ...config
  }: {
    program: Solana.Address;
    commitment?: "finalized" | "confirmed";
    /** Limit the returned account data */
    dataSlice?: { offset: number; length: number };
    filters?: Array<SolanaRpcTypes.Filter>;
  } & RequestConfig): Promise<Array<SolanaClientTypes.Account>> => {
    const results = await makeRpcRequest({
      method: "getProgramAccounts",
      params: [
        program,
        {
          encoding: "base64",
          commitment,
          dataSlice,
          filters: filters?.filter((filter) => Boolean(filter)),
        },
      ],
      label,
      zod: z.array(SolanaRpcTypes.AccountWithPubkeyZ),
      ...config,
    });

    return results.map(normalizeRpcAccountWithPubkey);
  };

  export const getMinimumBalanceForRentExemption = async ({
    commitment = "confirmed",
    dataLength,
    rpcUrl,
  }: {
    commitment?: "finalized" | "confirmed";
    dataLength: number;
  } & RequestConfig): Promise<Solana.SolAmount> => {
    const lamports = await makeRpcRequest({
      method: "getMinimumBalanceForRentExemption",
      params: [
        dataLength,
        {
          commitment,
        },
      ],
      rpcUrl: rpcUrl,
      zod: z.number(),
    });
    return { lamports: lamports.toString() };
  };

  export const getMultipleAccounts = async ({
    addresses,
    commitment = "confirmed",
    rpcUrl,
  }: {
    addresses: Solana.Address[];
    commitment?: "finalized" | "confirmed";
  } & RequestConfig): Promise<
    Record<Solana.Address, SolanaClientTypes.Account | null>
  > => {
    const limit = pLimit(20);
    const chunks = chunk(addresses, MAX_ACCOUNTS_IN_ONE_REQUEST);

    const output: Record<Solana.Address, SolanaClientTypes.Account | null> = {};

    const promises = chunks.map((chunk) =>
      limit(async () => {
        const { value: result } = await makeRpcRequest({
          method: "getMultipleAccounts",
          params: [
            chunk,
            {
              encoding: "base64",
              commitment,
            },
          ],
          rpcUrl: rpcUrl,
          zod: z.object({
            context: z.object({
              slot: z.number(),
            }),
            value: z.array(SolanaRpcTypes.AccountZ.nullable()),
          }),
        });

        for (const [idx, account] of result.entries()) {
          const address = chunk[idx];

          if (!account) {
            output[address] = null;
          } else {
            output[address] = {
              buffer: Buffer.from(account.data[0], account.data[1]),
              executable: account.executable,
              lamports: account.lamports,
              owner: account.owner,
              parsed: false,
              pubkey: address,
            };
          }
        }
      })
    );

    await Promise.all(promises);

    return output;
  };

  export const getRecentBlockhash = async ({
    rpcUrl,
  }: RequestConfig): Promise<string> => {
    const resp = await makeRpcRequest({
      method: "getRecentBlockhash",
      rpcUrl: rpcUrl,
      params: [{ commitment: "finalized" }],
      zod: z.object({
        context: z.object({
          slot: z.number(),
        }),
        value: z.object({
          blockhash: z.string(),
          feeCalculator: z.object({
            lamportsPerSignature: z.number(),
          }),
        }),
      }),
    });
    return resp.value.blockhash;
  };

  export const sendTransaction = async ({
    transactionBase64,
    rpcUrl,
  }: RequestConfig & { transactionBase64: string }): Promise<string> => {
    return await makeRpcRequest({
      method: "sendTransaction",
      rpcUrl: rpcUrl,
      params: [transactionBase64, { encoding: "base64" }],
      zod: z.string(),
    });
  };

  export const getRecentPerformanceSamples = async ({
    limit,
    timeout = Duration.fromObject({ seconds: 5 }),
    ...config
  }: RequestConfig & { limit: number }): Promise<
    SolanaClientTypes.PerformanceSample[]
  > => {
    return await makeRpcRequest({
      method: "getRecentPerformanceSamples",
      params: [limit],
      timeout,
      zod: z.array(SolanaRpcTypes.PerformanceSampleZ),
      ...config,
    });
  };

  export const simulateTransaction = async ({
    txBuffer,
    commitment = "confirmed",
    requester,
    sourceUrl,
    ...config
  }: {
    requester?: Solana.Address | null;
    commitment?: "finalized" | "confirmed";
    txBuffer: Buffer;
    sourceUrl: string | null;
  } & RequestConfig): Promise<{
    logs: string[] | null;
    unitsConsumed?: number;
  }> => {
    // TODO: add ability to block certain transactions

    const result = await makeRpcRequest({
      method: "simulateTransaction",
      params: [
        txBuffer.toString("base64"),
        {
          sigVerify: false,
          commitment,
          encoding: "base64",
          replaceRecentBlockhash: true,
        },
      ],
      zod: z.object({
        value: z.object({
          err: z.any(),
          logs: z.array(z.string()).nullable(),
          accounts: z.array(SolanaRpcTypes.AccountZ.nullable()),
          unitsConsumed: z.number().optional(),
        }),
      }),
      ...config,
    });

    const postAccounts = result.value.accounts;
    if (result.value.err || postAccounts.some((account) => account === null)) {
      // TODO: add error parsing

      throw new GlowError("Error with simulation.");
    }

    return result.value;
  };

  export const getSignaturesForAddress = async ({
    address,
    before,
    until,
    limit,
    commitment = "confirmed",
    timeout = Duration.fromObject({ seconds: 30 }),
    ...config
  }: {
    address: Solana.Address;
    before?: string | undefined;
    until?: string | undefined;
    limit: number;
    commitment?: "finalized" | "confirmed";
  } & RequestConfig): Promise<
    Array<{ signature: string; timestamp: string }>
  > => {
    const results = await makeRpcRequest({
      method: "getSignaturesForAddress",
      params: [
        address,
        {
          limit,
          before: before || undefined,
          until: until || undefined,
          commitment,
        },
      ],
      zod: z.array(
        z.object({
          signature: z.string(),
          blockTime: z.number(),
        })
      ),
      timeout,
      ...config,
    });

    return results.map((r) => ({
      signature: r.signature,
      timestamp: DateTime.fromSeconds(r.blockTime).toUTC().toISO(),
    }));
  };

  export const getTokenAccountsByOwner = async ({
    commitment = "confirmed",
    filter,
    owner,
    ...config
  }: {
    commitment?: "finalized" | "confirmed";
    filter:
      | {
          programId?: never;
          mint: Solana.Address;
        }
      | {
          programId: Solana.Address;
          mint?: never;
        };
    owner: Solana.Address;
  } & RequestConfig): Promise<
    Array<SolanaClientTypes.ParsedAccount<TOKEN_ACCOUNT_DATA>>
  > => {
    const { value: result } = await makeRpcRequest({
      method: "getTokenAccountsByOwner",
      params: [owner, filter, { commitment, encoding: "base64" }],
      zod: z.object({
        value: z.array(SolanaRpcTypes.AccountWithPubkeyZ),
      }),
      ...config,
    });

    const accounts = [];

    for (const { account, pubkey } of result) {
      const parsed = TOKEN_ACCOUNT.parse({
        buffer: Buffer.from(account.data[0], "base64"),
      });
      if (!parsed) {
        continue;
      }
      accounts.push({
        data: parsed,
        executable: account.executable,
        lamports: account.lamports,
        owner: account.owner,
        parsed: true as const,
        pubkey,
        rentEpoch: account.rentEpoch,
      });
    }

    return accounts;
  };

  export const getTokenAccountsByDelegate = async ({
    commitment = "confirmed",
    filter,
    delegate,
    rpcUrl,
  }: {
    commitment?: "finalized" | "confirmed";
    filter:
      | {
          programId?: never;
          mint: Solana.Address;
        }
      | {
          programId: Solana.Address;
          mint?: never;
        };
    delegate: Solana.Address;
  } & RequestConfig): Promise<
    (SolanaClientTypes.Account | SolanaClientTypes.ParsedAccountGeneric)[]
  > => {
    const { value: result } = await makeRpcRequest({
      method: "getTokenAccountsByDelegate",
      params: [delegate, filter, { commitment, encoding: "jsonParsed" }],
      rpcUrl: rpcUrl,
      zod: z.object({
        value: z.array(SolanaRpcTypes.ParsedAccountWithPubkeyZ),
      }),
    });

    return result.map(normalizeRpcParsedAccountWithPubkey);
  };

  export const getTokenLargestAccounts = async ({
    commitment = "confirmed",
    mintAddress,
    timeout = Duration.fromObject({ seconds: 10 }),
    ...config
  }: {
    commitment?: "finalized" | "confirmed";
    mintAddress: Solana.Address;
  } & RequestConfig): Promise<SolanaClientTypes.TokenAccount[]> => {
    const resp = await makeRpcRequest({
      method: "getTokenLargestAccounts",
      params: [mintAddress, { commitment }],
      zod: z.object({
        value: z.array(
          z.object({
            address: Solana.AddressZ,
            amount: z.string(),
            decimals: z.number(),
            uiAmountString: z.string(),
          })
        ),
      }),
      timeout,
      ...config,
    });

    return resp.value;
  };

  export const getSignatureStatus = async ({
    signature,
    ...params
  }: {
    signature: string;
  } & RequestConfig): Promise<
    "processed" | "confirmed" | "finalized" | null
  > => {
    const [status] = await getSignatureStatuses({
      signatures: [signature],
      ...params,
    });
    return status;
  };

  export const getSignatureStatuses = async ({
    signatures,
    rpcUrl,
  }: {
    signatures: [string];
  } & RequestConfig): Promise<
    Array<"processed" | "confirmed" | "finalized" | null>
  > => {
    const response = await makeRpcRequest({
      method: "getSignatureStatuses",
      params: [signatures],
      rpcUrl: rpcUrl,
      zod: z.object({
        value: z.array(
          z
            .object({
              slot: z.number(),
              confirmations: z.number().nullable(),
              err: z.any(),
              confirmationStatus: z
                .enum(["processed", "confirmed", "finalized"])
                .nullable(),
            })
            .nullable()
        ),
      }),
    });

    return response.value.map((item) => item?.confirmationStatus || null);
  };

  export const getSlot = async ({
    commitment = "confirmed",
    rpcUrl,
  }: {
    commitment?: "finalized" | "confirmed";
  } & RequestConfig): Promise<number> => {
    return await makeRpcRequest({
      method: "getSlot",
      params: [{ commitment }],
      rpcUrl: rpcUrl,
      zod: z.number(),
    });
  };

  export const getBlockNumbersWithLimit = async ({
    start,
    limit,
    timeout = Duration.fromObject({ minutes: 2 }),
    commitment = "confirmed",
    ...config
  }: {
    start: number;
    limit: number;
    commitment?: "finalized" | "confirmed";
  } & RequestConfig): Promise<number[]> => {
    const result = await makeRpcRequest({
      method: "getBlocksWithLimit",
      params: [start, limit, { commitment }],
      timeout,
      zod: z.array(z.number()),
      ...config,
    });

    return result;
  };

  export const getBlockTime = async ({
    block_number,
    timeout = Duration.fromObject({ minutes: 1 }),
    ...config
  }: {
    block_number: number;
  } & RequestConfig): Promise<DateTime | null> => {
    try {
      const result = await makeRpcRequest({
        method: "getBlockTime",
        params: [block_number],
        zod: z.number().nullable(),
        timeout,
        ...config,
      });

      if (result) {
        return DateTime.fromSeconds(result);
      }

      return null;
    } catch (error: any) {
      if (
        error?.extraData?.rpcCode ===
          SolanaRpcError.SERVER_ERROR_LONG_TERM_STORAGE_SLOT_SKIPPED ||
        error?.extraData?.rpcCode === SolanaRpcError.SERVER_ERROR_SLOT_SKIPPED
      ) {
        return null;
      }

      throw error;
    }
  };

  export const requestAirdrop = async ({
    address,
    amount,
    timeout = Duration.fromObject({ minutes: 1 }),
    commitment = "confirmed",
    ...config
  }: {
    address: Solana.Address;
    amount: Solana.SolAmount;
    commitment?: "finalized" | "confirmed";
  } & RequestConfig): Promise<{ signature: Base58 }> => {
    const signature = await makeRpcRequest({
      method: "requestAirdrop",
      params: [
        address,
        new BigNumber(amount.lamports).toNumber(),
        { commitment },
      ],
      zod: z.string(),
      timeout,
      ...config,
    });
    return { signature };
  };
}

const makeRpcRequest = async <Response>({
  params,
  method,
  rpcUrl,
  zod: zodSchema,
  timeout,
}: {
  params: any[];
  method: string;
  zod: z.Schema<Response>;
} & RequestConfig): Promise<Response> => {
  // const event = honey.newEvent();
  // event.add({
  //   request_mode: "single",
  //   method,
  //   params,
  //   network,
  //   rpcUrl,
  //   url,
  //   label,
  //   timestamp: DateTime.now().toUTC().toISO(),
  //   isError: false,
  // });
  // const startHr = process.hrtime.bigint();

  try {
    timeout ||= Duration.fromObject({ minutes: 10 });
    const { data } = await axios.post<{ result?: unknown; error?: any }>(
      rpcUrl,
      {
        jsonrpc: "2.0",
        id: "1",
        method,
        params,
      },
      { timeout: timeout.as("millisecond") }
    );

    const parseResult = zodSchema.safeParse(data.result);

    if (parseResult.success) {
      return parseResult.data;
    }

    if (data.error) {
      throw new GlowError("Solana RPC returned an error", {
        code: "rpc-error",
        statusCode: 400,
        extraData: {
          method,
          params,
          rpcMessage: data.error.message,
          rpcCode: data.error.code,
        },
      });
    }

    console.error(
      "Unexpected response",
      method,
      JSON.stringify({
        params,
        parseError: parseResult.error,
        solanaResponse: data,
      })
    );
    throw new GlowError("Unexpected response from Solana.", {
      statusCode: 400,
      extraData: {
        method,
        params,
        solanaResponse: data,
        reason: parseResult.error,
      },
    });
  } catch (error) {
    // event.add({ isError: true });
    throw error;
  } finally {
    // Honeycomb after
    // const endHr = process.hrtime.bigint();
    // const duration_ms = new BigNumber((endHr - startHr).toString())
    //   .div(1_000_000)
    //   .toNumber();
    // console.log("Response", duration_ms, rpcUrl);
    // event.add({ duration_ms });
    // event.send();
  }
};
