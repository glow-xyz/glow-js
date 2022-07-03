import { GlowClient } from "@glow-xyz/glow-client";
import { Solana } from "@glow-xyz/solana-client";
import { useOnMount } from "./hooks/useOnMount";
import { usePolling } from "./hooks/usePolling";
import React, { createContext, useCallback, useContext, useState } from "react";
import { GlowAdapter, PhantomAdapter, Address } from "@glow-xyz/glow-client";

type GlowUser = { address: Address };

type GlowContext = {
  user: GlowUser | null;

  signIn: () => Promise<{
    wallet: Solana.Address;
    signatureBase64: string;
    message: string;
  }>;
  signOut: () => Promise<void>;

  glowDetected: boolean;

  client: GlowClient;
};

export const GlowContext = createContext<GlowContext | null>(null);

export const glowClient = new GlowClient();

declare global {
  interface Window {
    glow?: GlowAdapter;
    solana?: PhantomAdapter;
    glowSolana?: PhantomAdapter;
  }
}

export const GlowProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<GlowUser | null>(null);
  const [glowDetected, setGlowDetected] = useState(false);

  usePolling(
    () => {
      if (window.glow || window.solana) {
        setGlowDetected(true);
      }
    },
    glowDetected ? null : 250,
    { runOnMount: true }
  );

  useOnMount(() => {
    glowClient.on("loaded", () => {
      setGlowDetected(true);
    });
    glowClient.on("update", () => {
      setUser(glowClient.address ? { address: glowClient.address } : null);
      setGlowDetected(true);
    });
  });

  const signIn = useCallback(async () => {
    try {
      const { address, signature, message } = await glowClient.signIn();
      setUser({ address });
      return { wallet: address, signatureBase64: signature, message };
    } catch (e) {
      console.error("Connecting Glow failed.");
      throw e;
    }
  }, [setUser]);

  const signOut = useCallback(async () => {
    await window.glowSolana!.disconnect();
    setUser(null);
  }, [setUser]);

  return (
    <GlowContext.Provider
      value={{
        user,
        glowDetected,
        signIn,
        signOut,
        client: glowClient,
      }}
    >
      {children}
    </GlowContext.Provider>
  );
};

export const useGlowContext = (): GlowContext => {
  const value = useContext(GlowContext);

  if (!value) {
    return {} as GlowContext;
  }

  return value as GlowContext;
};
