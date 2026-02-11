import type { NetworkInterceptor } from "../types/public";
import { registerXhrSubscriber } from "./global-patch-registry";
import type { NetworkEventSubscriber } from "./types";

export class XhrInterceptor implements NetworkInterceptor {
  readonly name = "xhr";

  private installed = false;
  private unsubscribe: (() => void) | null = null;

  constructor(private readonly subscriber: NetworkEventSubscriber) {}

  install(): void {
    if (this.installed) {
      return;
    }

    this.unsubscribe = registerXhrSubscriber(this.subscriber);
    this.installed = true;
  }

  uninstall(): void {
    if (!this.installed) {
      return;
    }

    this.unsubscribe?.();
    this.unsubscribe = null;
    this.installed = false;
  }

  isInstalled(): boolean {
    return this.installed;
  }
}
