import { Router } from "express";
import { z } from "zod";
import { prisma } from "../middleware/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { generateApiKey } from "../middleware/api-key.js";
import { createAuditLog, getAuditUserId } from "../middleware/audit.js";

export const apiKeyRouter = Router();

if (process.env.AZURE_AD_TENANT_ID) {
  apiKeyRouter.use(requireAuth);
}

const createKeySchema = z.object({
  name: z.string().min(1).max(255),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

/**
 * @swagger
 * /api/v1/api-keys:
 *   get:
 *     summary: Eigene API Keys auflisten
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste der API Keys (ohne Key-Wert)
 */
apiKeyRouter.get("/", async (req, res, next) => {
  try {
    const userId = getAuditUserId(req);
    const keys = await prisma.apiKey.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        createdAt: true,
        expiresAt: true,
        lastUsed: true,
        // Key-Wert wird NICHT zurückgegeben
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(keys);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/api-keys:
 *   post:
 *     summary: Neuen API Key erstellen
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               expiresInDays:
 *                 type: integer
 *     responses:
 *       201:
 *         description: API Key erstellt (Key wird nur einmal angezeigt!)
 */
apiKeyRouter.post("/", async (req, res, next) => {
  try {
    const parsed = createKeySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validierungsfehler", details: parsed.error.flatten() });
      return;
    }

    const userId = getAuditUserId(req);
    const key = generateApiKey();
    const expiresAt = parsed.data.expiresInDays
      ? new Date(Date.now() + parsed.data.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const apiKey = await prisma.apiKey.create({
      data: {
        name: parsed.data.name,
        key,
        userId,
        expiresAt,
      },
    });

    await createAuditLog({
      action: "CREATE",
      entity: "ApiKey",
      entityId: apiKey.id,
      userId,
      newValue: { name: apiKey.name },
    });

    // Key wird nur bei Erstellung zurückgegeben
    res.status(201).json({
      id: apiKey.id,
      name: apiKey.name,
      key, // Nur hier sichtbar!
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/api-keys/{id}:
 *   delete:
 *     summary: API Key widerrufen
 *     tags: [API Keys]
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
 *         description: API Key widerrufen
 */
apiKeyRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const userId = getAuditUserId(req);
    const key = await prisma.apiKey.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!key) {
      res.status(404).json({ error: "API Key nicht gefunden" });
      return;
    }

    await prisma.apiKey.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await createAuditLog({
      action: "DELETE",
      entity: "ApiKey",
      entityId: key.id,
      userId,
      oldValue: { name: key.name },
    });

    res.json({ message: "API Key widerrufen" });
  } catch (error) {
    next(error);
  }
});
