import type {
  RequestEndPayload,
  RequestStartPayload,
  SkeletonRequestSource
} from "../types/public";

export type NetworkRequestStartEvent = RequestStartPayload;
export type NetworkRequestControl = {
  canAbort?: boolean;
  cancel?: () => void;
};
export type NetworkRequestStartEventWithControl = NetworkRequestStartEvent & NetworkRequestControl;
export type NetworkRequestEndEvent = RequestEndPayload;

export type NetworkRequestErrorEvent = {
  requestId: string;
  url: string;
  method: string;
  source: SkeletonRequestSource;
  startedAt: number;
  error: Error;
};

export type NetworkEventSubscriber = {
  onRequestStart(event: NetworkRequestStartEventWithControl): void;
  onRequestEnd(event: NetworkRequestEndEvent): void;
  onError(event: NetworkRequestErrorEvent): void;
};
