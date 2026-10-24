# Glow JS

Open-source packages for integrating the Glow Solana wallet. Everything here is
public — never commit secrets, internal URLs, or private config.

## Packages

- `packages/solana-client` — Solana primitives (`GPublicKey`, `GTransaction`, RPC client). No dependency on other packages here.
- `packages/glow-client` — `GlowClient` for talking to the Glow extension. Depends on `solana-client`.
- `packages/glow-react` — React `<GlowProvider />` on top of `glow-client`.
- `packages/wallet-standard` — Wallet Standard adapter. Its ESM build is consumed directly, so relative imports need `.js` extensions.
- `packages/example-next-js` — Next.js example, deployed by Vercel on every PR.

## Commands

Use Bun (version in `.bun-version`), not npm/pnpm/node.

```sh
bun install
bun run build   # build all packages in dependency order
bun run tsc     # typecheck
bun run test    # bun test
bun run lint    # oxlint (.oxlintrc.json)
bun fmt         # formatter (config in bunfig.toml)
```

CI runs `bun fmt --check`, lint, build, tsc, and test.

## Conventions

- Tests live in `src/**/__tests__/*.test.ts` and import from `bun:test`. They are excluded from the build and from published files.
- Packages ship CJS (and ESM for `solana-client`/`wallet-standard`); don't change module output without a major version bump.
- Avoid adding runtime dependencies — these are libraries other people install.
- Each package is released separately with `bun run release` (release-it) from its directory.
