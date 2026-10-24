import { Buffer } from "buffer";
import { afterEach, describe, expect, test } from "bun:test";

import { Duration } from "luxon";

import vTransaction5j9 from "../../transaction/__tests__/vtransaction-5j9WCjiybkEDMXYyuUTy8d2kEcJeaRyzcsPpkF4kmJdVbxR483dzKsJLRTrY91bKxi9tA94vfzqjCmdP3G596kBt.json";
import { SolanaClient } from "../solana-client";

const rpcUrl = "http://localhost:8899";
const originalFetch = globalThis.fetch;

const mockRpcResult = (result: unknown) => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({ jsonrpc: "2.0", id: "1", result }),
    )) as unknown as typeof fetch;
};

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("getTransaction", () => {
  test("decodes a v0 transaction with loaded addresses", async () => {
    mockRpcResult(vTransaction5j9);

    const { transaction } = await SolanaClient.getTransaction({
      rpcUrl,
      signature: "5j9",
    });

    const { writable, readonly } = vTransaction5j9.meta.loadedAddresses;
    expect(transaction.accounts.map((a) => a.address).slice(-24)).toEqual([
      ...writable,
      ...readonly,
    ]);
    expect(transaction.instructions[0].program).toBe(
      "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
    );
  });
});

describe("confirmTransaction", () => {
  test("returns when the transaction succeeded", async () => {
    mockRpcResult(vTransaction5j9);

    await SolanaClient.confirmTransaction({ rpcUrl, signature: "5j9" });
  });

  test("throws when the transaction failed", async () => {
    const err = { InstructionError: [0, { Custom: 1 }] };
    mockRpcResult({
      ...vTransaction5j9,
      meta: { ...vTransaction5j9.meta, err },
    });

    await expect(
      SolanaClient.confirmTransaction({
        rpcUrl,
        signature: "5j9",
        pollInterval: Duration.fromObject({ millisecond: 1 }),
      }),
    ).rejects.toThrow("Transaction failed.");
  });
});

describe("simulateTransaction", () => {
  test("accepts a response without accounts", async () => {
    mockRpcResult({
      context: { slot: 1 },
      value: { err: null, logs: ["log"], accounts: null, unitsConsumed: 150 },
    });

    const result = await SolanaClient.simulateTransaction({
      rpcUrl,
      txBuffer: Buffer.from([]),
      sourceUrl: null,
    });
    expect(result.logs).toEqual(["log"]);
  });
});
