/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  detectOpenHandles: true,
  testMatch: ["<rootDir>/tests/integration/users.test.ts"],
};
