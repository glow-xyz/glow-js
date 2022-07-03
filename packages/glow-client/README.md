# `@glow-xyz/glow-client`

The `@glow-xyz/glow-client` gives you a client to interact with the Glow Desktop and Safari Extension from your website or
dApp.

If you're building a website that interacts with Solana, you can use the `@glow-xyz/glow-client` to ask the user to:

- connect their Solana wallet
- sign messages
- approve transactions


## Installing

```sh
# npm
npm install @glow-xyz/glow-client

# yarn
yarn add @glow-xyz/glow-client

# pnpm
pnpm install @glow-xyz/glow-client
```

## Usage

```ts
import { GlowClient } from "@glow-xyz/glow-client";

const glowClient = new GlowClient();

glowClient.on("update", () => {
  console.log("Current address", glowClient.address);
});

// Connect
const { address } = await glowClient.connect();

// Sign Message
const { signature_base64: sig1 } = await glowClient.signMessage({
  message_utf8: 'Hi this is a message!'
});
const { signature_base64: sig2 } = await glowClient.signMessage({
  message_hex: 'deadbeef' // You can specify different message formats
});

// Sign Transaction
// Transaction from @solana/web3.js
const transaction = Transaction.from(Buffer.from(str, 'base64'));
await glowClient.signTransaction({
  transaction,
  network: Solana.Network.Devnet,
});
```

## Differences with Existing Wallets

**Setting the Network**

Phantom and other wallets default to the Solana network chosen in the wallet's popup. This is a security vulnerability because it leads to simulations failing.

With Glow, we let the dApp specify which `network` the transaction is for. So when you call `glowClient.signTransaction` you also pass in the `network` parameter.

**Localnet**

Unfortunately, we aren't able to support `Localnet` at this time because we make RPC calls from our backend, not the client. Our backend cannot connect to your local machine.

## Alternatives

The most popular project in the ecosystem is the [`@solana-labs/wallet-adapter`](https://github.com/solana-labs/wallet-adapter) which is great if you want to support every wallet in the ecosystem.

But if you want to just support Glow and have a lighter, easier API to work with, this is a useful library for you!

We also plan on adding more fun methods to the Glow JS SDK that other wallets probably won't support. So those methods will be found here and not in the `@solana-labs/wallet-adapter`.
