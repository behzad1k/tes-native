module.exports = {
  preset: "jest-expo",

  // Transform
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },

  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@nozbe/watermelondb|@tanstack|zustand)",
  ],

  // Setup
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],

  // Module paths
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@/src/(.*)$": "<rootDir>/src/$1",
    "^@/app/(.*)$": "<rootDir>/app/$1",
    "^@/assets/(.*)$": "<rootDir>/assets/$1",
  },

  // Test match patterns
  testMatch: [
    "<rootDir>/tests/**/*.test.{ts,tsx}",
    "<rootDir>/tests/**/*.spec.{ts,tsx}",
  ],

  // Coverage
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
    "!src/database/models/**",
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Module file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],

  // Globals
  globals: {
    "ts-jest": {
      tsconfig: {
        jsx: "react",
      },
    },
  },

  // Test environment
  testEnvironment: "node",

  // Verbose
  verbose: true,
};
