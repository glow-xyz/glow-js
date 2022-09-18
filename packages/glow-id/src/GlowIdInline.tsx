import React from "react";
import { useGlowId } from "./useGlowId";

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
  const glowId = useGlowId(address);

  return (
    <span>{glowId ? `${glowId.handle}.glow` : abbreviateAddress(address)}</span>
  );
};
