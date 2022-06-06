import { Buffer } from "buffer";
import EventEmitter from "eventemitter3";
import { verifySignIn } from "./utils";
import { Address, GlowAdapter, Network, SolanaWindow } from "./window-types";

export class GlowClient extends EventEmitter {
  public _address: Address | null;
  public _wallet: GlowAdapter | null;

  public eventNames() {
    return ["update"] as any;
  }

  constructor() {
    super();

    this._address = null;
    this._wallet = null;

    this.registerLoadedHandler();
  }

  private registerEventHandlers() {
    if (!this._wallet) {
      return;
    }

    this._wallet.on("disconnect", () => {
      this._address = null;
      this.emitUpdate("disconnect");
    });

    // TODO: is the emitted key interesting?
    this._wallet.on("accountChanged", async () => {
      try {
        const connectResp = await this._wallet?.connect({
          onlyIfTrusted: true,
        });

        if (connectResp?.publicKey) {
          this._address = connectResp.publicKey.toBase58();
        } else {
          this._address = null;
        }
      } catch {
        this._address = null;
      } finally {
        this.emitUpdate("accountChanged");
      }
    });
  }

  private emitUpdate(reason: string) {
    // TODO: think about how we should define event
    this.emit("update");
  }

  private registerLoadedHandler() {
    if (typeof window === "undefined") {
      return;
    }

    const onGlowLoaded = async () => {
      const _window = window as unknown as SolanaWindow;
      if (_window.glow) {
        clearInterval(glowLoadedInterval);

        this._wallet = _window.glow;
        this.registerEventHandlers();

        try {
          const { address, name, avatarUrl } = await this._wallet.connect({
            onlyIfTrusted: true,
          });
          console.log({ name, avatarUrl });

          this._address = address;
        } catch {
          // We ignore this error since it's likely that the wallet isn't connected yet and isn't
          // worth throwing a runtime error.
        } finally {
          this.emitUpdate("loaded");
        }
      }
    };

    // Poll for the window.glowSolana to be set since the extension loads
    // after the webpage loads.
    const glowLoadedInterval = setInterval(onGlowLoaded, 250);

    window.addEventListener("message", (event) => {
      if (event.data.__glow_loaded) {
        onGlowLoaded();
      }
    });
  }

  get address(): Address | null {
    return this._address;
  }

  async signIn(): Promise<{
    address: Address;
    name: string;
    avatarUrl: string;
    message: string;
    signature: string;
  }> {
    if (!this._wallet) {
      throw new Error("Not loaded.");
    }

    const { address, message, signatureBase64, name, avatarUrl } =
      await this._wallet.signIn();

    this._address = address;

    verifySignIn({
      message,
      expectedAddress: address,
      expectedDomain: window.location.hostname,
      signature: signatureBase64,
    });

    return { address, name, avatarUrl, signature: signatureBase64, message };
  }

  async connect(): Promise<{ address: Address }> {
    console.log("cponnecting");
    if (!this._wallet) {
      throw new Error("Not loaded.");
    }

    const { address } = await this._wallet.connect();
    this._address = address;

    return { address };
  }

  async disconnect(): Promise<void> {
    await this._wallet?.disconnect();
    this._address = null;
  }

  async signTransaction({
    transactionBase64,
    network,
  }: {
    transactionBase64: string;
    network: Network;
  }): Promise<{ signedTransactionBase64: string }> {
    if (!this._wallet) {
      throw new Error("Not connected.");
    }

    const wallet = this._wallet;

    const { signedTransactionBase64 } = await wallet.signTransaction({
      transactionBase64,
      network,
    });
    return { signedTransactionBase64 };
  }

  async signAllTransactions({
    transactionsBase64,
    network,
  }: {
    transactionsBase64: string[];
    network: Network;
  }): Promise<{
    signedTransactionsBase64: string[];
  }> {
    if (!this._wallet) {
      throw new Error("Not connected.");
    }

    const { signedTransactionsBase64 } = await this._wallet.signAllTransactions(
      {
        transactionsBase64,
        network,
      }
    );
    return { signedTransactionsBase64 };
  }

  async signMessage(
    params:
      | {
          messageHex: string;
        }
      | {
          messageBase64: string;
        }
      | {
          messageUint8: Uint8Array;
        }
      | {
          messageBuffer: Buffer;
        }
  ): Promise<{ signatureBase64: string }> {
    if (!this._wallet) {
      throw new Error("Not connected.");
    }

    let messageBase64: string;
    if ("messageHex" in params) {
      messageBase64 = Buffer.from(params.messageHex, "hex").toString("base64");
    } else if ("messageBase64" in params) {
      messageBase64 = params.messageBase64;
    } else if ("messageBuffer" in params) {
      messageBase64 = Buffer.from(params.messageBuffer).toString("base64");
    } else if ("messageUint8" in params) {
      messageBase64 = Buffer.from(params.messageUint8).toString("base64");
    } else {
      throw new Error("No message passed in.");
    }

    const { signedMessageBase64 } = await this._wallet.signMessage({
      messageBase64,
    });

    return {
      signatureBase64: signedMessageBase64,
    };
  }
}
