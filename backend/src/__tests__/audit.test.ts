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

const mockAuditLogs = [
  {
    id: "audit-1",
    action: "CREATE",
    entity: "User",
    entityId: "user-1",
    oldValue: null,
    newValue: { name: "Test User", email: "test@example.com" },
    userId: "system",
    createdAt: new Date("2026-01-15T10:00:00Z"),
    user: { id: "system", name: "System", email: "system@example.com" },
  },
  {
    id: "audit-2",
    action: "UPDATE",
    entity: "User",
    entityId: "user-1",
    oldValue: { name: "Test User" },
    newValue: { name: "Updated User" },
    userId: "admin-1",
    createdAt: new Date("2026-01-16T10:00:00Z"),
    user: { id: "admin-1", name: "Admin", email: "admin@example.com" },
  },
  {
    id: "audit-3",
    action: "DELETE",
    entity: "File",
    entityId: "file-1",
    oldValue: { name: "document.pdf" },
    newValue: null,
    userId: "admin-1",
    createdAt: new Date("2026-01-17T10:00:00Z"),
    user: { id: "admin-1", name: "Admin", email: "admin@example.com" },
  },
];

describe("GET /api/v1/audit", () => {
  const app = createApp();

  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import("../middleware/prisma.js");
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockAuditLogs as any);
    vi.mocked(prisma.auditLog.count).mockResolvedValue(mockAuditLogs.length);
    // Keep health check working
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ "?column?": 1 }]);
  });

  it("returns paginated audit logs", async () => {
    const res = await request(app).get("/api/v1/audit");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("limit");
    expect(res.body).toHaveProperty("offset");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBe(3);
    expect(res.body.data).toHaveLength(3);
  });

  it("respects pagination params (limit, offset)", async () => {
    const { prisma } = await import("../middleware/prisma.js");
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([mockAuditLogs[1]] as any);
    vi.mocked(prisma.auditLog.count).mockResolvedValue(3);

    const res = await request(app).get("/api/v1/audit?limit=1&offset=1");

    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(1);
    expect(res.body.offset).toBe(1);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 1,
        skip: 1,
      })
    );
  });

  it("filters by entity", async () => {
    const { prisma } = await import("../middleware/prisma.js");
    const fileLog = mockAuditLogs.filter((l) => l.entity === "File");
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue(fileLog as any);
    vi.mocked(prisma.auditLog.count).mockResolvedValue(fileLog.length);

    const res = await request(app).get("/api/v1/audit?entity=File");

    expect(res.status).toBe(200);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ entity: "File" }),
      })
    );
  });

  it("filters by action", async () => {
    const { prisma } = await import("../middleware/prisma.js");
    const createLogs = mockAuditLogs.filter((l) => l.action === "CREATE");
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue(createLogs as any);
    vi.mocked(prisma.auditLog.count).mockResolvedValue(createLogs.length);

    const res = await request(app).get("/api/v1/audit?action=CREATE");

    expect(res.status).toBe(200);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ action: "CREATE" }),
      })
    );
  });

  it("filters by userId", async () => {
    const { prisma } = await import("../middleware/prisma.js");
    const adminLogs = mockAuditLogs.filter((l) => l.userId === "admin-1");
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue(adminLogs as any);
    vi.mocked(prisma.auditLog.count).mockResolvedValue(adminLogs.length);

    const res = await request(app).get("/api/v1/audit?userId=admin-1");

    expect(res.status).toBe(200);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "admin-1" }),
      })
    );
  });

  it("includes user info in response", async () => {
    const res = await request(app).get("/api/v1/audit");

    expect(res.status).toBe(200);
    const entry = res.body.data[0];
    expect(entry).toHaveProperty("user");
    expect(entry.user).toHaveProperty("id");
    expect(entry.user).toHaveProperty("name");
    expect(entry.user).toHaveProperty("email");
  });
});
