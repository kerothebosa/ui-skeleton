import { execSync } from "node:child_process";

const jsonOutput = execSync("npm pack --dry-run --json", {
  stdio: ["ignore", "pipe", "inherit"],
  encoding: "utf8",
  env: {
    ...process.env,
    npm_config_ignore_scripts: "true",
    npm_config_loglevel: "silent",
    npm_config_color: "false"
  }
});

const parsePackJson = (output = "") => {
  const trimmed = output.trim();
  if (!trimmed) {
    throw new Error("npm pack returned empty output.");
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    // npm can print extra non-JSON logs; extract the trailing JSON array payload.
    const match = output.match(/(\[\s*\{[\s\S]*\}\s*\])\s*$/);
    if (!match) {
      throw new Error("Could not locate JSON payload in npm pack output.");
    }
    return JSON.parse(match[1]);
  }
};

const parsed = parsePackJson(jsonOutput);
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
