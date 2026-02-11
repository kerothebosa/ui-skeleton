import type {
  SkeletonAdaptiveOptions,
  SkeletonAnimationPreset,
  SkeletonRenderMode,
  SkeletonThemeCustom,
  SkeletonThemePreset
} from "../types/public";
import { SkeletonStyleRegistry, type ResolvedSkeletonVisuals } from "./style-registry";

export type SkeletonManagerVisuals = {
  mode?: SkeletonRenderMode;
  animation?: SkeletonAnimationPreset;
  theme?: SkeletonThemePreset | SkeletonThemeCustom;
  adaptive?: SkeletonAdaptiveOptions;
};

export type SkeletonManagerOptions = {
  selector: string;
  className: string;
  overlayClassName: string;
  visuals?: SkeletonManagerVisuals;
};

const SKELETON_NODE_ID = "sknet-skeleton-node";
const ADAPTIVE_BLOCK_ATTR = "data-skeleton-placeholder";
const ADAPTIVE_BLOCK_VALUE = "block";

const DEFAULT_VISUALS: ResolvedSkeletonVisuals = {
  mode: "hybrid",
  animation: "shimmer",
  theme: "classic",
  adaptive: {
    maxDepth: 4,
    maxPlaceholders: 72,
    minBlockHeightPx: 8,
    lineGapPx: 5,
    ignoreSelectors: [
      "[data-skeleton-node]",
      "script",
      "style",
      "noscript",
      "template",
      "iframe",
      "canvas"
    ]
  }
};

const TEXT_TAGS = new Set([
  "p",
  "span",
  "label",
  "small",
  "strong",
  "em",
  "a",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "td",
  "th"
]);

const SOLID_BLOCK_TAGS = new Set(["img", "video", "button", "input", "select", "textarea", "svg"]);

const parsePixelValue = (value: string | null): number => {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed;
};

const normalizeVisuals = (visuals: SkeletonManagerVisuals | undefined): ResolvedSkeletonVisuals => {
  return {
    mode: visuals?.mode ?? DEFAULT_VISUALS.mode,
    animation: visuals?.animation ?? DEFAULT_VISUALS.animation,
    theme: visuals?.theme ?? DEFAULT_VISUALS.theme,
    adaptive: {
      maxDepth: visuals?.adaptive?.maxDepth ?? DEFAULT_VISUALS.adaptive.maxDepth,
      maxPlaceholders: visuals?.adaptive?.maxPlaceholders ?? DEFAULT_VISUALS.adaptive.maxPlaceholders,
      minBlockHeightPx:
        visuals?.adaptive?.minBlockHeightPx ?? DEFAULT_VISUALS.adaptive.minBlockHeightPx,
      lineGapPx: visuals?.adaptive?.lineGapPx ?? DEFAULT_VISUALS.adaptive.lineGapPx,
      ignoreSelectors: visuals?.adaptive?.ignoreSelectors ?? DEFAULT_VISUALS.adaptive.ignoreSelectors
    }
  };
};

export class SkeletonManager {
  private activeRequestIds = new Set<string>();
  private target: HTMLElement | null = null;
  private readonly visuals: ResolvedSkeletonVisuals;
  private readonly styleRegistry: SkeletonStyleRegistry;
  private targetPositionPatched = false;
  private originalTargetPosition: string | null = null;

  constructor(private readonly options: SkeletonManagerOptions) {
    this.visuals = normalizeVisuals(options.visuals);
    this.styleRegistry = new SkeletonStyleRegistry(options.overlayClassName, this.visuals);
  }

  getTarget(): HTMLElement | null {
    return this.resolveTarget();
  }

  show(requestId: string): void {
    const target = this.resolveTarget();
    if (!target) {
      return;
    }

    this.styleRegistry.ensureAttached();
    this.ensureTargetPosition(target);

    this.activeRequestIds.add(requestId);
    target.setAttribute("data-skeleton-visible", "true");
    target.classList.add(this.options.className);
    this.ensureSkeletonNode(target);
  }

  hide(requestId: string): void {
    const target = this.resolveTarget();
    if (!target) {
      return;
    }

    this.activeRequestIds.delete(requestId);

    if (this.activeRequestIds.size > 0) {
      return;
    }

    target.setAttribute("data-skeleton-visible", "false");
    target.classList.remove(this.options.className);
    target.querySelector(`[data-skeleton-node="${SKELETON_NODE_ID}"]`)?.remove();
    this.restoreTargetPosition(target);
  }

  cleanup(): void {
    const target = this.resolveTarget();
    if (!target) {
      return;
    }

    this.activeRequestIds.clear();
    target.setAttribute("data-skeleton-visible", "false");
    target.classList.remove(this.options.className);
    target.querySelector(`[data-skeleton-node="${SKELETON_NODE_ID}"]`)?.remove();
    this.restoreTargetPosition(target);
  }

  dispose(): void {
    this.cleanup();
    this.styleRegistry.detach();
  }

  private resolveTarget(): HTMLElement | null {
    if (this.target && this.target.isConnected) {
      return this.target;
    }

    this.target = document.querySelector<HTMLElement>(this.options.selector);
    return this.target;
  }

  private ensureTargetPosition(target: HTMLElement): void {
    if (this.targetPositionPatched) {
      return;
    }

    const computed = window.getComputedStyle(target);
    if (computed.position !== "static") {
      return;
    }

    this.targetPositionPatched = true;
    this.originalTargetPosition = target.style.position;
    target.style.position = "relative";
    target.setAttribute("data-skeleton-position-patched", "true");
  }

  private restoreTargetPosition(target: HTMLElement): void {
    if (!this.targetPositionPatched) {
      return;
    }

    target.style.position = this.originalTargetPosition ?? "";
    target.removeAttribute("data-skeleton-position-patched");
    this.targetPositionPatched = false;
    this.originalTargetPosition = null;
  }

  private ensureSkeletonNode(target: HTMLElement): void {
    const existing = target.querySelector<HTMLElement>(`[data-skeleton-node="${SKELETON_NODE_ID}"]`);
    if (existing) {
      return;
    }

    const node = document.createElement("div");
    node.setAttribute("data-skeleton-node", SKELETON_NODE_ID);
    node.setAttribute("aria-hidden", "true");
    node.className = `${this.options.overlayClassName} ${this.styleRegistry.instanceClassName}`;

    const renderMode = this.renderModeForTarget();
    node.setAttribute("data-skeleton-mode", renderMode);

    if (renderMode === "adaptive") {
      let created = false;
      try {
        created = this.renderAdaptivePlaceholders(target, node);
      } catch {
        created = false;
      }
      if (!created) {
        node.setAttribute("data-skeleton-mode", "overlay");
      }
    }

    target.prepend(node);
  }

  private renderModeForTarget(): "overlay" | "adaptive" {
    if (this.visuals.mode === "overlay") {
      return "overlay";
    }

    if (this.visuals.mode === "adaptive") {
      return "adaptive";
    }

    return "adaptive";
  }

  private renderAdaptivePlaceholders(target: HTMLElement, node: HTMLElement): boolean {
    node.innerHTML = "";
    const candidates = this.collectAdaptiveCandidates(target);
    if (candidates.length === 0) {
      return false;
    }

    const targetRect = target.getBoundingClientRect();
    let blockCount = 0;

    for (const candidate of candidates) {
      if (blockCount >= this.visuals.adaptive.maxPlaceholders) {
        break;
      }

      const blocks = this.toCandidateBlocks(candidate, targetRect, blockCount);
      for (const block of blocks) {
        if (blockCount >= this.visuals.adaptive.maxPlaceholders) {
          break;
        }
        node.append(block);
        blockCount += 1;
      }
    }

    return blockCount > 0;
  }

  private collectAdaptiveCandidates(target: HTMLElement): HTMLElement[] {
    const candidates: HTMLElement[] = [];
    const maxDepth = Math.max(1, this.visuals.adaptive.maxDepth);
    const ignoreSelectors = this.visuals.adaptive.ignoreSelectors
      .map((selector = "") => selector.trim())
      .filter(Boolean);
    const ignoreSelectorList = ignoreSelectors.join(",");
    const rootRect = target.getBoundingClientRect();

    const walker = document.createTreeWalker(target, NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!(node instanceof HTMLElement)) {
        continue;
      }

      const depth = this.getDepth(target, node);
      if (depth > maxDepth) {
        continue;
      }

      if (ignoreSelectorList) {
        try {
          if (node.matches(ignoreSelectorList)) {
            continue;
          }
        } catch {
          // Ignore malformed selector config and continue candidate scanning.
        }
      }

      if (node.hasAttribute("data-skeleton-node")) {
        continue;
      }

      const computed = window.getComputedStyle(node);
      if (computed.display === "none" || computed.visibility === "hidden" || computed.opacity === "0") {
        continue;
      }

      const rect = node.getBoundingClientRect();
      if (rect.width < 6 || rect.height < this.visuals.adaptive.minBlockHeightPx) {
        continue;
      }

      if (
        rect.bottom < rootRect.top ||
        rect.top > rootRect.bottom ||
        rect.right < rootRect.left ||
        rect.left > rootRect.right
      ) {
        continue;
      }

      if (!node.textContent?.trim() && !SOLID_BLOCK_TAGS.has(node.tagName.toLowerCase())) {
        continue;
      }

      candidates.push(node);
    }

    return candidates;
  }

  private getDepth(root: HTMLElement, node: HTMLElement): number {
    let depth = 0;
    let current: HTMLElement | null = node;

    while (current && current !== root) {
      current = current.parentElement;
      depth += 1;
      if (depth > 50) {
        break;
      }
    }

    return depth;
  }

  private toCandidateBlocks(
    candidate: HTMLElement,
    targetRect: DOMRect,
    seed: number
  ): HTMLElement[] {
    const tag = candidate.tagName.toLowerCase();
    const rect = candidate.getBoundingClientRect();
    const localLeft = Math.max(0, rect.left - targetRect.left);
    const localTop = Math.max(0, rect.top - targetRect.top);
    const localWidth = Math.max(8, rect.width);
    const localHeight = Math.max(this.visuals.adaptive.minBlockHeightPx, rect.height);

    if (TEXT_TAGS.has(tag)) {
      return this.toTextBlocks(candidate, localLeft, localTop, localWidth, localHeight, seed);
    }

    return [
      this.createBlock({
        left: localLeft,
        top: localTop,
        width: localWidth,
        height: localHeight,
        radius: parsePixelValue(window.getComputedStyle(candidate).borderRadius) || 8
      })
    ];
  }

  private toTextBlocks(
    candidate: HTMLElement,
    left: number,
    top: number,
    width: number,
    height: number,
    seed: number
  ): HTMLElement[] {
    const computed = window.getComputedStyle(candidate);
    const lineHeight = parsePixelValue(computed.lineHeight) || parsePixelValue(computed.fontSize) * 1.35 || 16;
    const gap = this.visuals.adaptive.lineGapPx;
    const lineCount = Math.max(1, Math.min(4, Math.round(height / Math.max(8, lineHeight + gap))));
    const blocks: HTMLElement[] = [];

    for (let index = 0; index < lineCount; index += 1) {
      const isLast = index === lineCount - 1;
      const widthRatio = isLast ? this.widthRatioBySeed(seed + index) : 0.98;
      const blockWidth = Math.max(14, width * widthRatio);
      const blockTop = top + index * (lineHeight + gap);

      blocks.push(
        this.createBlock({
          left,
          top: blockTop,
          width: blockWidth,
          height: Math.max(this.visuals.adaptive.minBlockHeightPx, lineHeight * 0.82),
          radius: Math.max(4, Math.round(lineHeight * 0.28))
        })
      );
    }

    return blocks;
  }

  private widthRatioBySeed(seed: number): number {
    const cycle = [0.62, 0.7, 0.78, 0.84, 0.9];
    return cycle[Math.abs(seed) % cycle.length];
  }

  private createBlock(input: {
    left: number;
    top: number;
    width: number;
    height: number;
    radius: number;
  }): HTMLElement {
    const block = document.createElement("div");
    block.className = "sknet-adaptive-block";
    block.setAttribute(ADAPTIVE_BLOCK_ATTR, ADAPTIVE_BLOCK_VALUE);
    block.style.left = `${Math.max(0, input.left)}px`;
    block.style.top = `${Math.max(0, input.top)}px`;
    block.style.width = `${Math.max(4, input.width)}px`;
    block.style.height = `${Math.max(this.visuals.adaptive.minBlockHeightPx, input.height)}px`;
    block.style.borderRadius = `${Math.max(0, input.radius)}px`;
    return block;
  }
}
