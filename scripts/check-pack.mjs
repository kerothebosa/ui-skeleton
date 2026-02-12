import { execSync } from "node:child_process";

const jsonOutput = execSync("npm pack --dry-run --json --ignore-scripts", {
  stdio: ["ignore", "pipe", "inherit"],
  encoding: "utf8"
});

const startIndex = jsonOutput.indexOf("[");
const endIndex = jsonOutput.lastIndexOf("]");
if (startIndex < 0 || endIndex < 0) {
  throw new Error("Could not locate JSON payload in npm pack output.");
}

const parsed = JSON.parse(jsonOutput.slice(startIndex, endIndex + 1));
const packResult = Array.isArray(parsed) ? parsed[0] : null;
if (!packResult || !Array.isArray(packResult.files)) {
  throw new Error("Could not parse npm pack --dry-run --json output.");
}

const packedFiles = new Set(packResult.files.map((entry = {}) => entry.path).filter(Boolean));

const requiredFiles = [
  "dist/index.js",
  "dist/index.cjs",
  "dist/index.d.ts",
  "dist/styles.css",
  "README.md",
  "LICENSE",
  "CHANGELOG.md"
];

const missing = requiredFiles.filter((file) => !packedFiles.has(file));

if (missing.length > 0) {
  throw new Error(`npm pack output is missing required files: ${missing.join(", ")}`);
}

const forbiddenPrefixes = ["src/", "tests/", "playground/", "site/", ".github/"];
const leakedFiles = [...packedFiles].filter((file) =>
  forbiddenPrefixes.some((prefix) => file.startsWith(prefix))
);

if (leakedFiles.length > 0) {
  throw new Error(`npm pack output contains unexpected files: ${leakedFiles.join(", ")}`);
}

console.log("Pack validation passed.");
