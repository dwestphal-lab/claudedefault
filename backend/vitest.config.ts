import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      DATABASE_URL: "postgresql://app:secret@localhost:5432/appdb",
      CORS_ORIGIN: "http://localhost:3000",
      PORT: "4000",
      NODE_ENV: "development",
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/__tests__/**", "src/**/*.test.ts"],
    },
  },
});
