2022-04-05 — This is still in testing — reach out to victor@glow.app if you have comments / questions / suggestions

# @glow-app/js-sdk

The `@glow-app/js-sdk` gives you a client to interact with the Glow Desktop and Safari Extension from your website or
dApp.

If you're building a website that interacts with Solana, you can use the `@glow-app/js-sdk` to ask the user to:

- connect their Solana wallet
- sign messages
- approve transactions

## Installing

```sh
# npm
npm install @glow-app/js-sdk

# yarn
yarn add @glow-app/js-sdk

# pnpm
pnpm install @glow-app/js-sdk
```

## Usage

```ts
import { GlowClient } from "@glow-app/js-sdk";

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
const transaction = Transaction.from(...);
await glowClient.signTransaction({
  transaction,
  network: Solana.Network.Devnet,
});
```

## Alternatives

The most popular project in the ecosystem is the [`@solana-labs/wallet-adapter`](https://github.com/solana-labs/wallet-adapter) which is great if you want to support every wallet in the ecosystem. 

But if you want to just support Glow and have a lighter, easier API to work with, this is a useful library for you!

We also plan on adding more fun methods to the Glow JS SDK that other wallets probably won't support. So those methods will be found here and not in the `@solana-labs/wallet-adapter`.


