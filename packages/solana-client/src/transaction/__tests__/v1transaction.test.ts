import bs58 from "bs58";
import { Buffer } from "buffer";
import nacl from "tweetnacl";
import { GKeypair } from "../../GKeypair";
import { GPublicKey } from "../../GPublicKey";
import { getTransactionVersion, signXTransaction } from "../transaction-utils";
import { V1Transaction } from "../V1Transaction";
import { XTransaction } from "../XTransaction";
import v1Transactions from "./v1-transactions.json";

// Builds an unsigned v1 transaction, with zeroed signatures, following
// SIMD-0385. Defaults to the fee payer calling a readonly program.
const buildV1Transaction = ({
  addresses = [GKeypair.generate().address, GPublicKey.nullString],
  numRequiredSigs = 1,
  numReadonlySigned = 0,
  numReadonlyUnsigned = 1,
  configMask = 0,
  configValues = Buffer.alloc(0),
  instructions = [{ programIdx: 1, accountIdxs: [0], data: [] }],
}: {
  addresses?: string[];
  numRequiredSigs?: number;
  numReadonlySigned?: number;
  numReadonlyUnsigned?: number;
  configMask?: number;
  configValues?: Buffer;
  instructions?: Array<{
    programIdx: number;
    accountIdxs: number[];
    data: number[];
  }>;
} = {}): Buffer => {
  const mask = Buffer.alloc(4);
  mask.writeUInt32LE(configMask >>> 0);

  const instructionHeaders = instructions.map((ix) => {
    const header = Buffer.alloc(4);
    header[0] = ix.programIdx;
    header[1] = ix.accountIdxs.length;
    header.writeUInt16LE(ix.data.length, 2);
    return header;
  });

  return Buffer.concat([
    Buffer.of(0x81, numRequiredSigs, numReadonlySigned, numReadonlyUnsigned),
    mask,
    Buffer.from(bs58.decode(GPublicKey.nullString)), // blockhash
    Buffer.of(instructions.length, addresses.length),
    ...addresses.map((address) => Buffer.from(bs58.decode(address))),
    configValues,
    ...instructionHeaders,
    ...instructions.map((ix) => Buffer.of(...ix.accountIdxs, ...ix.data)),
    Buffer.alloc(64 * numRequiredSigs),
  ]);
};

// Mainnet transactions, with the RPC's own decoding (json and jsonParsed
// encodings) as the expected values. They cover every config field, one and
// two signers, and up to 60 addresses.
describe("v1 mainnet transactions", () => {
  test.each(v1Transactions.map((fixture) => [fixture.signature, fixture]))(
    "%s",
    (_signature, { base64, expected }) => {
      const tx = XTransaction.parse({ base64, loadedAddresses: null });
      expect(tx).toBeInstanceOf(V1Transaction);

      const addresses = expected.accountKeys.map((key) => key.address);
      expect(tx.addresses).toEqual(addresses);
      expect(tx.accounts).toEqual(
        expected.accountKeys.map((key) => ({ ...key, wasLookedUp: false }))
      );
      expect(tx.latestBlockhash).toBe(expected.recentBlockhash);
      expect(tx.numRequiredSigs).toBe(expected.header.numRequiredSignatures);
      expect(tx.signature).toBe(expected.signatures[0]);
      expect(tx.feePayer).toBe(addresses[0]);
      expect((tx as V1Transaction).config).toEqual(expected.transactionConfig);

      expect(tx.instructions).toEqual(
        expected.instructions.map((ix) => ({
          program: addresses[ix.programIdIndex],
          accounts: ix.accounts.map((idx) => addresses[idx]),
          data_base64: Buffer.from(bs58.decode(ix.data)).toString("base64"),
        }))
      );

      expect(tx.toBase64()).toBe(base64);
    }
  );

  test.each(v1Transactions.map((fixture) => [fixture.signature, fixture]))(
    "%s signatures verify against the message",
    (_signature, { base64, expected }) => {
      const { version, messageBuffer, signatures } = getTransactionVersion({
        buffer: Buffer.from(base64, "base64"),
      });

      expect(version).toBe(1);
      expect(signatures).toEqual(expected.signatures);
      signatures.forEach((signature, idx) => {
        expect(
          nacl.sign.detached.verify(
            messageBuffer,
            bs58.decode(signature),
            bs58.decode(expected.accountKeys[idx].address)
          )
        ).toBe(true);
      });
    }
  );
});

describe("v1 signing", () => {
  test("V1Transaction.sign and signXTransaction produce the same valid signature", () => {
    const feePayer = GKeypair.generate();
    const unsigned = buildV1Transaction({
      addresses: [feePayer.address, GPublicKey.nullString],
      numReadonlyUnsigned: 1,
      instructions: [{ programIdx: 1, accountIdxs: [0], data: [2, 0, 0, 0] }],
    });
    const base64 = unsigned.toString("base64");

    const signedTx = new V1Transaction({ base64 }).sign({
      signers: [feePayer],
    });
    const { signed_transaction } = signXTransaction({
      base64,
      signer: feePayer,
    });

    expect(signedTx.toHex()).toBe(signed_transaction.toString("hex"));
    expect(signed_transaction.length).toBe(unsigned.length);

    const { messageBuffer } = getTransactionVersion({
      buffer: signed_transaction,
    });
    expect(
      nacl.sign.detached.verify(
        messageBuffer,
        bs58.decode(signedTx.signature),
        bs58.decode(feePayer.address)
      )
    ).toBe(true);
  });

  test("signing as the second signer leaves the fee payer's signature alone", () => {
    const feePayer = GKeypair.generate();
    const cosigner = GKeypair.generate();
    const unsigned = buildV1Transaction({
      addresses: [feePayer.address, cosigner.address, GPublicKey.nullString],
      numRequiredSigs: 2,
      numReadonlyUnsigned: 1,
      instructions: [{ programIdx: 2, accountIdxs: [0, 1], data: [] }],
    });

    const tx = new V1Transaction({ base64: unsigned.toString("base64") }).sign({
      signers: [cosigner],
    });
    const { signatures } = getTransactionVersion({ buffer: tx.toBuffer() });

    expect(signatures[0]).toBe(bs58.encode(Buffer.alloc(64)));
    expect(signatures[1]).not.toBe(bs58.encode(Buffer.alloc(64)));
  });
});

describe("v1 parsing", () => {
  test("reads config values in bit order and skips unknown fields", () => {
    const configValues = Buffer.alloc(24);
    configValues.writeBigUInt64LE(BigInt(5000), 0); // bits 0 and 1
    configValues.writeUInt32LE(200_000, 8); // bit 2
    configValues.writeUInt32LE(64 * 1024, 12); // bit 4
    configValues.writeUInt32LE(123, 16); // bit 5, not defined yet
    configValues.writeUInt32LE(456, 20); // bit 31, not defined yet

    const tx = new V1Transaction({
      base64: buildV1Transaction({
        configMask: 0b110111 | (1 << 31),
        configValues,
      }).toString("base64"),
    });

    expect(tx.config).toEqual({
      priorityFee: 5000,
      computeUnitLimit: 200_000,
      loadedAccountsDataSizeLimit: null,
      heapSize: 64 * 1024,
    });
  });

  test("reads instruction data longer than 255 bytes", () => {
    const data = Array.from({ length: 300 }, (_, i) => i % 256);
    const tx = new V1Transaction({
      base64: buildV1Transaction({
        instructions: [{ programIdx: 1, accountIdxs: [0], data }],
      }).toString("base64"),
    });

    expect(tx.instructions[0].data_base64).toBe(
      Buffer.from(data).toString("base64")
    );
  });

  test("marks readonly signers and readonly non-signers", () => {
    const tx = new V1Transaction({
      base64: buildV1Transaction({
        addresses: [
          GKeypair.generate().address,
          GKeypair.generate().address,
          GKeypair.generate().address,
          GKeypair.generate().address,
        ],
        numRequiredSigs: 2,
        numReadonlySigned: 1,
        numReadonlyUnsigned: 1,
        instructions: [],
      }).toString("base64"),
    });

    expect(
      tx.accounts.map(({ signer, writable }) => ({ signer, writable }))
    ).toEqual([
      { signer: true, writable: true },
      { signer: true, writable: false },
      { signer: false, writable: true },
      { signer: false, writable: false },
    ]);
  });

  test.each<[string, Buffer]>([
    ["is truncated", buildV1Transaction().subarray(0, -1)],
    ["has trailing data", Buffer.concat([buildV1Transaction(), Buffer.of(0)])],
    [
      "sets only one priority fee bit",
      buildV1Transaction({ configMask: 0b1, configValues: Buffer.alloc(4) }),
    ],
    [
      "references an account that doesn't exist",
      buildV1Transaction({
        instructions: [{ programIdx: 1, accountIdxs: [2], data: [] }],
      }),
    ],
    [
      "references a program that doesn't exist",
      buildV1Transaction({
        instructions: [{ programIdx: 2, accountIdxs: [], data: [] }],
      }),
    ],
    ["has no signers", buildV1Transaction({ numRequiredSigs: 0 })],
  ])("throws when the transaction %s", (_description, buffer) => {
    expect(
      () => new V1Transaction({ base64: buffer.toString("base64") })
    ).toThrow("Cannot parse v1 transaction");
  });
});
