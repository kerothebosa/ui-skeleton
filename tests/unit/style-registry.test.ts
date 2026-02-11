import { SkeletonStyleRegistry } from "../../src/dom/style-registry";

describe("SkeletonStyleRegistry", () => {
  test("attaches and detaches style element for instance", () => {
    const registry = new SkeletonStyleRegistry("sknet-skeleton-overlay", {
      mode: "hybrid",
      animation: "wave",
      theme: "classic",
      adaptive: {
        maxDepth: 4,
        maxPlaceholders: 72,
        minBlockHeightPx: 8,
        lineGapPx: 5,
        ignoreSelectors: ["[data-skeleton-node]"]
      }
    });

    registry.ensureAttached();

    const style = document.head.querySelector(
      `[data-sknet-style="${registry.instanceClassName}"]`
    ) as HTMLStyleElement | null;
    expect(style).not.toBeNull();
    expect(style?.textContent).toContain("prefers-reduced-motion");
    expect(style?.textContent).toContain("sknet-adaptive-block");

    registry.detach();
    expect(
      document.head.querySelector(`[data-sknet-style="${registry.instanceClassName}"]`)
    ).toBeNull();
  });
});
