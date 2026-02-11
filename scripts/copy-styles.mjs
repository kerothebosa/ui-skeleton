import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(__filename), "..");
const sourcePath = resolve(projectRoot, "src/styles/skeleton.css");
const destinationPath = resolve(projectRoot, "dist/styles.css");

await mkdir(dirname(destinationPath), { recursive: true });
await copyFile(sourcePath, destinationPath);
