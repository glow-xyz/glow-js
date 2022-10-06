import { Buffer } from "buffer";
import { GlowBorshTypes, SolanaClient } from "./src";
import { getTransactionVersion } from "./src/transaction/transaction-utils";

const main = async () => {
  await SolanaClient.getTransaction({
    signature:
      "2Y81shdjiJBChpZfncDtkhJ3rDFYkbTMjGKketCLprjoL2fPpSoc9QLmCuQzLEyYZSkAdRQ5dYWb4MXAz839gz9P",
    rpcUrl: "https://api.devnet.solana.com",
  });
  const txBuffer = Buffer.from(
    "ATi76PGbrz0K+1uiJiVIxfsXg5SE+zj9ZR/TKbTwtU6pPV84Qg5ZR4AaUjaef0uhFEw+XO8vkSwk7FaP9XO5JwWAAQABAn9ga/qYhdDgSftxl4CLVlBlRooyjZnabjgnerV4N1a5AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACmD6HHzY+RDvqxAZFPxVgCE7P6K8K2XJ1HTY4zWQ8dMgEBAgACDAIAAAABAAAAAAAAAAEfiZ3FeBS8m76OgSDN784WBijZvYu2yDuiOw5JxtU5cQEBAA==",
    "base64"
  );
  const version = getTransactionVersion({ buffer: txBuffer });
  console.log("version", version);
};

main();
