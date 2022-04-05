#!/usr/bin/env node -r esbuild-register

import { BuildOptions } from "esbuild";
import { Generator } from "npm-dts";
import * as esbuild from "esbuild";
import packageJson from "../package.json";

const production = process.env.NODE_ENV === "production";

const commonOptions: BuildOptions = {
  bundle: true,
  minify: production,
  tsconfig: "tsconfig.json",
  target: "es2020",
  define: {
    global: "globalThis",
  },
  entryPoints: ["src/index.ts"],
  external: [
    ...Object.keys(packageJson.dependencies),
    ...Object.keys(packageJson.devDependencies),
  ],
};

const main = async () => {
  // TODO: build commonjs + esm versions
  await esbuild.build({
    ...commonOptions,
    outfile: "dist/index.js",
  });
  await esbuild.build({
    ...commonOptions,
    outfile: "dist/index.esm.js",
    format: "esm",
  });

  await new Generator({
    entry: "./src/index.ts",
    output: "./dist/index.d.ts",
  }).generate();
};

main();
