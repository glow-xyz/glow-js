# `@glow-app/glow-react`

The `@glow-app/glow-react` gives you a React interface to hook up Glow with your dApp.

## Installing

```sh
# npm
npm install @glow-app/glow-react

# yarn
yarn add @glow-app/glow-react

# pnpm
pnpm install @glow-app/glow-react
```

## Usage

```tsx
// Top level app component
import { GlowProvider } from "@glow-app/glow-react";

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
        <div>Not signed in.</div>
      )}
    </div>
  )
}
```
