import React from "react";
import useSWR from "swr";

namespace GlowIdTypes {
  export type BasicInfo = {
    handle: string;
    resolved: string; // TODO: do I want to import solana-client for types?
    twitter: string | null;
    joined_at: string;
    name: string | null;
    image: string | null;
    bio: string | null;
  };
}

const glowMap = new Map<string, GlowIdTypes.BasicInfo>();

const baseUrl = "http://localhost:5498";

const glowIdFetcher = async (
  address: string | null | undefined
): Promise<GlowIdTypes.BasicInfo | null> => {
  if (!address) {
    return null;
  }

  const resp = await fetch(
    baseUrl +
      "/glow-id/resolve?" +
      new URLSearchParams({
        wallet: address,
      })
  );

  const data = await resp.json();
  return data.info;
};

const abbreviateAddress = (address: string | null | undefined) => {
  if (!address) {
    return "Missing Address";
  }

  return `${address.slice(0, 5)}…${address.slice(-4)}`;
};

export const GlowIdInline = ({
  address,
}: {
  address: string | null | undefined;
}) => {
  const { data } = useSWR(address, glowIdFetcher);

  return (
    <span>{data ? `${data.handle}.glow` : abbreviateAddress(address)}</span>
  );
};
