import type { EnhancerLifecycleState } from "../types/internal";

export const LifecycleState: Record<Uppercase<EnhancerLifecycleState>, EnhancerLifecycleState> = {
  IDLE: "idle",
  RUNNING: "running",
  STOPPED: "stopped",
  DESTROYED: "destroyed"
};
