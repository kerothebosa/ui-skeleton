import { defineConfig } from "vitepress";

const repository = process.env.GITHUB_REPOSITORY ?? "skeleton-ui/net";
const repoName = repository.split("/")[1] ?? "net";
const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const base = process.env.DOCS_BASE ?? (isGitHubActions ? `/${repoName}/` : "/");

export default defineConfig({
  title: "@skeleton-ui/net",
  description:
    "Framework-agnostic skeleton loader enhancer driven by fetch/xhr network interceptors.",
  base,
  cleanUrls: true,
  themeConfig: {
    logo: { src: `${base}logo.svg`, alt: "@skeleton-ui/net" },
    nav: [
      { text: "Architecture", link: "/architecture" },
      { text: "Lifecycle & Events", link: "/lifecycle-and-events" },
      { text: "API", link: "/api-reference" },
      { text: "Interceptors", link: "/interceptors" },
      { text: "Testing", link: "/testing" },
      { text: "Playground", link: "/playground" },
      { text: "Examples", link: "/examples" },
      { text: "Demo", link: `${base}demo/` }
    ],
    sidebar: [
      {
        text: "Get Started",
        items: [
          { text: "Overview", link: "/" },
          { text: "Examples", link: "/examples" }
        ]
      },
      {
        text: "Core Docs",
        items: [
          { text: "Architecture", link: "/architecture" },
          { text: "Lifecycle & Events", link: "/lifecycle-and-events" },
          { text: "API Reference", link: "/api-reference" },
          { text: "Interceptors", link: "/interceptors" },
          { text: "Testing", link: "/testing" },
          { text: "Playground", link: "/playground" },
          { text: "Real-World Testing", link: "/real-world-testing" },
          { text: "Contributing", link: "/contributing" }
        ]
      }
    ],
    search: { provider: "local" },
    socialLinks: [{ icon: "github", link: "https://github.com/skeleton-ui/net" }],
    editLink: {
      pattern: "https://github.com/skeleton-ui/net/edit/main/:path",
      text: "Edit this page on GitHub"
    },
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright (c) skeleton-ui"
    }
  },
  head: [
    ["meta", { name: "theme-color", content: "#0f172a" }],
    ["link", { rel: "icon", href: `${base}logo.svg` }]
  ]
});
