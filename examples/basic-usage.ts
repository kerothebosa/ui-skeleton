import { SkeletonEnhancer } from "@kerothebosa/ui-skeleton-net";

const enhancer = new SkeletonEnhancer({
  skeletonSelector: "#app",
  hooks: {
    onRequestStart: ({ url }) => {
      console.log("Request started:", url);
    },
    onRequestEnd: ({ url, status }) => {
      console.log("Request finished:", url, status);
    }
  }
});

enhancer.start();
