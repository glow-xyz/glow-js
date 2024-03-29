// Inspired by https://github.com/arcatdmz/nextjs-with-jest-typescript/blob/master/jest.config.js
module.exports = {
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "tsx", "js"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        // This helps the tests run faster
        // But it skips typechecking, so that should be a different step on CI
        // https://huafu.github.io/ts-jest/user/config/isolatedModules
        isolatedModules: true,
      },
    ],
  },
  testMatch: ["**/__tests__/*.test.(ts|tsx)"],
  testPathIgnorePatterns: ["./dist", "./node_modules/"],
  collectCoverage: false,
};
