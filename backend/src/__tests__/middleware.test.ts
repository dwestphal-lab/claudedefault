import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

// Mock logger to avoid side effects
vi.mock("../config/logger.js", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock env for error-handler tests
vi.mock("../config/env.js", () => ({
  env: {
    NODE_ENV: "development",
    PORT: 4000,
    DATABASE_URL: "postgresql://app:secret@localhost:5432/appdb",
    CORS_ORIGIN: "http://localhost:3000",
  },
}));

// Mock prisma (needed by audit.ts)
vi.mock("../middleware/prisma.js", () => ({
  prisma: {
    auditLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
  disconnectPrisma: vi.fn(),
}));

function mockRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    ...overrides,
  } as unknown as Request;
}

function mockResponse(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function mockNext(): NextFunction {
  return vi.fn() as unknown as NextFunction;
}

describe("errorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 500 with generic message in production", async () => {
    // Override env to production for this test
    const envModule = await import("../config/env.js");
    const originalEnv = envModule.env.NODE_ENV;
    (envModule.env as any).NODE_ENV = "production";

    const { errorHandler } = await import("../middleware/error-handler.js");

    const err = new Error("Sensitive internal error details");
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Interner Serverfehler",
      })
    );
    // Stack should NOT be included in production
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(jsonArg).not.toHaveProperty("stack");

    // Restore
    (envModule.env as any).NODE_ENV = originalEnv;
  });

  it("includes stack in development", async () => {
    const envModule = await import("../config/env.js");
    (envModule.env as any).NODE_ENV = "development";

    const { errorHandler } = await import("../middleware/error-handler.js");

    const err = new Error("Something broke");
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(jsonArg.error).toBe("Something broke");
    expect(jsonArg).toHaveProperty("stack");
  });

  it("uses error status code if provided", async () => {
    const envModule = await import("../config/env.js");
    (envModule.env as any).NODE_ENV = "development";

    const { errorHandler } = await import("../middleware/error-handler.js");

    const err: any = new Error("Not Found");
    err.status = 404;
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("requireRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if no auth", async () => {
    const { requireRole } = await import("../middleware/rbac.js");
    const middleware = requireRole("ADMIN");

    const req = mockRequest(); // no auth
    const res = mockResponse();
    const next = mockNext();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 if wrong role", async () => {
    const { requireRole } = await import("../middleware/rbac.js");
    const middleware = requireRole("ADMIN");

    const req = mockRequest();
    (req as any).auth = { userId: "user-1", roles: ["USER"] };
    const res = mockResponse();
    const next = mockNext();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() if correct role", async () => {
    const { requireRole } = await import("../middleware/rbac.js");
    const middleware = requireRole("ADMIN");

    const req = mockRequest();
    (req as any).auth = { userId: "admin-1", roles: ["ADMIN"] };
    const res = mockResponse();
    const next = mockNext();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("calls next() when user has one of multiple accepted roles", async () => {
    const { requireRole } = await import("../middleware/rbac.js");
    const middleware = requireRole("ADMIN", "USER");

    const req = mockRequest();
    (req as any).auth = { userId: "user-1", roles: ["USER"] };
    const res = mockResponse();
    const next = mockNext();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

describe("getAuditUserId", () => {
  it("returns userId from auth", async () => {
    const { getAuditUserId } = await import("../middleware/audit.js");

    const req = mockRequest();
    (req as any).auth = { userId: "user-123", roles: ["USER"] };

    const result = getAuditUserId(req);
    expect(result).toBe("user-123");
  });

  it('returns "system" fallback when no auth', async () => {
    const { getAuditUserId } = await import("../middleware/audit.js");

    const req = mockRequest(); // no auth
    const result = getAuditUserId(req);
    expect(result).toBe("system");
  });

  it('returns "system" when auth has no userId', async () => {
    const { getAuditUserId } = await import("../middleware/audit.js");

    const req = mockRequest();
    (req as any).auth = { userId: "", roles: [] };

    const result = getAuditUserId(req);
    expect(result).toBe("system");
  });
});
