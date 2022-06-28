import bs58 from "bs58";
import { Buffer } from "buffer";
import sortBy from "lodash/sortBy";
import nacl from "tweetnacl";
import { z } from "zod";
import { Base58, Solana } from "./base-types";
import { FixableGlowBorsh } from "./borsh/base";
import { GlowBorshTypes } from "./borsh/GlowBorshTypes";
import { TRANSACTION_MESSAGE } from "./borsh/transaction-borsh";

/**
 * This is useful for manipulating existing transactions for a few reasons:
 *
 * 1. there are some bugs with web3.js that cause it to throw errors on valid transactions
 * 2. web3.js is heavy and is probably slower than this (not tested)
 * 3. web3.js is changing all of the time so a bug could easily be introduced in an update
 * 4. this returns a nicer data format for us to consume
 *
 * Note: this only lets you _parse, sign and serialize_ existing, valid transactions. It does not
 * allow modifying a transaction.
 */
export namespace GTransaction {
  const SignatureZ = z.object({
    signature: z.string().nullable(), // base58
    address: Solana.AddressZ,
  });

  const AccountZ = z.object({
    address: Solana.AddressZ,
    signer: z.boolean(),
    writable: z.boolean(),
  });

  const InstructionZ = z.object({
    accounts: z.array(Solana.AddressZ),
    program: Solana.AddressZ,
    data_base64: z.string(),
  });
  export type Instruction = z.infer<typeof InstructionZ>;

  // This is useful when creating a Transaction from instructions. Each instruction
  // requests that an account should be writable or a signer. But when we serialize the transaction
  // we just store information for an account if it's a signer or writable on *any* instruction.
  // Solana txs don't store information about which instruction requested the account to be a
  // signer or writable.
  const InstructionFactoryZ = z.object({
    accounts: z.array(
      z.object({
        address: Solana.AddressZ,
        writable: z.boolean().optional(),
        signer: z.boolean().optional(),
      })
    ),
    program: Solana.AddressZ,
    data_base64: z.string(),
  });
  export type InstructionFactory = z.infer<typeof InstructionFactoryZ>;

  export const GTransactionZ = z.object({
    signature: z.string().nullable(),
    signatures: z.array(SignatureZ),
    accounts: z.array(AccountZ),
    recentBlockhash: z.string(), // Base58
    instructions: z.array(InstructionZ),
    messageBase64: z.string(),
  });
  export type GTransaction = z.infer<typeof GTransactionZ>;

  export const create = ({
    instructions,
    recentBlockhash,
    feePayer,
  }: {
    instructions: InstructionFactory[];
    recentBlockhash: string;
    feePayer?: string;
  }): GTransaction => {
    const accountMap: Record<
      Solana.Address,
      { writable: boolean; signer: boolean }
    > = {};

    for (const { accounts, program } of instructions) {
      const currentProgramVal = accountMap[program];
      accountMap[program] = {
        signer: Boolean(currentProgramVal?.signer),
        writable: Boolean(currentProgramVal?.writable),
      };

      for (const { signer, writable, address } of accounts) {
        const currentVal = accountMap[address];
        accountMap[address] = {
          signer: Boolean(currentVal?.signer || signer),
          writable: Boolean(currentVal?.writable || writable),
        };
      }
    }

    // Fee payer needs to always be writable and a signer
    // https://github.com/solana-labs/solana-web3.js/blob/2f80949da901e42d5f5565c44c3b3095ac024e67/src/transaction.ts#L428-L429
    if (feePayer) {
      accountMap[feePayer].signer = true;
      accountMap[feePayer].writable = true;
    }

    const unsortedAccounts = Object.entries(accountMap).map(
      ([address, { writable, signer }]) => ({ writable, signer, address })
    );

    const accounts = sortBy(
      unsortedAccounts,
      ({ signer, address, writable }) => {
        if (address === feePayer) {
          return [0, address];
        }
        if (signer && writable) {
          return [2, address];
        }
        if (signer) {
          return [3, address];
        }
        if (writable) {
          return [4, address];
        }
        return [5, address];
      }
    );
    const signerAccounts = accounts.filter((a) => a.signer);
    const signatures = signerAccounts.map((a) => ({
      address: a.address,
      signature: null,
    }));

    const messageBase64 = constructMessageBase64({
      instructions,
      accounts,
      recentBlockhash,
    });

    return {
      signature: null,
      signatures,
      accounts,
      recentBlockhash,
      messageBase64,
      instructions: instructions.map(({ accounts, program, data_base64 }) => ({
        program,
        data_base64,
        accounts: accounts.map((a) => a.address),
      })),
    };
  };

  export const sign = ({
    secretKey,
    gtransaction,
  }: {
    gtransaction: GTransaction;
    secretKey: Buffer | Uint8Array;
  }): GTransaction => {
    const keypair = nacl.sign.keyPair.fromSecretKey(secretKey);
    const address = bs58.encode(keypair.publicKey);

    if (gtransaction.signatures.every((sig) => sig.address !== address)) {
      throw new Error(
        `This transaction does not require a signature from: ${address}`
      );
    }

    const message = Buffer.from(gtransaction.messageBase64, "base64");
    const signatureUint = nacl.sign.detached(message, secretKey);

    return GTransaction.addSignature({
      gtransaction,
      address,
      signature: Buffer.from(signatureUint),
    });
  };

  export const parse = ({ buffer }: { buffer: Buffer }): GTransaction => {
    const signaturesCoder =
      GlowBorshTypes.transactionSignaturesSection.toFixedFromData(buffer, 0);
    const sigs = signaturesCoder.read(buffer, 0);

    const messageBuffer = buffer.slice(signaturesCoder.byteSize);
    const {
      numReadonlySigned,
      numReadonlyUnsigned,
      numRequiredSigs,
      recentBlockhash,
      instructions: rawInstructions,
      addresses,
    } = TRANSACTION_MESSAGE.parse({ buffer: messageBuffer })!;

    const numAccounts = addresses.length;

    const accounts = addresses.map((address, idx) => ({
      address,
      signer: idx < numRequiredSigs,
      writable:
        idx < numRequiredSigs - numReadonlySigned ||
        (idx >= numRequiredSigs &&
          idx < addresses.length - numReadonlyUnsigned),
    }));

    const instructions: z.infer<typeof InstructionZ>[] = rawInstructions.map(
      ({ programIdx, accountIdxs, data }) => ({
        program: addresses[programIdx],
        accounts: accountIdxs.map((idx) => {
          if (idx >= numAccounts) {
            throw new Error("Account not found.");
          }
          return addresses[idx];
        }),
        data_base64: data.toString("base64"),
      })
    );

    const signatures: Array<{
      signature: Base58;
      address: Solana.Address;
    }> = sigs.map((signature, idx) => ({
      signature,
      address: addresses[idx],
    }));

    return GTransactionZ.parse({
      signature: signatures[0].signature,
      signatures,
      recentBlockhash,
      instructions,
      accounts,
      messageBase64: messageBuffer.toString("base64"),
    });
  };

  export const addSignature = ({
    gtransaction,
    address,
    signature,
  }: {
    gtransaction: GTransaction;
    address: Solana.Address;
    signature: Buffer;
  }): GTransaction => {
    const accountIndex = gtransaction.accounts.findIndex(
      (account) => account.address === address
    );

    if (accountIndex < 0) {
      throw new Error(
        `This transaction does not require a signature from: ${address}`
      );
    }

    // Copy signatures map not to mutate original transaction
    const signatures = gtransaction.signatures.map((sig, index) => {
      return {
        address: sig.address,
        signature:
          index === accountIndex ? bs58.encode(signature) : sig.signature,
      };
    });

    return {
      ...gtransaction,
      signatures,
      signature: signatures[0].signature,
    };
  };

  export const toBuffer = ({
    gtransaction,
  }: {
    gtransaction: GTransaction;
  }): Buffer => {
    const messageBuffer = Buffer.from(gtransaction.messageBase64, "base64");
    const signaturesFixedBeet = FixableGlowBorsh.compactArray({
      itemCoder: GlowBorshTypes.signatureNullable,
    }).toFixedFromValue(
      gtransaction.signatures.map(({ signature }) => signature)
    );
    const txBufferSize =
      signaturesFixedBeet.byteSize + messageBuffer.byteLength;

    const txBuffer = Buffer.alloc(txBufferSize);
    signaturesFixedBeet.write(
      txBuffer,
      0,
      gtransaction.signatures.map(({ signature }) => signature)
    );
    messageBuffer.copy(txBuffer, signaturesFixedBeet.byteSize);

    return txBuffer;
  };
}

const constructMessageBase64 = ({
  instructions,
  accounts,
  recentBlockhash,
}: {
  instructions: GTransaction.InstructionFactory[];
  accounts: GTransaction.GTransaction["accounts"];
  recentBlockhash: string;
}): string => {
  const numRequiredSigs = accounts.filter((a) => a.signer).length;
  const numReadOnlySigs = accounts.filter(
    (a) => !a.writable && a.signer
  ).length;
  const numReadonlyUnsigned = accounts.filter(
    (a) => !a.writable && !a.signer
  ).length;

  const accountToInfo = Object.fromEntries(
    accounts.map(({ address, signer, writable }, idx) => {
      return [address, { signer, writable, idx }];
    })
  );
  const addresses = accounts.map((a) => a.address);

  const compiledInstructions = instructions.map(
    ({ program, accounts, data_base64 }) => {
      const { idx: programIdx } = accountToInfo[program];
      const accountIdxs = accounts.map((a) => accountToInfo[a.address].idx);
      const data = Buffer.from(data_base64, "base64");
      return {
        programIdx,
        accountIdxs,
        data,
      };
    }
  );

  const messageBuffer = TRANSACTION_MESSAGE.toBuffer({
    numReadonlySigned: numReadOnlySigs,
    recentBlockhash,
    numReadonlyUnsigned,
    numRequiredSigs,
    instructions: compiledInstructions,
    addresses,
  });

  return messageBuffer.toString("base64");
};
