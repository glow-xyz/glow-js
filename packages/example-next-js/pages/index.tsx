import { Address, GlowClient } from "@glow-app/glow-client";
import { useGlowContext } from "@glow-app/glow-react";
import "bootstrap/dist/css/bootstrap.css";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";

const glowClient = new GlowClient();
type User = { address: Address };

const Home: NextPage = () => {
  const { user, signIn, signOut, canSignIn } = useGlowContext();

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
          {user ? (
            <div>Signed in as {user.address}</div>
          ) : (
            <div>Not signed in.</div>
          )}
        </p>

        <div className={styles.grid}>
          {user ? (
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                signOut();
              }}
            >
              Sign Out
            </button>
          ) : (
            <button
              className="btn btn-primary"
              type="button"
              disabled={!canSignIn}
              onClick={() => {
                signIn();
              }}
            >
              Sign In
            </button>
          )}
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
