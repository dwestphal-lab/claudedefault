import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../middleware/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { createAuditLog, getAuditUserId } from "../middleware/audit.js";

export const userRouter = Router();

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Zu viele Anfragen — bitte warten" },
});

userRouter.use(apiLimiter);

if (process.env.AZURE_AD_TENANT_ID) {
  userRouter.use(requireAuth);
}

const createUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().max(255).optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
});

const updateUserSchema = z.object({
  name: z.string().max(255).optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
});

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Alle Benutzer abrufen (paginiert)
 *     tags: [Users]
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
 *     responses:
 *       200:
 *         description: Paginierte Liste der Benutzer
 */
userRouter.get("/", async (req, res, next) => {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where: { deletedAt: null },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where: { deletedAt: null } }),
    ]);
    res.json({ data, total, limit, offset });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Einzelnen Benutzer abrufen
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Benutzer gefunden
 *       404:
 *         description: Benutzer nicht gefunden
 */
userRouter.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) {
      res.status(404).json({ error: "Benutzer nicht gefunden" });
      return;
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Neuen Benutzer anlegen
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, USER]
 *     responses:
 *       201:
 *         description: Benutzer erstellt
 *       400:
 *         description: Validierungsfehler
 *       409:
 *         description: E-Mail bereits vergeben
 */
userRouter.post("/", ...(process.env.AZURE_AD_TENANT_ID ? [requireRole("ADMIN")] : []), async (req, res, next) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validierungsfehler", details: parsed.error.flatten() });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      res.status(409).json({ error: "E-Mail bereits vergeben" });
      return;
    }

    const user = await prisma.user.create({ data: parsed.data });
    await createAuditLog({ action: "CREATE", entity: "User", entityId: user.id, userId: getAuditUserId(req), newValue: user });
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Benutzer aktualisieren (nur Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, USER]
 *     responses:
 *       200:
 *         description: Benutzer aktualisiert
 *       404:
 *         description: Benutzer nicht gefunden
 */
userRouter.put("/:id", ...(process.env.AZURE_AD_TENANT_ID ? [requireRole("ADMIN")] : []), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validierungsfehler", details: parsed.error.flatten() });
      return;
    }

    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      res.status(404).json({ error: "Benutzer nicht gefunden" });
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: parsed.data,
    });
    await createAuditLog({ action: "UPDATE", entity: "User", entityId: user.id, userId: getAuditUserId(req), oldValue: existing, newValue: user });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Benutzer löschen / Soft Delete (nur Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Benutzer gelöscht
 *       404:
 *         description: Benutzer nicht gefunden
 */
userRouter.delete("/:id", ...(process.env.AZURE_AD_TENANT_ID ? [requireRole("ADMIN")] : []), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      res.status(404).json({ error: "Benutzer nicht gefunden" });
      return;
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await createAuditLog({ action: "DELETE", entity: "User", entityId: id, userId: getAuditUserId(req), oldValue: existing });
    res.json({ message: "Benutzer gelöscht" });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         name:
 *           type: string
 *           nullable: true
 *         role:
 *           type: string
 *           enum: [ADMIN, USER]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 */
