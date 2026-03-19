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

// Mock audit functions (used by file routes)
vi.mock("../middleware/audit.js", () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
  getAuditUserId: vi.fn().mockReturnValue("system"),
}));

const mockFiles = [
  {
    id: "file-1",
    name: "document.pdf",
    path: "1710000000-123456789.pdf",
    mimeType: "application/pdf",
    size: 102400,
    userId: "system",
    createdAt: new Date("2026-01-20T10:00:00Z"),
    updatedAt: new Date("2026-01-20T10:00:00Z"),
    deletedAt: null,
    user: { id: "system", name: "System", email: "system@example.com" },
  },
  {
    id: "file-2",
    name: "image.png",
    path: "1710000001-987654321.png",
    mimeType: "image/png",
    size: 204800,
    userId: "system",
    createdAt: new Date("2026-02-10T10:00:00Z"),
    updatedAt: new Date("2026-02-10T10:00:00Z"),
    deletedAt: null,
    user: { id: "system", name: "System", email: "system@example.com" },
  },
];

describe("GET /api/v1/files", () => {
  const app = createApp();

  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import("../middleware/prisma.js");
    vi.mocked(prisma.file.findMany).mockResolvedValue(mockFiles as any);
    vi.mocked(prisma.file.count).mockResolvedValue(mockFiles.length);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ "?column?": 1 }]);
  });

  it("returns paginated file list", async () => {
    const res = await request(app).get("/api/v1/files");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("limit");
    expect(res.body).toHaveProperty("offset");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBe(2);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toHaveProperty("name");
    expect(res.body.data[0]).toHaveProperty("mimeType");
    expect(res.body.data[0]).toHaveProperty("size");
  });

  it("respects pagination params", async () => {
    const { prisma } = await import("../middleware/prisma.js");
    vi.mocked(prisma.file.findMany).mockResolvedValue([mockFiles[0]] as any);
    vi.mocked(prisma.file.count).mockResolvedValue(2);

    const res = await request(app).get("/api/v1/files?limit=1&offset=0");

    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(1);
    expect(res.body.offset).toBe(0);
    expect(prisma.file.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 1,
        skip: 0,
      })
    );
  });
});

describe("POST /api/v1/files", () => {
  const app = createApp();

  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import("../middleware/prisma.js");
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ "?column?": 1 }]);
  });

  it("returns 400 if no file uploaded", async () => {
    const res = await request(app)
      .post("/api/v1/files");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

describe("DELETE /api/v1/files/:id", () => {
  const app = createApp();

  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import("../middleware/prisma.js");
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ "?column?": 1 }]);
  });

  it("returns 404 for non-existent file", async () => {
    const { prisma } = await import("../middleware/prisma.js");
    vi.mocked(prisma.file.findFirst).mockResolvedValue(null);

    const res = await request(app).delete("/api/v1/files/nonexistent");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("soft deletes an existing file", async () => {
    const { prisma } = await import("../middleware/prisma.js");
    vi.mocked(prisma.file.findFirst).mockResolvedValue({
      id: "file-1",
      name: "document.pdf",
      path: "1710000000-123456789.pdf",
      mimeType: "application/pdf",
      size: 102400,
      userId: "system",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as any);
    vi.mocked(prisma.file.update).mockResolvedValue({} as any);

    const res = await request(app).delete("/api/v1/files/file-1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(prisma.file.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "file-1" },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      })
    );
  });
});
