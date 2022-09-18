import { GlowIdInline } from "@glow-xyz/glow-id";
import React from "react";
import styled from "styled-components";

export default function GlowIdPage() {
  return (
    <Container>
      <Header>Glow ID Examples</Header>

      <div>
        <GlowIdInline address={"vicFprL4kcqWTykrdz6icjv2re4CbM5iq3aHtoJmxrh"} />{" "}
        sent to{" "}
        <GlowIdInline
          address={"CXk5NCtYva7h4BcGXg5BDBDtZDwgBuWZcwmWt5ReY1yA"}
        />
      </div>

      <style jsx>{`
        .container {
        }
      `}</style>
    </Container>
  );
}

const Container = styled.div`
  padding: 2rem;
  max-width: 400px;
  font-family: "SF Pro", -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
    Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;

  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Header = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
`;
