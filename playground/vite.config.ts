import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const repository = process.env.GITHUB_REPOSITORY ?? "kerothebosa/ui-skeleton";
const repoName = repository.split("/")[1] ?? "net";
const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const base = process.env.DEMO_BASE ?? (isGitHubActions ? `/${repoName}/demo/` : "/");

export default defineConfig({
  root: rootDir,
  base,
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true
  },
  server: {
    host: "127.0.0.1",
    port: 4174,
    strictPort: true,
    fs: {
      allow: [resolve(rootDir, "..")]
    }
  },
  preview: {
    host: "127.0.0.1",
    port: 4174,
    strictPort: true
  }
});
