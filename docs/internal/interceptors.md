# Interceptors

## Built-In Interceptors

- `fetch` interceptor
  - Subscribes to global fetch patch events.
  - Emits normalized request start/end/error payloads.
- `xhr` interceptor
  - Subscribes to global XHR patch events.
  - Tracks `open`/`send` lifecycle and emits normalized payloads.

## Global Patch Registry

- File: `src/network/global-patch-registry.ts`
- Responsibilities:
  - install global patch once per source (`fetch` / `xhr`)
  - broadcast normalized events to subscribers
  - restore originals when last subscriber unsubscribes

## Custom Interceptors

Public contract:

```ts
interface NetworkInterceptor {
  readonly name: string;
  install(): void;
  uninstall(): void;
  isInstalled(): boolean;
}
```

Registration:

```ts
enhancer.registerInterceptor(customInterceptor);
enhancer.unregisterInterceptor(customInterceptor.name);
```

Notes:

- Duplicate interceptor names are ignored.
- Custom interceptors are installed automatically when enhancer is running.
- Built-in interceptors can be gated with `enabledInterceptors`.
