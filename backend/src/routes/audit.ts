import { Router } from "express";
import { z } from "zod";
import { prisma } from "../middleware/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

export const auditRouter = Router();

if (process.env.AZURE_AD_TENANT_ID) {
  auditRouter.use(requireAuth);
  auditRouter.use(requireRole("ADMIN"));
}

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  entity: z.enum(["User", "File", "ApiKey"]).optional(),
  action: z.enum(["CREATE", "UPDATE", "DELETE"]).optional(),
  userId: z.string().optional(),
});

/**
 * @swagger
 * /api/v1/audit:
 *   get:
 *     summary: Audit Log abrufen (paginiert, filterbar)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *         description: Filter nach Entity (User, File, etc.)
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginiertes Audit Log
 */
auditRouter.get("/", async (req, res, next) => {
  try {
    const { limit, offset, entity, action, userId } = querySchema.parse(req.query);

    const where: any = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ data, total, limit, offset });
  } catch (error) {
    next(error);
  }
});
