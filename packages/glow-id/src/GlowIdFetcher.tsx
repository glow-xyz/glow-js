import { GlowIdTypes } from "./types";

const baseUrl = "http://localhost:5498";

/**
 * This allows us to batch requests to resolve Glow IDs even if many Glow IDs are
 * loaded onto the page.
 */
class _GlowIdFetcher extends EventTarget {
  private addresses: Set<string> = new Set();
  private glowIdMap: Map<string, GlowIdTypes.BasicInfo | null> = new Map();
  private fetching: boolean = false;
  private fetchQueued: boolean = false;

  constructor() {
    super();
  }

  public get(address: string | null | undefined): GlowIdTypes.BasicInfo | null {
    if (!address) {
      return null;
    }
    return this.glowIdMap.get(address) || null;
  }

  public refresh() {
    this.queueFetch();
  }

  private async doFetch() {
    if (this.fetching) {
      return;
    }

    this.fetching = true;
    this.fetchQueued = false;

    try {
      const resp = await fetch(baseUrl + "/glow-id/resolve-multiple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallets: Array.from(this.addresses) }),
      });

      const data: { glow_id_dict: GlowIdTypes.Dict } = await resp.json();

      for (const [address, info] of Object.entries(data.glow_id_dict)) {
        this.glowIdMap.set(address, info);
      }

      this.dispatchEvent(new Event("new"));
    } finally {
      this.fetching = false;

      if (this.fetchQueued) {
        this.doFetch();
      }
    }
  }

  private queueFetch() {
    if (!this.fetching) {
      // We want to do this outside of the event loop to give ourselves a better
      // chance of batching Glow ID requests.
      setTimeout(() => {
        this.doFetch();
      }, 1);
      return;
    }

    this.fetchQueued = true;
  }

  public add(address: string | null | undefined) {
    if (!address || this.addresses.has(address)) {
      return;
    }

    this.addresses.add(address);
    this.queueFetch();
  }
}

export const GlowIdFetcher = new _GlowIdFetcher();
