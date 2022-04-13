import { GlowClient } from "@glow-app/glow-client";
import { useOnMount } from "@hooks/useOnMount";
import { usePolling } from "@hooks/usePolling";
import React, { createContext, useCallback, useContext, useState } from "react";
import { GlowAdapter, PhantomAdapter, Address } from "@glow-app/glow-client";

type GlowUser = { address: Address };

type GlowContext = {
  user: GlowUser | null;

  signIn: () => Promise<void>;
  signOut: () => Promise<void>;

  canSignIn: boolean;

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
  const [canSignIn, setCanSignIn] = useState(false);

  usePolling(() => {
    if (window.glow || window.solana) {
      setCanSignIn(true);
    }
  }, 250);

  useOnMount(() => {
    glowClient.on("update", () => {
      setUser(glowClient.address ? { address: glowClient.address } : null);
    });
  });

  const signIn = useCallback(async () => {
    try {
      const { address } = await glowClient.connect();
      setUser({ address });
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
        canSignIn,
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
