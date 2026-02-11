export type DomMutationObserverOptions = {
  target: Node;
  options?: MutationObserverInit;
};

export class DomMutationObserver {
  private observer: MutationObserver | null = null;

  start(
    observerOptions: DomMutationObserverOptions,
    callback: MutationCallback
  ): MutationObserver | null {
    this.stop();
    this.observer = new MutationObserver(callback);
    this.observer.observe(observerOptions.target, observerOptions.options ?? { childList: true });
    return this.observer;
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
  }
}
