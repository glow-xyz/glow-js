import * as beet from "@glow-xyz/beet";
import BN from "bn.js";
import { Buffer } from "buffer";
import { Solana } from "../base-types";
import { FixableGlowBorsh, GlowBorsh } from "../borsh";
import { GPublicKey } from "../GPublicKey";

/**
 * The lookup table stores some information about how it was configured.
 *
 * Then it stores addresses at an offset. It does not store the number of addresses,
 * so when getting addresses, we just iterate over the rest of the data.
 *
 * https://github.com/luma-team/solana/blob/b05c7d91ed4e0279ec622584edb54c9ef8547ad1/programs/address-lookup-table/src/state.rs#L40
 */
const LookupTableMetaFormat = new FixableGlowBorsh<{
  typeIndex: number;
  deactivationSlot: BN;
  lastExtendedSlot: BN;
  lastExtendedStartIndex: number;
  authority: Solana.Address | null;
}>({
  fields: [
    ["typeIndex", beet.u32],
    ["deactivationSlot", GlowBorsh.u64],
    ["lastExtendedSlot", GlowBorsh.u64],
    ["lastExtendedStartIndex", beet.u8],
    ["authority", beet.coption(GlowBorsh.address)],
  ],
});

const LookupTableAddressesOffset = 56;

type LookupTable = {
  typeIndex: number;
  deactivationSlot: BN;
  lastExtendedSlot: BN;
  lastExtendedStartIndex: number;
  authority: Solana.Address | null;
  addresses: Solana.Address[];
};

export const parseLookupTable = ({
  buffer,
}: {
  buffer: Buffer;
}): LookupTable | null => {
  const parsed = LookupTableMetaFormat.parse({ buffer });
  if (!parsed) {
    return null;
  }

  const addressBytes = Array.from(buffer).slice(LookupTableAddressesOffset);
  if (addressBytes.length % GPublicKey.byteLength !== 0) {
    console.error(
      `Invalid account size. The address section ${addressBytes.length} is not a multiple of ${GPublicKey.byteLength}.`
    );
    return null;
  }

  const addresses: Solana.Address[] = [];

  let idx = LookupTableAddressesOffset;
  while (idx < buffer.length) {
    addresses.push(
      new GPublicKey(buffer.slice(idx, idx + GPublicKey.byteLength)).toBase58()
    );
    idx += GPublicKey.byteLength;
  }

  return {
    ...parsed,
    addresses,
  };
};
