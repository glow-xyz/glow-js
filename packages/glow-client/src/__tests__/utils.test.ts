import bs58 from "bs58";
import { Buffer } from "buffer";
import nacl from "tweetnacl";
import { verifySignature } from "../utils";

describe("verifySignature", () => {
  test("confirms a valid signature", async () => {
    const message = "hi";
    const messageBuff = Buffer.from(message);
    const keypair = nacl.sign.keyPair();
    const signedMessage = nacl.sign.detached(messageBuff, keypair.secretKey);

    verifySignature({
      signature: Buffer.from(signedMessage).toString("base64"),
      message,
      signer: bs58.encode(keypair.publicKey),
    });
  });

  test("rejects an invalid signature", async () => {
    const keypair = nacl.box.keyPair();
    await expect(async () => {
      verifySignature({
        signature: "ab",
        message: "hi",
        signer: bs58.encode(keypair.publicKey),
      });
    }).rejects.toThrow();
  });
});
