import BN from "bn.js";
import { Buffer } from "buffer";
import { EllipticCurve } from "../EllipticCurve";
import { GKeypair } from "../GKeypair";
import { GPublicKey } from "../GPublicKey";

describe("GPublicKey", function () {
  test("invalid", async () => {
    await expect(async () => {
      new GPublicKey([
        3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
      ]);
    }).rejects.toThrow();

    await expect(async () => {
      new GPublicKey(
        "0x300000000000000000000000000000000000000000000000000000000000000000000"
      );
    }).rejects.toThrow();

    await expect(async () => {
      new GPublicKey(
        "0x300000000000000000000000000000000000000000000000000000000000000"
      );
    }).rejects.toThrow();

    await expect(async () => {
      new GPublicKey(
        "135693854574979916511997248057056142015550763280047535983739356259273198796800000"
      );
    }).rejects.toThrow();

    await expect(async () => {
      new GPublicKey("12345");
    }).rejects.toThrow();
  });

  test("equals", () => {
    const arrayKey = new GPublicKey([
      3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0,
    ]);
    const base58Key = new GPublicKey(
      "CiDwVBFgWV9E5MvXWoLgnEgn2hK7rJikbvfWavzAQz3"
    );

    expect(arrayKey.equals(base58Key)).toBeTruthy();
  });

  test("toBase58", () => {
    const key = new GPublicKey("CiDwVBFgWV9E5MvXWoLgnEgn2hK7rJikbvfWavzAQz3");
    expect(key.toBase58()).toBe("CiDwVBFgWV9E5MvXWoLgnEgn2hK7rJikbvfWavzAQz3");
    expect(key.toString()).toBe("CiDwVBFgWV9E5MvXWoLgnEgn2hK7rJikbvfWavzAQz3");

    const key2 = new GPublicKey("1111111111111111111111111111BukQL");
    expect(key2.toBase58()).toBe("1111111111111111111111111111BukQL");
    expect(key2.toString()).toBe("1111111111111111111111111111BukQL");

    const key3 = new GPublicKey("11111111111111111111111111111111");
    expect(key3.toBase58()).toBe("11111111111111111111111111111111");

    const key4 = new GPublicKey([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0,
    ]);
    expect(key4.toBase58()).toBe("11111111111111111111111111111111");
  });

  test("toJSON", () => {
    const key = new GPublicKey("CiDwVBFgWV9E5MvXWoLgnEgn2hK7rJikbvfWavzAQz3");
    expect(key.toJSON()).toBe("CiDwVBFgWV9E5MvXWoLgnEgn2hK7rJikbvfWavzAQz3");
    expect(JSON.stringify(key)).toBe(
      '"CiDwVBFgWV9E5MvXWoLgnEgn2hK7rJikbvfWavzAQz3"'
    );
    expect(JSON.stringify({ key })).toBe(
      '{"key":"CiDwVBFgWV9E5MvXWoLgnEgn2hK7rJikbvfWavzAQz3"}'
    );
  });

  test("toBuffer", () => {
    const key = new GPublicKey("CiDwVBFgWV9E5MvXWoLgnEgn2hK7rJikbvfWavzAQz3");
    expect(key.toBuffer().byteLength).toBe(32);
    expect(key.toBase58()).toBe("CiDwVBFgWV9E5MvXWoLgnEgn2hK7rJikbvfWavzAQz3");

    const key2 = new GPublicKey("11111111111111111111111111111111");
    expect(key2.toBuffer().byteLength).toBe(32);
    expect(key2.toBase58()).toBe("11111111111111111111111111111111");

    const key3 = new GPublicKey(0);
    expect(key3.toBuffer().byteLength).toBe(32);
    expect(key3.toBase58()).toBe("11111111111111111111111111111111");
  });

  test("equals (II)", () => {
    const key1 = new GPublicKey([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 1,
    ]);
    const key2 = new GPublicKey(key1.toBuffer());

    expect(key1.equals(key2)).toBeTruthy();
  });

  test("createProgramAddress", async () => {
    const programId = new GPublicKey(
      "BPFLoader1111111111111111111111111111111111"
    );
    const publicKey = new GPublicKey(
      "SeedPubey1111111111111111111111111111111111"
    );

    let programAddress = await EllipticCurve.createProgramAddress(
      [Buffer.from("", "utf8"), Buffer.from([1])],
      programId.toBase58()
    );
    expect(programAddress).toBe("3gF2KMe9KiC6FNVBmfg9i267aMPvK37FewCip4eGBFcT");

    programAddress = await EllipticCurve.createProgramAddress(
      [Buffer.from("☉", "utf8")],
      programId.toBase58()
    );
    expect(programAddress).toBe("7ytmC1nT1xY4RfxCV2ZgyA7UakC93do5ZdyhdF3EtPj7");

    programAddress = await EllipticCurve.createProgramAddress(
      [Buffer.from("Talking", "utf8"), Buffer.from("Squirrels", "utf8")],
      programId.toBase58()
    );
    expect(programAddress).toBe("HwRVBufQ4haG5XSgpspwKtNd3PC9GM9m1196uJW36vds");

    programAddress = await EllipticCurve.createProgramAddress(
      [publicKey.toBuffer()],
      programId.toString()
    );
    expect(programAddress).toBe("GUs5qLUfsEHkcMB9T38vjr18ypEhRuNWiePW2LoK4E3K");

    const programAddress2 = await EllipticCurve.createProgramAddress(
      [Buffer.from("Talking", "utf8")],
      programId.toBase58()
    );
    expect(programAddress).not.toBe(programAddress2);

    await expect(async () => {
      EllipticCurve.createProgramAddress(
        [Buffer.alloc(32 + 1)],
        programId.toBase58()
      );
    }).rejects.toThrow();

    // https://github.com/solana-labs/solana/issues/11950
    {
      const seeds = [
        new GPublicKey(
          "H4snTKK9adiU15gP22ErfZYtro3aqR9BTMXiH3AwiUTQ"
        ).toBuffer(),
        new BN(2).toArrayLike(Buffer, "le", 8),
      ];
      const programId = new GPublicKey(
        "4ckmDgGdxQoPDLUkDT3vHgSAkzA3QRdNq5ywwY4sUSJn"
      );
      programAddress = await EllipticCurve.createProgramAddress(
        seeds,
        programId.toBase58()
      );
      expect(programAddress).toBe(
        "12rqwuEgBYiGhBrDJStCiqEtzQpTTiZbh7teNVLuYcFA"
      );
    }
  });

  test("findProgramAddress", async () => {
    const programId = new GPublicKey(
      "BPFLoader1111111111111111111111111111111111"
    );
    const [programAddress, nonce] = EllipticCurve.findProgramAddress(
      [Buffer.from("", "utf8")],
      programId.toString()
    );
    expect(programAddress).toBe(
      EllipticCurve.createProgramAddress(
        [Buffer.from("", "utf8"), Buffer.from([nonce])],
        programId.toBase58()
      )
    );
  });

  test("isOnCurve", () => {
    const onCurve = GKeypair.generate().publicKey;
    expect(EllipticCurve.isOnCurve(onCurve.toBuffer())).toBeTruthy();
    expect(EllipticCurve.isOnCurve(onCurve.toBase58())).toBeTruthy();
    // A program address, yanked from one of the above tests. This is a pretty
    // poor test vector since it was created by the same code it is testing.
    // Unfortunately, I've been unable to find a golden negative example input
    // for curve25519 point decompression :/
    const offCurve = new GPublicKey(
      "12rqwuEgBYiGhBrDJStCiqEtzQpTTiZbh7teNVLuYcFA"
    );
    expect(EllipticCurve.isOnCurve(offCurve.toBuffer())).toBeFalsy();
    expect(EllipticCurve.isOnCurve(offCurve.toBase58())).toBeFalsy();
  });
});
