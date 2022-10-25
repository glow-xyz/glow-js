import type { GlowAdapter } from "@glow-xyz/glow-client";
import { DEPRECATED_registerWallet } from "./register.js";
import { GlowWallet } from "./wallet.js";

export function initialize(glow: GlowAdapter): void {
  DEPRECATED_registerWallet(new GlowWallet(glow));
}
