import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Loads KEY=VALUE pairs from a `.env` file into `process.env` when present.
 * Does not override existing environment variables.
 * @param filePath Absolute or relative path to the env file.
 */
export function loadEnvFile(filePath: string): void {
  const absolute = resolve(filePath);
  if (!existsSync(absolute)) {
    return;
  }
  const text = readFileSync(absolute, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
