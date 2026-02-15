export class Logger {
  constructor(private readonly debugEnabled: boolean) {}

  debug(...args: unknown[]): void {
    if (!this.debugEnabled) {
      return;
    }

    // Intentionally logs only in debug mode to aid library consumers.
    console.info("[@kerothebosa/ui-skeleton-net]", ...args);
  }

  warn(...args: unknown[]): void {
    console.warn("[@kerothebosa/ui-skeleton-net]", ...args);
  }

  error(...args: unknown[]): void {
    console.error("[@kerothebosa/ui-skeleton-net]", ...args);
  }
}
