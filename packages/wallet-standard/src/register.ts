import type { GlowAdapter } from "@glow-xyz/glow-client";
import { setupWindowNavigatorWallets } from "./setup.js";
import { GlowWallet } from "./wallet.js";

export function register(glow: GlowAdapter): void {
  try {
    setupWindowNavigatorWallets(({ register }) =>
      register(new GlowWallet(glow))
    );
  } catch (error) {
    console.error(error);
  }
}
