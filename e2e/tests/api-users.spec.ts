import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_BASE || "http://localhost:4000";

test.describe("Users API", () => {
  test("GET /api/v1/users returns paginated list", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/users`);
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("limit");
    expect(body).toHaveProperty("offset");
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("POST /api/v1/users validates input", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/v1/users`, {
      data: { email: "not-valid" },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/v1/users creates user with valid data", async ({ request }) => {
    const email = `e2e-${Date.now()}@test.com`;
    const res = await request.post(`${API_BASE}/api/v1/users`, {
      data: { email, name: "E2E Test" },
    });
    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.email).toBe(email);
    expect(body.id).toBeDefined();
  });
});
