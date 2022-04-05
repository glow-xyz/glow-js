import type { Transaction } from "@solana/web3.js";
import { Buffer } from "buffer";
import EventEmitter from "eventemitter3";
import { Address, Network, PhantomAdapter, SolanaWindow } from "./window-types";

export class GlowClient extends EventEmitter {
  private _address: Address | null;
  private _wallet: PhantomAdapter | null;

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
      if (_window.glowSolana) {
        clearInterval(glowLoadedInterval);

        this._wallet = _window.glowSolana;
        this.registerEventHandlers();

        const { publicKey } = await this._wallet.connect({
          onlyIfTrusted: true,
        });

        if (publicKey) {
          this._address = publicKey.toBase58();
        }
        this.emitUpdate("loaded");
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

  async connect(): Promise<{ address: Address }> {
    // TODO: check if glowSolana exists otherwise we can throw
    if (!this._wallet) {
      throw new Error("Not loaded.");
    }

    const { publicKey } = await this._wallet.connect();
    if (!publicKey) {
      throw new Error("Not loaded.");
    }

    const address = publicKey.toBase58();
    this._address = address;

    return { address };
  }
  // TODO: we will need to listen to some events

  async disconnect(): Promise<void> {
    await this._wallet?.disconnect();
    this._address = null;
  }

  async signTransaction({
    transaction,
    network,
  }: {
    transaction: Transaction;
    network: Network;
  }): Promise<{ transaction: Transaction }> {
    if (!this._wallet) {
      throw new Error("Not connected.");
    }

    const wallet = this._wallet;

    const signedTransaction = await wallet.signTransaction(
      transaction,
      network
    );
    return { transaction: signedTransaction };
  }

  async signAllTransactions({
    transactions,
    network,
  }: {
    transactions: Transaction[];
    network: Network;
  }): Promise<{
    transactions: Transaction[];
  }> {
    if (!this._wallet) {
      throw new Error("Not connected.");
    }

    const signedTransactions = await this._wallet.signAllTransactions(
      transactions,
      network
    );
    return { transactions: signedTransactions };
  }

  // TODO: take in different types of messages
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
  ): Promise<{ signature_base64: string }> {
    if (!this._wallet) {
      throw new Error("Not connected.");
    }

    let messageUint8: Uint8Array;
    if ("messageHex" in params) {
      messageUint8 = new Uint8Array(Buffer.from(params.messageHex, "hex"));
    } else if ("messageBase64" in params) {
      messageUint8 = new Uint8Array(
        Buffer.from(params.messageBase64, "base64")
      );
    } else if ("messageBuffer" in params) {
      messageUint8 = new Uint8Array(params.messageBuffer);
    } else if ("messageUint8" in params) {
      messageUint8 = params.messageUint8;
    } else {
      throw new Error("No message passed in.");
    }

    const { signature } = await this._wallet.signMessage(messageUint8);
    if (!signature) {
      throw new Error("No signature");
    }

    const signatureBuffer = Buffer.from(signature);
    return {
      signature_base64: signatureBuffer.toString("base64"),
    };
  }
}
