# Places verify

Run the local CI checklist for this monorepo. Report pass/fail for each step. Fix failures only if the user asks.

## Steps

From the repository root, run what matches the change set:

```bash
pnpm --filter places-core test
pnpm --filter places-core build
```

If `apps/api` changed:

```bash
pnpm --filter api test
```

If `apps/web` changed:

```bash
pnpm --filter web exec vitest run <touched-test-paths>
# or full web suite:
pnpm --filter web test
```

Always for a merge-ready claim:

```bash
pnpm check
pnpm build
```

After React UI structure changes:

```bash
pnpm doctor:full
```

Optionally scope Biome to a path:

```bash
pnpm exec biome ci <path>
```

## Output

Summarize each command as pass or fail with the first failing error line if any. Do not commit.
