import { VTransaction } from "../VTransaction";
import vTransaction5j9 from "./vtransaction-5j9WCjiybkEDMXYyuUTy8d2kEcJeaRyzcsPpkF4kmJdVbxR483dzKsJLRTrY91bKxi9tA94vfzqjCmdP3G596kBt.json";

describe("vTransaction", () => {
  test("vTransaction5j9", () => {
    console.log(vTransaction5j9);
    const vTransaciton = new VTransaction({
      transactionBase64: vTransaction5j9.transaction[0],
      meta: vTransaction5j9.meta,
    });
    console.log(vTransaciton);
  });
});
