# shellcheck shell=bash
# Shared: read Agent afterFileEdit JSON from stdin; print file_path.
extract_file_path() {
  node -e "
    const fs = require('fs');
    try {
      const raw = fs.readFileSync(0, 'utf8');
      const p = JSON.parse(raw).file_path;
      if (typeof p === 'string' && p) process.stdout.write(p);
    } catch {
      process.exit(0);
    }
  "
}