import { cp, mkdir, rm, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "playground", "dist");
const destination = resolve(root, "site", "public", "demo");

try {
  await stat(source);
} catch {
  throw new Error(`Demo build output not found at ${source}. Run "npm run demo:build" first.`);
}

await mkdir(resolve(root, "site", "public"), { recursive: true });
await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });

console.log(`Copied demo assets: ${source} -> ${destination}`);
