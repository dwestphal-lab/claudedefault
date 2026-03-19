import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

// Mock Prisma
vi.mock("../middleware/prisma.js", () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
    user: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    $disconnect: vi.fn(),
  },
  disconnectPrisma: vi.fn(),
}));

describe("GET /api/v1/health", () => {
  const app = createApp();

  it("returns ok when DB is connected", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: "ok",
      db: "connected",
      redis: "disabled",
      version: "1.1.0",
    });
  });

  it("returns 503 when DB is down", async () => {
    const { prisma } = await import("../middleware/prisma.js");
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error("DB down"));

    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(503);
    expect(res.body.status).toBe("error");
  });
});
