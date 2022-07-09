import { GlowBorsh } from "../base";

describe("GlowBorshTypes", () => {
  test("GlowBorsh with discriminator", () => {
    const format = new GlowBorsh<{ ix: null }>({
      fields: [["ix", GlowBorsh.ixDiscriminator({ ix_name: "hi" })]],
    });
    const buffer = format.toBuffer({ ix: null });
    expect(buffer.toString("hex")).toEqual("798e81a33796e832");
  });
});
