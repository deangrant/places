import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadApiConfig } from "./config.js";
import { createRequestListener } from "./create-app.js";
import { createApiServices } from "./create-services.js";
import { loadEnvFile } from "./load-env.js";

const here = dirname(fileURLToPath(import.meta.url));
loadEnvFile(join(here, "../.env"));

const config = loadApiConfig();
const services = createApiServices(config);
const server = createServer(createRequestListener(config, services));

server.listen(config.port, () => {
  // Startup log for local operators; keep free of secrets.
  console.log(`Places API listening on http://localhost:${config.port}`);
});
