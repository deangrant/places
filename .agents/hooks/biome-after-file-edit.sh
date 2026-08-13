#!/usr/bin/env sh
# afterFileEdit: Agent sends JSON on stdin with file_path (absolute).
# Run Biome on that path only; matches CI (no rule skips). Paths outside
# files.includes exit 0 via --no-errors-on-unmatched.
. "$(dirname "$0")/lib/extract-file-path.sh"

file=$(extract_file_path) || exit 0

[ -z "$file" ] && exit 0
[ ! -f "$file" ] && exit 0

exec npx biome check --write --no-errors-on-unmatched -- "$file"