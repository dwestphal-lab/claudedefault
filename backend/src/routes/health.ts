import { Router } from "express";
import { prisma } from "../middleware/prisma.js";
import { getRedis } from "../config/redis.js";
import { logger } from "../config/logger.js";

export const healthRouter = Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health-Check
 *     description: Prüft ob Backend, Datenbank und Redis erreichbar sind
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System OK
 *       503:
 *         description: Service nicht erreichbar
 */
healthRouter.get("/", async (_req, res) => {
  let dbStatus = "disconnected";
  let redisStatus = "disabled";

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (error) {
    logger.error({ error }, "Health check: DB nicht erreichbar");
  }

  const redis = getRedis();
  if (redis) {
    try {
      await redis.ping();
      redisStatus = "connected";
    } catch {
      redisStatus = "disconnected";
    }
  }

  const ok = dbStatus === "connected";
  res.status(ok ? 200 : 503).json({
    status: ok ? "ok" : "error",
    db: dbStatus,
    redis: redisStatus,
    version: "1.1.0",
  });
});
