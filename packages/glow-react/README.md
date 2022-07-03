# `@glow-xyz/glow-react`

The `@glow-xyz/glow-react` gives you a React interface to hook up Glow with your dApp.

## Installing

```sh
# npm
npm install @glow-xyz/glow-react

# yarn
yarn add @glow-xyz/glow-react

# pnpm
pnpm install @glow-xyz/glow-react
```

## Usage

```tsx
// Top level app component
import { GlowSignInButton, GlowProvider } from "@glow-xyz/glow-react";
import "@glow-xyz/glow-react/dist/styles.css";

const App = ({children}) => {
  return (
    <GlowProvider>
      {children}
    </GlowProvider>
  )
}

// Component rendered under <App /> in the tree
const Home = () => {
  const { user } = useGlowContext();

  return (
    <div>
      {user ? (
        <div>Signed in as {user.address}</div>
      ) : (
        <GlowSignInButton />
      )}
    </div>
  )
}
```
