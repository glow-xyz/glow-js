import zip from "lodash/zip";
import { Buffer } from "buffer";
import { GKeypair } from "../../GKeypair";
import { GPublicKey } from "../../GPublicKey";
import { VTransaction } from "../VTransaction";
import * as web3 from "@solana/web3.js";
import vTransaction5j9 from "./vtransaction-5j9WCjiybkEDMXYyuUTy8d2kEcJeaRyzcsPpkF4kmJdVbxR483dzKsJLRTrY91bKxi9tA94vfzqjCmdP3G596kBt.json";
import vTransaction3N3 from "./vtransaction-3N3xmERQotKh5of4H5Q5UEjwMKhaDR52pfJHCGRcQUD5hHTBX9hnXBbRcJ6CiFczrRtPhtx3b2ddd2kSjvZP7Cg.json";

describe("vTransaction", () => {
  test("vTransaction5j9 does not error if we don't pass in loadedAddresses", () => {
    // We want to be able to get basic info about the transaction without erroring.
    const vTransaction = new VTransaction({
      base64: vTransaction5j9.transaction[0],
      loadedAddresses: null,
    });
    expect(async () => {
      vTransaction.instructions;
    }).rejects.toThrow();
  });

  test("vTransaction5j9", () => {
    // console.log(vTransaction5j9);
    const vTransaction = new VTransaction({
      base64: vTransaction5j9.transaction[0],
      loadedAddresses: vTransaction5j9.meta.loadedAddresses,
    });
    console.log(vTransaction.addresses);

    expect(vTransaction.addresses).toEqual([
      "5fFbz3RE24mGVceM5N2SKcVHP5nqqq28PoGwJNtMVT6y",
      "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
      "1111111QLbz7JHiBTspS962RLKV8GndWFwiEaqKM",
      "11111112D1oxKts8YPdTJRG5FzxTNpMtWmq8hkVx3",
      "111111131h1vYVSYuKP6AhS86fbRdMw9XHiZAvAaj",
      "11111113pNDtm61yGF8j2ycAwLEPsuWQXobye5qDR",
      "11111114d3RrygbPdAtMuFnDmzsN8T5fYKVQ7FVr7",
      "11111115RidqCHAoz6dzmXxGcfWLNzevYqNpaRAUo",
      "11111116EPqoQskEM2Pddp8KTL9JdYEBZMGF3aq7V",
      "11111117353mdUKehx9GW6JNHznGt5oSZs9fWkVkB",
      "11111117qkFjr4u54stuNNUR8fRF8dNhaP35yvANs",
      "11111118eRTi4fUVRoeYEeeTyL4DPAwxatvWT5q1Z",
      "11111119T6fgHG3unjQB6vpWozhBdiXDbQovvFVeF",
      "1111111AFmseVrdL9f9oyCzZefL9tG6UbvhMPRAGw",
      "1111111ogCyDbaRMvkdsHB3qfdyFYaG1WtRUAfdh",
      "11111112cMQwSC9qirWGjZM6gLGwW69X22mqwLLGP",
      "11111113R2cuenjG5nFubqX9Wzuukdin2YfGQVzu5",
      "11111114DhpssPJgSi1YU7hCMfYt1BJ334YgsffXm",
      "111111152P2r5yt6odmBLPsFCLBrFisJ3aS7LqLAT",
      "11111115q4EpJaTXAZWpCg3J2zppWGSZ46KXozzo9",
      "11111116djSnXB2wXVGT4xDLsfTnkp1p4cCxHAfRq",
      "11111117SQekjmcMtR25wEPPiL6m1Mb5586NkLL4X",
      "11111118F5rixNBnFLmioWZSYzjjFuAL5dyoDVzhD",
      "111111193m4hAxmCcGXMfnjVPfNhWSjb69sDgffKu",
      "11111119rSGfPZLcyCGzY4uYEL1fkzJr6fke9qKxb",
      "1111111Af7Udc9v3L82dQM5b4zee1Xt77Be4czzbH",
    ]);

    expect(vTransaction.instructions).toEqual([
      {
        data_base64: Buffer.from(
          "48656c6c6f2c2066726f6d2074686520536f6c616e612057616c6c65742041646170746572206578616d706c652061707021",
          "hex"
        ).toString("base64"),
        program: "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
        accounts: [
          "1111111QLbz7JHiBTspS962RLKV8GndWFwiEaqKM",
          "1111111ogCyDbaRMvkdsHB3qfdyFYaG1WtRUAfdh",
          "11111112D1oxKts8YPdTJRG5FzxTNpMtWmq8hkVx3",
          "11111112cMQwSC9qirWGjZM6gLGwW69X22mqwLLGP",
          "111111131h1vYVSYuKP6AhS86fbRdMw9XHiZAvAaj",
          "11111113R2cuenjG5nFubqX9Wzuukdin2YfGQVzu5",
          "11111113pNDtm61yGF8j2ycAwLEPsuWQXobye5qDR",
          "11111114DhpssPJgSi1YU7hCMfYt1BJ334YgsffXm",
          "11111114d3RrygbPdAtMuFnDmzsN8T5fYKVQ7FVr7",
          "111111152P2r5yt6odmBLPsFCLBrFisJ3aS7LqLAT",
          "11111115RidqCHAoz6dzmXxGcfWLNzevYqNpaRAUo",
          "11111115q4EpJaTXAZWpCg3J2zppWGSZ46KXozzo9",
          "11111116EPqoQskEM2Pddp8KTL9JdYEBZMGF3aq7V",
          "11111116djSnXB2wXVGT4xDLsfTnkp1p4cCxHAfRq",
          "11111117353mdUKehx9GW6JNHznGt5oSZs9fWkVkB",
          "11111117SQekjmcMtR25wEPPiL6m1Mb5586NkLL4X",
          "11111117qkFjr4u54stuNNUR8fRF8dNhaP35yvANs",
          "11111118F5rixNBnFLmioWZSYzjjFuAL5dyoDVzhD",
          "11111118eRTi4fUVRoeYEeeTyL4DPAwxatvWT5q1Z",
          "111111193m4hAxmCcGXMfnjVPfNhWSjb69sDgffKu",
          "11111119T6fgHG3unjQB6vpWozhBdiXDbQovvFVeF",
          "11111119rSGfPZLcyCGzY4uYEL1fkzJr6fke9qKxb",
          "1111111AFmseVrdL9f9oyCzZefL9tG6UbvhMPRAGw",
          "1111111Af7Udc9v3L82dQM5b4zee1Xt77Be4czzbH",
        ],
      },
    ]);
  });

  test("vTransaction3N3", () => {
    const transactionBase64 = vTransaction3N3.transaction[0];
    const txBuffer = Buffer.from(transactionBase64, "base64");
    const vTransaction = new VTransaction({
      base64: transactionBase64,
      loadedAddresses: vTransaction3N3.meta.loadedAddresses,
    });

    const web3VersionedTx = web3.VersionedTransaction.deserialize(txBuffer);
    const web3TxMessage = web3.TransactionMessage.decompile(
      web3VersionedTx.message,
      {
        accountKeysFromLookups: {
          writable: vTransaction3N3.meta.loadedAddresses.writable.map(
            (address) => new web3.PublicKey(address)
          ),
          readonly: vTransaction3N3.meta.loadedAddresses.readonly.map(
            (address) => new web3.PublicKey(address)
          ),
        },
      }
    );

    expect(vTransaction.instructions.length).toBe(
      web3TxMessage.instructions.length
    );
    for (const [web3Ix, ix] of zip(
      web3TxMessage.instructions,
      vTransaction.instructions
    )) {
      expect(ix).toEqual({
        accounts: web3Ix!.keys.map(({ pubkey }) => pubkey.toBase58()),
        program: web3Ix!.programId.toBase58(),
        data_base64: web3Ix!.data.toString("base64"),
      });
    }
  });

  test("signing a transaction", () => {
    const keypair = GKeypair.generate();

    // Set up web3 transaction
    const pubkey = new web3.PublicKey(keypair.address);
    const instructions = [
      web3.SystemProgram.transfer({
        fromPubkey: pubkey,
        toPubkey: pubkey,
        lamports: 100000,
      }),
    ];
    const messageV0 = new web3.TransactionMessage({
      payerKey: pubkey,
      recentBlockhash: GPublicKey.nullString,
      instructions,
    }).compileToV0Message();
    const web3Transaction = new web3.VersionedTransaction(messageV0);
    const initialBase64 = Buffer.from(web3Transaction.serialize()).toString(
      "base64"
    );

    // Set up the vtransaction
    const vtransaction = new VTransaction({
      base64: initialBase64,
      loadedAddresses: { writable: [], readonly: [] },
    });
    expect(vtransaction.toHex()).toBe(
      Buffer.from(initialBase64, "base64").toString("hex")
    );

    web3Transaction.sign([keypair as unknown as web3.Keypair]);
    const signedHex = Buffer.from(web3Transaction.serialize()).toString("hex");
    expect(vtransaction.sign({ signers: [keypair] }).toHex()).toBe(signedHex);
  });
});
