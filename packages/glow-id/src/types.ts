export namespace GlowIdTypes {
  export type BasicInfo = {
    handle: string;
    resolved: string; // TODO: do I want to import solana-client for types?
    twitter: string | null;
    joined_at: string;
    name: string | null;
    image: string | null;
    bio: string | null;
  };

  export type Dict = Record<string, BasicInfo>;
}
