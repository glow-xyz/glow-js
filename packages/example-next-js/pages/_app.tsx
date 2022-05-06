import "@glow-app/glow-react/dist/styles.css";
import { GlowProvider } from "@glow-app/glow-react";
import type { AppProps } from "next/app";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <GlowProvider>
      <Component {...pageProps} />
    </GlowProvider>
  );
}

export default MyApp;
