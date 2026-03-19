import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

// Mock Prisma — full mock needed because createApp() registers all routes
vi.mock("../middleware/prisma.js", () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
    $disconnect: vi.fn(),
    user: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
    },
    file: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
    },
    apiKey: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  disconnectPrisma: vi.fn(),
}));

const FIXED_API_KEY = "ak_test1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

// Mock generateApiKey to return a fixed key
vi.mock("../middleware/api-key.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("../middleware/api-key.js")>();
  return {
    ...original,
    generateApiKey: vi.fn().mockReturnValue("ak_test1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"),
  };
});

// Mock audit functions
vi.mock("../middleware/audit.js", () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
  getAuditUserId: vi.fn().mockReturnValue("system"),
}));

const mockKeys = [
  {
    id: "key-1",
    name: "Production Key",
    createdAt: new Date("2026-01-10T10:00:00Z"),
    expiresAt: new Date("2026-07-10T10:00:00Z"),
    lastUsed: new Date("2026-03-01T10:00:00Z"),
  },
  {
    id: "key-2",
    name: "Development Key",
    createdAt: new Date("2026-02-15T10:00:00Z"),
    expiresAt: null,
    lastUsed: null,
  },
];

describe("GET /api/v1/api-keys", () => {
  const app = createApp();

  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import("../middleware/prisma.js");
    vi.mocked(prisma.apiKey.findMany).mockResolvedValue(mockKeys as any);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ "?column?": 1 }]);
  });

  it("returns keys without key value", async () => {
    const res = await request(app).get("/api/v1/api-keys");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty("id");
    expect(res.body[0]).toHaveProperty("name");
    expect(res.body[0]).toHaveProperty("createdAt");
    // Key value must NOT be present
    expect(res.body[0]).not.toHaveProperty("key");
    expect(res.body[1]).not.toHaveProperty("key");
  });
});

describe("POST /api/v1/api-keys", () => {
  const app = createApp();

  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import("../middleware/prisma.js");
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ "?column?": 1 }]);
    vi.mocked(prisma.apiKey.create).mockResolvedValue({
      id: "new-key-id",
      name: "My New Key",
      key: FIXED_API_KEY,
      userId: "system",
      expiresAt: null,
      lastUsed: null,
      createdAt: new Date("2026-03-19T10:00:00Z"),
      updatedAt: new Date("2026-03-19T10:00:00Z"),
      deletedAt: null,
    } as any);
  });

  it("creates key with valid data and returns key value once", async () => {
    const res = await request(app)
      .post("/api/v1/api-keys")
      .send({ name: "My New Key" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("name", "My New Key");
    expect(res.body).toHaveProperty("key", FIXED_API_KEY);
    expect(res.body).toHaveProperty("createdAt");
  });

  it("rejects invalid/empty name", async () => {
    const res = await request(app)
      .post("/api/v1/api-keys")
      .send({ name: "" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("rejects missing name", async () => {
    const res = await request(app)
      .post("/api/v1/api-keys")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

describe("DELETE /api/v1/api-keys/:id", () => {
  const app = createApp();

  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import("../middleware/prisma.js");
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ "?column?": 1 }]);
  });

  it("soft deletes key", async () => {
    const { prisma } = await import("../middleware/prisma.js");
    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue({
      id: "key-1",
      name: "Production Key",
      key: "ak_somekey",
      userId: "system",
      expiresAt: null,
      lastUsed: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as any);
    vi.mocked(prisma.apiKey.update).mockResolvedValue({} as any);

    const res = await request(app).delete("/api/v1/api-keys/key-1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(prisma.apiKey.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "key-1" },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      })
    );
  });

  it("returns 404 for non-existent key", async () => {
    const { prisma } = await import("../middleware/prisma.js");
    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue(null);

    const res = await request(app).delete("/api/v1/api-keys/nonexistent");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});
