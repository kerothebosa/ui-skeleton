import type { NetworkInterceptor } from "../types/public";
import { registerFetchSubscriber } from "./global-patch-registry";
import type { NetworkEventSubscriber } from "./types";

export class FetchInterceptor implements NetworkInterceptor {
  readonly name = "fetch";

  private installed = false;
  private unsubscribe: (() => void) | null = null;

  constructor(private readonly subscriber: NetworkEventSubscriber) {}

  install(): void {
    if (this.installed) {
      return;
    }

    this.unsubscribe = registerFetchSubscriber(this.subscriber);
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
