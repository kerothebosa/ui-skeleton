export const isBrowserEnvironment = (): boolean => {
  return typeof window !== "undefined" && typeof document !== "undefined";
};

export const isFetchAvailable = (): boolean => {
  return typeof globalThis.fetch === "function";
};

export const isXmlHttpRequestAvailable = (): boolean => {
  return typeof globalThis.XMLHttpRequest === "function";
};
