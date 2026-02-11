import { SkeletonEnhancer } from "/dist/index.js";

const enhancer = new SkeletonEnhancer({
  skeletonSelector: "#content",
  debug: true
});

enhancer.start();
