# Places doctor

Run React Doctor on the web app and triage findings. Fix true positives only if the user asks, unless they already requested a fix.

## Steps

From the repository root:

```bash
pnpm doctor:full
```

For a narrower changed-scope scan:

```bash
pnpm doctor:changed
```

## Triage

Follow [`.agents/skills/react-doctor/SKILL.md`](../skills/react-doctor/SKILL.md):

1. Treat each diagnostic as a hypothesis; read the cited file.
2. Classify true positive / false positive / needs-human-review with confidence.
3. Prefer structural fixes (split giant components, etc.) over suppressions.
4. Re-run `pnpm doctor:full` after fixes.
5. Run relevant Vitest for touched UI.

## Output

Summarize score/warnings, file paths, and triage verdict per issue. Do not commit.
