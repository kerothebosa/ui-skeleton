export type EnhancerLifecycleState = "idle" | "running" | "stopped" | "destroyed";

export type RequestTracker = {
  requestId: string;
  startedAt: number;
  url: string;
  method: string;
};
