import { GlowIdInline } from "@glow-xyz/glow-id/src";

export default function GlowIdPage() {
  return (
    <div className={"container"}>
      <div>Glow ID Examples</div>

      <div>
        <GlowIdInline address={"vicFprL4kcqWTykrdz6icjv2re4CbM5iq3aHtoJmxrh"} />{" "}
        sent to{" "}
        <GlowIdInline
          address={"CXk5NCtYva7h4BcGXg5BDBDtZDwgBuWZcwmWt5ReY1yA"}
        />
      </div>

      <style jsx>{`
        .container {
          padding: 2rem;
          max-width: 400px;
        }
      `}</style>
    </div>
  );
}
