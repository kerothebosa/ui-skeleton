# Lifecycle And Events

## Lifecycle States

- `idle`: instance created, not started.
- `running`: interceptors installed, network events handled.
- `stopped`: interceptors uninstalled, in-flight skeleton state cleaned.
- `destroyed`: terminal state; no further start allowed.

## Start/Stop Rules

- `start()` is idempotent while already running.
- `stop()` is idempotent while not running.
- `destroy()` is idempotent and always performs cleanup.
- In non-browser environments, `start()` is a no-op.

## Event Timeline Per Request

1. `request:start` emitted after request passes filter.
2. Skeleton show may occur after `showDelayMs`.
3. `error` may occur on network failure/abort/timeout.
4. `request:end` emitted once per tracked request.
5. Skeleton hide occurs immediately or delayed to satisfy `minVisibleMs`.

## Timeout Behavior

- `requestTimeoutMs` is handled by enhancer tracking.
- On timeout:
  - `error` is emitted with timeout message.
  - synthetic `request:end` is emitted with `ok: false`, `status: 0`.
  - skeleton state is cleaned without waiting for the eventual network completion.
