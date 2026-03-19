import { test, expect } from "@playwright/test";

test.describe("Health Check", () => {
  test("API health endpoint returns ok", async ({ request }) => {
    const res = await request.get("/api/v1/health");
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.db).toBe("connected");
    expect(body.version).toBeDefined();
  });
});
