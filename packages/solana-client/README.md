# `@glow-xyz/solana-client`

The `@glow-xyz/solana-client` gives you a client to interact with the [Solana JSON RPC API](https://docs.solana.com/developing/clients/jsonrpc-api).

This is a replacement for the [`Connection` object](https://solana-labs.github.io/solana-web3.js/classes/Connection.html) in the `@solana/web3.js` library.

There are a few differences between this client and `@solana/web3.js`:

- the types are a bit easier to use
- the requests are less opinionated
- coming soon
  - we can add middleware to track performance / handle errors 

## Installing

```sh
# npm
npm install @glow-xyz/solana-client

# yarn
yarn add @glow-xyz/solana-client

# pnpm
pnpm install @glow-xyz/solana-client
```
