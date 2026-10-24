import { describe, expect, test } from "bun:test";

import * as web3 from "@solana/web3.js";

import { GKeypair } from "../../GKeypair";
import { GPublicKey } from "../../GPublicKey";
import { LTransaction } from "../LTransaction";

describe("LTransaction", () => {
  test("ignores signers that aren't required signers", () => {
    const payer = GKeypair.generate();
    const recipient = GKeypair.generate();

    const web3Transaction = new web3.Transaction({
      feePayer: new web3.PublicKey(payer.address),
      recentBlockhash: GPublicKey.nullString,
    }).add(
      web3.SystemProgram.transfer({
        fromPubkey: new web3.PublicKey(payer.address),
        toPubkey: new web3.PublicKey(recipient.address),
        lamports: 100000,
      }),
    );
    const initialBuffer = web3Transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    const ltransaction = new LTransaction({
      base64: initialBuffer.toString("base64"),
    });
    ltransaction.sign({ signers: [recipient] });
    expect(ltransaction.toHex()).toBe(initialBuffer.toString("hex"));

    ltransaction.sign({ signers: [payer] });
    web3Transaction.sign(payer as unknown as web3.Keypair);
    expect(ltransaction.toHex()).toBe(
      web3Transaction.serialize().toString("hex"),
    );
  });
});
