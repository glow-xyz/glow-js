import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import {
  GlowClient,
  Address,
  GlowAdapter,
  PhantomAdapter,
} from "@glow-app/glow-client";
import { useState } from "react";
import styles from "../styles/Home.module.css";
import "bootstrap/dist/css/bootstrap.css";

const glowClient = new GlowClient();
type User = { address: Address };


const Home: NextPage = () => {
  const [user, setUser] = useState<User | null>(null);
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
    await callWithToast(
      async () => {
        const { address } = await glowClient.connect();
        setUser({ address });
      },
      {
        loading: "Signing in...",
        success: "Signed in with Glow.",
        error: "Error signing in with Glow.",
      }
    );
  }, [setUser]);

  const signOut = useCallback(async () => {
    await window.glow!.signOut();
    setUser(null);
  }, [setUser]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Glow SDK Example</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://glow.app">Glow</a>
        </h1>

        <p className={styles.description}>
          Get started by editing{" "}
          <code className={styles.code}>pages/index.tsx</code>
        </p>

        <div className={styles.grid}>
          <button className="btn btn-primary" type="button" onClick={() => {}}>
            Button
          </button>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{" "}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  );
};

export default Home;
