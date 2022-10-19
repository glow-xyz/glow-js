import type { GlowAdapter } from "@glow-xyz/glow-client";
import type { WalletsWindow } from "@wallet-standard/base";
import { GlowWallet } from "./wallet.js";

declare const window: WalletsWindow;

export function register(glow: GlowAdapter): void {
  try {
    (window.navigator.wallets ||= []).push(({ register }) =>
      register(new GlowWallet(glow))
    );
  } catch (error) {
    console.error(error);
  }
}
