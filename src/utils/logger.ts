export class Logger {
  constructor(private readonly debugEnabled: boolean) {}

  debug(...args: unknown[]): void {
    if (!this.debugEnabled) {
      return;
    }

    // Intentionally logs only in debug mode to aid library consumers.
    console.info("[@skeleton-ui/net]", ...args);
  }

  warn(...args: unknown[]): void {
    console.warn("[@skeleton-ui/net]", ...args);
  }

  error(...args: unknown[]): void {
    console.error("[@skeleton-ui/net]", ...args);
  }
}
