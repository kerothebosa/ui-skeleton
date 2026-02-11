import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/tests/unit"],
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts", "!src/**/index.ts", "!src/types/**", "!src/utils/logger.ts"],
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80
    }
  },
  testPathIgnorePatterns: ["<rootDir>/tests/e2e", "<rootDir>/dist"]
};

export default config;
