import * as beet from "@metaplex-foundation/beet";
import BN from "bn.js";
import { Solana } from "../../base-types";
import { GlowBorsh } from "../base";

/**
 * https://github.com/solana-labs/solana-program-library/blob/810c79ec32c0f169d7f5a8e1eff0f3e23aa713a0/token/program/src/state.rs#L86
 *
 * This is an SPL Token Account.
 *
 * /// The mint associated with this account
 * pub mint: Pubkey,
 * /// The owner of this account.
 * pub owner: Pubkey,
 * /// The amount of tokens this account holds.
 * pub amount: u64,
 * /// If `delegate` is `Some` then `delegated_amount` represents
 * /// the amount authorized by the delegate
 * pub delegate: COption<Pubkey>,
 * /// The account's state
 * pub state: AccountState,
 * /// If is_native.is_some, this is a native token, and the value logs the rent-exempt reserve. An
 * /// Account is required to be rent-exempt, so the value is used by the Processor to ensure that
 * /// wrapped SOL accounts do not drop below this threshold.
 * pub is_native: COption<u64>,
 * /// The amount delegated
 * pub delegated_amount: u64,
 * /// Optional authority to close the account.
 * pub close_authority: COption<Pubkey>,
 *
 * So the token program is a little weird and it stores the optional part of COption as 4 bytes
 * rather than just a binary 1 / 0.
 * Ref: https://github.com/solana-labs/solana-program-library/blob/801b4e59f85d673864188be8f551674506bcd13d/token/program/src/state.rs#L273
 */
export type TOKEN_ACCOUNT_DATA = {
  mint: Solana.Address;
  owner: Solana.Address;
  amount: Solana.TokenAmount;
  delegate_exists: number;
  delegate: Solana.Address;
  state: number;
  is_native_exists: number;
  is_native: BN;
  delegated_amount: BN;
  close_authority_exists: number;
  close_authority: Solana.Address;
};

export const TOKEN_ACCOUNT = new GlowBorsh<TOKEN_ACCOUNT_DATA>({
  fields: [
    ["mint", GlowBorsh.address],
    ["owner", GlowBorsh.address],
    ["amount", GlowBorsh.tokenAmount],
    ["delegate_exists", beet.u32],
    ["delegate", GlowBorsh.address],
    ["state", beet.u8],
    ["is_native_exists", beet.u32],
    ["is_native", beet.u64],
    ["delegated_amount", beet.u64],
    ["close_authority_exists", beet.u32],
    ["close_authority", GlowBorsh.address],
  ],
});

/**
 * https://github.com/solana-labs/solana-program-library/blob/810c79ec32c0f169d7f5a8e1eff0f3e23aa713a0/token/program/src/state.rs#L13
 */
export const SPL_MINT_ACCOUNT = new GlowBorsh<{
  mint_authority_exists: number;
  mint_authority: Solana.Address | null;
  supply: Solana.TokenAmount;
  decimals: number;
  is_initialized: boolean;
  freeze_authority_exists: number;
  freeze_authority: Solana.Address | null;
}>({
  fields: [
    ["mint_authority_exists", beet.u32],
    ["mint_authority", GlowBorsh.addressNullable],
    ["supply", GlowBorsh.tokenAmount],
    ["decimals", beet.u8],
    ["is_initialized", beet.bool],
    ["freeze_authority_exists", beet.u32],
    ["freeze_authority", GlowBorsh.addressNullable],
  ],
});
