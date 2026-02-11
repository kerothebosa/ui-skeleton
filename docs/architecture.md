# Architecture

## Module Map

- `src/core/`
  - `enhancer.ts`: lifecycle control, request tracking, timeout/timing logic, event emission.
- `src/network/`
  - `global-patch-registry.ts`: shared global monkey-patch ownership for `fetch` and `XMLHttpRequest`.
  - `fetch-interceptor.ts`, `xhr-interceptor.ts`: subscribe/unsubscribe wrappers around registry.
- `src/dom/`
  - `skeleton-manager.ts`: skeleton node show/hide/cleanup behavior with adaptive placeholder generation.
  - `style-registry.ts`: runtime CSS variable/keyframe generation for visual presets.
- `src/styles/`
  - `skeleton.css`: published default overlay styles consumed by `@skeleton-ui/net/styles.css`.
- `src/orchestrator/`
  - `event-bus.ts`: typed internal event fan-out.
- `src/types/`
  - `public.ts`: public API surface and event payload contracts.

## Request Lifecycle Flow

1. Interceptor installs and subscribes to global patch registry.
2. Registry emits normalized network events (`request:start`, `request:end`, `error`) to active subscribers.
3. `SkeletonEnhancer` receives these events and applies:
   - request filtering (`shouldHandleRequest`)
   - show delay (`showDelayMs`)
   - timeout synthesis (`requestTimeoutMs`)
   - minimum visible duration (`minVisibleMs`)
4. `SkeletonEnhancer` emits typed library events through `EventBus`.
5. `SkeletonManager` mutates DOM state and overlay node.
6. Style registry resolves animation/theme tokens and injects instance-scoped CSS.

Adaptive rendering safety:

- adaptive candidate scanning tolerates empty/invalid selector lists
- if adaptive placeholder generation fails, manager falls back to overlay mode instead of dropping the skeleton node
- this keeps `skeleton:show` and visible DOM state consistent under bad config input

## Styling Contract

- Runtime only injects DOM nodes and class names.
- Visual appearance uses both shipped stylesheet (`@skeleton-ui/net/styles.css`) and runtime-generated CSS.
- Consumers can override by:
  - setting `overlayClassName`, and/or
  - setting `skeletonVisuals` (mode, animation, theme, adaptive scanning), and/or
  - overriding CSS in their own stylesheet.

## Multi-Instance Safety

- Global patching is reference-counted.
- The first active subscriber installs patches.
- Additional enhancer instances reuse the same patches.
- Patches are restored only when the last subscriber unsubscribes.
- This prevents patch clobbering between multiple enhancer instances.
