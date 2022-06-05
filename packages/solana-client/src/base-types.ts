import z from "zod";

export namespace Solana {
  export const AddressRegex = /^[5KL1-9A-HJ-NP-Za-km-z]{32,44}$/;
  export const AddressZ = z.string().regex(AddressRegex);
  export type Address = z.infer<typeof AddressZ>;

  export const SolAmountZ = z.object({ lamports: z.string() });
  export type SolAmount = z.infer<typeof SolAmountZ>;

  export const TokenAmountZ = z.object({ units: z.string() });
  export type TokenAmount = z.infer<typeof TokenAmountZ>;
}

export type Base58 = string;
export type Base64 = string;
export type Hex = string;
