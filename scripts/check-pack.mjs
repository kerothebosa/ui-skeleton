import { execSync } from "node:child_process";

const output = execSync("npm pack --dry-run 2>&1", {
  stdio: ["ignore", "pipe", "inherit"],
  encoding: "utf8"
});

const requiredFiles = [
  "dist/index.js",
  "dist/index.cjs",
  "dist/index.d.ts",
  "dist/styles.css",
  "README.md",
  "LICENSE"
];

const missing = requiredFiles.filter((file) => !output.includes(file));

if (missing.length > 0) {
  throw new Error(`npm pack output is missing required files: ${missing.join(", ")}`);
}

console.log("Pack validation passed.");
