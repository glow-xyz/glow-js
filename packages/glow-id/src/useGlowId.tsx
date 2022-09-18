import { useEffect, useState } from "react";
import { GlowIdFetcher } from "./GlowIdFetcher";
import { GlowIdTypes } from "./types";

export const useGlowId = (
  address: string | null | undefined
): GlowIdTypes.BasicInfo | null => {
  const [info, setInfo] = useState<GlowIdTypes.BasicInfo | null>(() =>
    GlowIdFetcher.get(address)
  );

  useEffect(() => {
    GlowIdFetcher.add(address);
  }, [address]);

  useEffect(() => {
    const handleEvent = () => {
      setInfo(GlowIdFetcher.get(address));
    };

    GlowIdFetcher.addEventListener("new", handleEvent);
    return () => {
      GlowIdFetcher.removeEventListener("new", handleEvent);
    };
  }, [setInfo]);

  return info;
};
