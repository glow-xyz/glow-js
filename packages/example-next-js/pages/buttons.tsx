import "bootstrap/dist/css/bootstrap.css";
import type { NextPage } from "next";
import { GlowSignInButton } from "../components/GlowSignInButton";
import styles from "../styles/Buttons.module.scss";

const ButtonsExample: NextPage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.buttons}>
        <h2>Black</h2>
        <h2>Purple</h2>
        <h2>White Outline</h2>
        <h2>White Naked</h2>

        <h3>Large Squared</h3>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="lg" shape="squared" variant="black" />
        </div>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="lg" shape="squared" variant="purple" />
        </div>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="lg" shape="squared" variant="white-outline" />
        </div>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="lg" shape="squared" variant="white-naked" />
        </div>

        <h3>Medium Squared</h3>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="md" shape="squared" variant="black" />
        </div>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="md" shape="squared" variant="purple" />
        </div>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="md" shape="squared" variant="white-outline" />
        </div>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="md" shape="squared" variant="white-naked" />
        </div>

        <h3>Small Squared</h3>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="sm" shape="squared" variant="black" />
        </div>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="sm" shape="squared" variant="purple" />
        </div>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="sm" shape="squared" variant="white-outline" />
        </div>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="sm" shape="squared" variant="white-naked" />
        </div>

        <h3>Large Rounded</h3>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="lg" shape="rounded" variant="black" />
        </div>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="lg" shape="rounded" variant="purple" />
        </div>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="lg" shape="rounded" variant="white-outline" />
        </div>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="lg" shape="rounded" variant="white-naked" />
        </div>

        <h3>Medium Rounded</h3>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="md" shape="rounded" variant="black" />
        </div>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="md" shape="rounded" variant="purple" />
        </div>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="md" shape="rounded" variant="white-outline" />
        </div>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="md" shape="rounded" variant="white-naked" />
        </div>

        <h3>Small Rounded</h3>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="sm" shape="rounded" variant="black" />
        </div>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="sm" shape="rounded" variant="purple" />
        </div>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="sm" shape="rounded" variant="white-outline" />
        </div>

        <div className={styles["button-group"]}>
          <GlowSignInButton size="sm" shape="rounded" variant="white-naked" />
        </div>
      </div>
    </div>
  );
};

export default ButtonsExample;
