import { defineConfig } from "vitepress";

const repository = process.env.GITHUB_REPOSITORY ?? "kerothebosa/ui-skeleton";
const owner = repository.split("/")[0] ?? "kerothebosa";
const repoName = repository.split("/")[1] ?? "net";
const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const configuredBase =
  process.env.DOCS_BASE ?? (isGitHubActions ? `/${repoName}/` : "/");
const base = configuredBase.endsWith("/") ? configuredBase : `${configuredBase}/`;
const repositoryUrl = `https://github.com/${repository}`;
const siteUrl = `https://${owner}.github.io/${repoName}/`;
const withBase = (assetPath: string): string =>
  `${base}${assetPath.replace(/^\//, "")}`;
const packageName = "@kerothebosa/ui-skeleton-net";

export default defineConfig({
  title: packageName,
  description:
    "Professional, framework-agnostic skeleton loading driven by fetch/xhr network lifecycle and typed hooks.",
  base,
  cleanUrls: true,
  themeConfig: {
    siteTitle: false,
    logo: { src: withBase("logo.svg"), alt: packageName },
    nav: [
      { text: "Architecture", link: "/architecture" },
      { text: "Lifecycle & Events", link: "/lifecycle-and-events" },
      { text: "API Reference", link: "/api-reference" },
      { text: "Interceptors", link: "/interceptors" },
      { text: "Testing", link: "/testing" },
      { text: "Playground", link: "/playground" },
      { text: "Examples", link: "/examples" },
      { text: "Demo", link: `${siteUrl}demo/`, target: "_blank", rel: "noreferrer" }
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
    socialLinks: [{ icon: "github", link: repositoryUrl }],
    editLink: {
      pattern: `${repositoryUrl}/edit/main/docs/:path`,
      text: "Edit this page on GitHub"
    },
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright (c) kerothebosa"
    }
  },
  head: [
    ["meta", { name: "theme-color", content: "#0f172a" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: packageName }],
    [
      "meta",
      {
        property: "og:title",
        content: `${packageName} | Network-Aware Skeleton Loading`
      }
    ],
    [
      "meta",
      {
        property: "og:description",
        content:
          "Build smoother loading UX with fetch/xhr interceptors, timing controls, and typed lifecycle hooks."
      }
    ],
    ["meta", { property: "og:url", content: siteUrl }],
    ["meta", { property: "og:image", content: withBase("logo.svg") }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    [
      "meta",
      {
        name: "twitter:title",
        content: `${packageName} | Network-Aware Skeleton Loading`
      }
    ],
    [
      "meta",
      {
        name: "twitter:description",
        content:
          "Framework-agnostic skeleton loading enhancer for real network lifecycle."
      }
    ],
    ["link", { rel: "icon", href: withBase("logo.svg") }]
  ]
});
