import React from "react";
import styled from "styled-components";
import { Tooltip } from "./Tooltip";
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

  if (!glowId) {
    return (
      <div style={{ display: "inline-flex" }}>{abbreviateAddress(address)}</div>
    );
  }

  return (
    <Tooltip tooltip={<div>{glowId.name}</div>}>
      <Wrapper>
        {glowId.image && (
          <AvatarImage
            src={glowId.image}
            alt={`A photo of ${glowId.handle}.glow.`}
          />
        )}

        <span>{glowId.handle}.glow</span>
      </Wrapper>
    </Tooltip>
  );
};

const Wrapper = styled.div`
  cursor: pointer;
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;
`;

const AvatarImage = styled.img`
  line-height: 1;
  width: 1em;
  height: 1em;
  border-radius: 100%;
  align-self: center;
`;
