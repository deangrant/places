import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** `apps/api` — parent of this `scripts/` file. */
const apiRoot = fileURLToPath(new URL("..", import.meta.url));
const tscBin = path.join(apiRoot, "node_modules", ".bin", "tsc");

let shuttingDown = false;

const children = [
  spawn(
    tscBin,
    ["-p", "tsconfig.build.json", "--watch", "--preserveWatchOutput"],
    { cwd: apiRoot, stdio: "inherit" },
  ),
  spawn(process.execPath, ["--watch", "dist/server.js"], {
    cwd: apiRoot,
    stdio: "inherit",
  }),
];

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (shuttingDown || signal === "SIGTERM" || signal === "SIGINT") {
      return;
    }
    shutdown(code ?? 1);
  });
}
