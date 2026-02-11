import type {
  SkeletonAnimationPreset,
  SkeletonAdaptiveOptions,
  SkeletonRenderMode,
  SkeletonThemeCustom,
  SkeletonThemePreset
} from "../types/public";

export type ResolvedSkeletonVisuals = {
  mode: SkeletonRenderMode;
  animation: SkeletonAnimationPreset;
  theme: SkeletonThemePreset | SkeletonThemeCustom;
  adaptive: Required<SkeletonAdaptiveOptions>;
};

type ThemeTokens = {
  baseColor: string;
  highlightColor: string;
  durationMs: number;
  easing: string;
};

const DEFAULT_THEME_BY_PRESET: Record<SkeletonThemePreset, ThemeTokens> = {
  classic: {
    baseColor: "#e8ecf1",
    highlightColor: "#f7f9fb",
    durationMs: 1100,
    easing: "linear"
  },
  cool: {
    baseColor: "#dde6f7",
    highlightColor: "#f4f8ff",
    durationMs: 1200,
    easing: "ease-in-out"
  },
  warm: {
    baseColor: "#efe5d6",
    highlightColor: "#fff8ee",
    durationMs: 1250,
    easing: "ease-in-out"
  },
  contrast: {
    baseColor: "#ced4dc",
    highlightColor: "#f8fbff",
    durationMs: 980,
    easing: "linear"
  }
};

const resolveThemeTokens = (theme: ResolvedSkeletonVisuals["theme"]): ThemeTokens => {
  if (typeof theme === "string") {
    return DEFAULT_THEME_BY_PRESET[theme];
  }

  return {
    baseColor: theme.baseColor,
    highlightColor: theme.highlightColor,
    durationMs: theme.durationMs ?? 1100,
    easing: theme.easing ?? "linear"
  };
};

const overlayBackground = (baseColor: string, highlightColor: string): string => {
  return `linear-gradient(90deg, ${baseColor} 18%, ${highlightColor} 50%, ${baseColor} 82%)`;
};

const toAnimationFrames = (preset: SkeletonAnimationPreset): string => {
  if (preset === "none") {
    return "0% { opacity: 1; } 100% { opacity: 1; }";
  }

  if (preset === "wave") {
    return "0% { transform: translateX(-12%); } 50% { transform: translateX(0%); } 100% { transform: translateX(12%); }";
  }

  if (preset === "pulse") {
    return "0% { opacity: 0.62; } 50% { opacity: 1; } 100% { opacity: 0.62; }";
  }

  if (preset === "breathe") {
    return "0% { opacity: 0.78; filter: saturate(0.94); } 50% { opacity: 1; filter: saturate(1.08); } 100% { opacity: 0.78; filter: saturate(0.94); }";
  }

  return "0% { background-position: 100% 0; } 100% { background-position: 0 0; }";
};

const toAnimationName = (instanceClassName: string): string => {
  return `${instanceClassName.replace(/[^a-zA-Z0-9_-]/g, "")}-anim`;
};

const toAnimationRule = (
  preset: SkeletonAnimationPreset,
  durationMs: number,
  easing: string,
  animationName: string
): string => {
  if (preset === "none") {
    return "none";
  }

  return `${animationName} ${Math.max(240, durationMs)}ms ${easing} infinite`;
};

const createStyleCss = (
  instanceClassName: string,
  overlayClassName: string,
  visuals: ResolvedSkeletonVisuals
): string => {
  const themeTokens = resolveThemeTokens(visuals.theme);
  const animationName = toAnimationName(instanceClassName);
  const animationRule = toAnimationRule(
    visuals.animation,
    themeTokens.durationMs,
    themeTokens.easing,
    animationName
  );

  return `
.${instanceClassName} {
  --sknet-base: ${themeTokens.baseColor};
  --sknet-highlight: ${themeTokens.highlightColor};
  --sknet-line-gap: ${visuals.adaptive.lineGapPx}px;
  --sknet-min-block-height: ${visuals.adaptive.minBlockHeightPx}px;
}

.${overlayClassName}.${instanceClassName}[data-skeleton-mode="overlay"] {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  border-radius: inherit;
  background: ${overlayBackground(themeTokens.baseColor, themeTokens.highlightColor)};
  background-size: 300% 100%;
  animation: ${animationRule};
}

.${overlayClassName}.${instanceClassName}[data-skeleton-mode="adaptive"] {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  border-radius: inherit;
  background: transparent;
  overflow: hidden;
}

.${overlayClassName}.${instanceClassName}[data-skeleton-mode="adaptive"] .sknet-adaptive-block {
  position: absolute;
  background: ${overlayBackground(themeTokens.baseColor, themeTokens.highlightColor)};
  background-size: 300% 100%;
  animation: ${animationRule};
}

@keyframes ${animationName} {
  ${toAnimationFrames(visuals.animation)}
}

@media (prefers-reduced-motion: reduce) {
  .${overlayClassName}.${instanceClassName}[data-skeleton-mode="overlay"],
  .${overlayClassName}.${instanceClassName}[data-skeleton-mode="adaptive"] .sknet-adaptive-block {
    animation: none;
    background-position: 50% 0;
  }
}
`;
};

let styleCounter = 0;

export class SkeletonStyleRegistry {
  readonly instanceClassName: string;
  private styleElement: HTMLStyleElement | null = null;

  constructor(
    private readonly overlayClassName: string,
    private readonly visuals: ResolvedSkeletonVisuals
  ) {
    styleCounter += 1;
    this.instanceClassName = `sknet-visual-${styleCounter}`;
  }

  ensureAttached(): void {
    if (typeof document === "undefined" || this.styleElement) {
      return;
    }

    const style = document.createElement("style");
    style.setAttribute("data-sknet-style", this.instanceClassName);
    style.textContent = createStyleCss(this.instanceClassName, this.overlayClassName, this.visuals);
    document.head.append(style);
    this.styleElement = style;
  }

  detach(): void {
    this.styleElement?.remove();
    this.styleElement = null;
  }
}
