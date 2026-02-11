export type EventHandler<T> = (payload: T) => void;
export type EventMap = Record<string, unknown>;

export class EventBus<TEvents extends EventMap> {
  private listeners: { [K in keyof TEvents]?: Set<EventHandler<TEvents[K]>> } = {};

  on<TKey extends keyof TEvents>(event: TKey, handler: EventHandler<TEvents[TKey]>): void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }

    this.listeners[event]?.add(handler);
  }

  off<TKey extends keyof TEvents>(event: TKey, handler: EventHandler<TEvents[TKey]>): void {
    this.listeners[event]?.delete(handler);
  }

  emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]): void {
    this.listeners[event]?.forEach((handler) => {
      handler(payload);
    });
  }

  removeAll(): void {
    Object.values(this.listeners).forEach((listenerSet) => listenerSet?.clear());
    this.listeners = {};
  }
}
