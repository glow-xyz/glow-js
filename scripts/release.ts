// Publishes every package whose package.json version isn't on npm yet, then
// tags it and creates a GitHub release. Run by .github/workflows/release.yml
// after a version bump merges. Safe to re-run: published versions and existing
// tags are skipped.
//
// Usage: bun scripts/release.ts [--dry-run]

import { $ } from "bun";

// Dependency order: a package is published before the packages that use it.
const PACKAGES = [
  "solana-client",
  "glow-client",
  "glow-react",
  "wallet-standard",
];

const dryRun = process.argv.includes("--dry-run");

for (const dir of PACKAGES) {
  const cwd = `packages/${dir}`;
  const { name, version } = await Bun.file(`${cwd}/package.json`).json();
  const tag = `${dir}-v${version}`;

  const published =
    (await fetch(`https://registry.npmjs.org/${name}/${version}`)).status ===
    200;
  const tagged = (await $`git tag --list ${tag}`.text()).trim() === tag;

  if (published && tagged) {
    console.log(`${name}@${version}: already released`);
    continue;
  }
  if (dryRun) {
    console.log(
      `${name}@${version}: would ${published ? "" : "publish, "}tag ${tag}`,
    );
    continue;
  }

  if (!published) {
    console.log(`${name}@${version}: publishing`);
    // npm (not bun) publish: npm supports trusted publishing via GitHub OIDC
    await $`npm publish --access public`.cwd(cwd);
  }

  if (!tagged) {
    const previousTag = (
      await $`git tag --list ${`${dir}-v*`} --sort=-v:refname`.text()
    )
      .split("\n")
      .find((t) => t && t !== tag);

    await $`git tag ${tag}`;
    await $`git push origin ${tag}`;
    await $`gh release create ${tag} --title ${`${name} v${version}`} --generate-notes ${
      previousTag ? ["--notes-start-tag", previousTag] : []
    }`;
  }
}
