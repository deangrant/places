# pnpm-workspace

A starter template for a **pnpm** monorepo with strict install policy, Biome formatting/linting, and GitHub Actions CI.

Use this repository as a base when you want a clean workspace scaffold instead of assembling pnpm, tooling, and supply-chain defaults from scratch.

## Requirements

- Node.js `>=22`
- [pnpm](https://pnpm.io/) `11.8.0` (pinned via `packageManager` in `package.json`)

Enable Corepack so the pinned pnpm version is used:

```bash
corepack enable
```

## Getting started

1. Create a new repository from this template (or clone it).
2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Add workspace package locations in `pnpm-workspace.yaml` under `packages`, for example:

   ```yaml
   packages:
     - "apps/*"
     - "packages/*"
   ```

4. Create packages (each with its own `package.json`) under those directories.
5. Rename the root `name` in `package.json` to match your project.

## Scripts

| Script | Description |
| --- | --- |
| `pnpm check` | Run Biome check (format + lint) |
| `pnpm check:fix` | Apply Biome check fixes |
| `pnpm format` | Format with Biome |
| `pnpm format:check` | Check formatting only |
| `pnpm lint` | Lint with Biome |
| `pnpm lint:fix` | Apply Biome lint fixes |
| `pnpm lint:lockfile` | Verify the lockfile with `pnpm install --frozen-lockfile` |

## What’s included

- **pnpm workspace** — root `pnpm-workspace.yaml` with catalog, overrides, and install policy hooks ready to fill in
- **Biome** — lint and format via `biome.json`, plus VS Code defaults under `.vscode/`
- **React Doctor** — available as a root dev dependency and run in CI
- **GitHub Actions** — Lint workflow (Biome CI, lockfile validation, React Doctor) and Dependabot update config
- **Ignore rules** — common build, env, log, and editor artifacts in `.gitignore`

## Install policy

This template turns on several pnpm safeguards so installs fail closed by default:

| Setting | Effect |
| --- | --- |
| `engineStrict` | Reject Node/pnpm versions outside `package.json` `engines` |
| `strictDepBuilds` | Only packages listed in `allowBuilds` may run install/build scripts |
| `saveExact` | Save exact dependency versions |
| `minimumReleaseAge` | Delay brand-new releases (21 days) before they can be installed |
| `blockExoticSubdeps` | Block transitive deps from git/URL sources |
| `trustPolicy: no-downgrade` | Block installs when trust evidence would weaken vs an earlier release |

When a dependency needs a build script or a trust-policy exception, add it explicitly to `allowBuilds` or `trustPolicyExclude` in `pnpm-workspace.yaml` after reviewing it.

## License

MIT — see [LICENSE](./LICENSE).
