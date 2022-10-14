import { Buffer } from "buffer";
import { VTransaction } from "../VTransaction";
import vTransaction5j9 from "./vtransaction-5j9WCjiybkEDMXYyuUTy8d2kEcJeaRyzcsPpkF4kmJdVbxR483dzKsJLRTrY91bKxi9tA94vfzqjCmdP3G596kBt.json";

describe("vTransaction", () => {
  test("vTransaction5j9", () => {
    // console.log(vTransaction5j9);
    const vTransaction = new VTransaction({
      transactionBase64: vTransaction5j9.transaction[0],
      meta: vTransaction5j9.meta,
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
});
