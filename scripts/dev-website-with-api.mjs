import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const API_URL = "http://127.0.0.1:3847/health";

function run(name, cmd, args, cwd = root) {
  const child = spawn(cmd, args, {
    cwd,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
    }
  });
  return child;
}

async function isApiRunning() {
  try {
    const res = await fetch(API_URL, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

const apiAlreadyRunning = await isApiRunning();
let api = null;

if (apiAlreadyRunning) {
  console.log("API already running on :3847 — skipping duplicate start");
} else {
  console.log("Starting API server on :3847...");
  api = run("api", "node", ["server.js"], join(root, "api"));
}

const website = run("website", "npm", ["run", "dev:website"], root);

function shutdown() {
  api?.kill();
  website.kill();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

website.on("exit", () => {
  api?.kill();
  process.exit(0);
});
