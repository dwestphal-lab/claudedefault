import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

// Mock Prisma
vi.mock("../middleware/prisma.js", () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
    user: {
      findMany: vi.fn().mockResolvedValue([
        { id: "1", email: "test@example.com", name: "Test", createdAt: new Date(), updatedAt: new Date() },
      ]),
      count: vi.fn().mockResolvedValue(1),
      create: vi.fn().mockImplementation((args: any) => ({
        id: "new-id",
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    $disconnect: vi.fn(),
  },
  disconnectPrisma: vi.fn(),
}));

describe("GET /api/v1/users", () => {
  const app = createApp();

  it("returns paginated user list", async () => {
    const res = await request(app).get("/api/v1/users");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("limit");
    expect(res.body).toHaveProperty("offset");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("respects pagination params", async () => {
    const res = await request(app).get("/api/v1/users?limit=5&offset=10");

    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(5);
    expect(res.body.offset).toBe(10);
  });
});

describe("POST /api/v1/users", () => {
  const app = createApp();

  it("creates a user with valid data", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .send({ email: "new@example.com", name: "New User" });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe("new@example.com");
  });

  it("rejects invalid email", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .send({ email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("rejects empty body", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 409 for duplicate email", async () => {
    const { prisma } = await import("../middleware/prisma.js");
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "existing",
      email: "dup@example.com",
      name: null,
      role: "USER",
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const res = await request(app)
      .post("/api/v1/users")
      .send({ email: "dup@example.com" });

    expect(res.status).toBe(409);
  });
});
