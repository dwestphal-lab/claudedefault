import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../middleware/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { createAuditLog, getAuditUserId } from "../middleware/audit.js";

export const fileRouter = Router();

if (process.env.AZURE_AD_TENANT_ID) {
  fileRouter.use(requireAuth);
}

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve("../data/uploads");

// Sicherstellen dass Upload-Verzeichnis existiert
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIMES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "text/plain", "text/csv",
  "application/json",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Dateityp ${file.mimetype} nicht erlaubt`));
    }
  },
});

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * @swagger
 * /api/v1/files:
 *   get:
 *     summary: Alle Dateien abrufen (paginiert)
 *     tags: [Files]
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
 *         description: Paginierte Dateiliste
 */
fileRouter.get("/", async (req, res, next) => {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    const [data, total] = await Promise.all([
      prisma.file.findMany({
        where: { deletedAt: null },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.file.count({ where: { deletedAt: null } }),
    ]);
    res.json({ data, total, limit, offset });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/files:
 *   post:
 *     summary: Datei hochladen
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Datei hochgeladen
 *       400:
 *         description: Keine Datei oder ungültiger Typ
 */
fileRouter.post("/", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Keine Datei hochgeladen" });
      return;
    }

    const userId = getAuditUserId(req);
    const file = await prisma.file.create({
      data: {
        name: req.file.originalname,
        path: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        userId,
      },
    });

    await createAuditLog({
      action: "CREATE",
      entity: "File",
      entityId: file.id,
      userId,
      newValue: { name: file.name, mimeType: file.mimeType, size: file.size },
    });

    res.status(201).json(file);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/files/{id}/download:
 *   get:
 *     summary: Datei herunterladen
 *     tags: [Files]
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
 *         description: Datei-Download
 *       404:
 *         description: Datei nicht gefunden
 */
fileRouter.get("/:id/download", async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const file = await prisma.file.findFirst({
      where: { id, deletedAt: null },
    });
    if (!file) {
      res.status(404).json({ error: "Datei nicht gefunden" });
      return;
    }

    // Ownership check: nur eigene Dateien oder Admin
    const auth = (req as any).auth;
    if (auth && file.userId && auth.userId !== file.userId) {
      const user = await prisma.user.findUnique({ where: { id: auth.userId } });
      if (!user || user.role !== "ADMIN") {
        res.status(403).json({ error: "Keine Berechtigung" });
        return;
      }
    }

    const filePath = path.resolve(UPLOAD_DIR, path.basename(file.path));
    if (!filePath.startsWith(path.resolve(UPLOAD_DIR)) || !fs.existsSync(filePath)) {
      res.status(404).json({ error: "Datei auf dem Server nicht gefunden" });
      return;
    }

    res.download(filePath, file.name);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/files/{id}:
 *   delete:
 *     summary: Datei löschen (Soft Delete)
 *     tags: [Files]
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
 *         description: Datei gelöscht
 *       404:
 *         description: Datei nicht gefunden
 */
fileRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const file = await prisma.file.findFirst({
      where: { id, deletedAt: null },
    });
    if (!file) {
      res.status(404).json({ error: "Datei nicht gefunden" });
      return;
    }

    // Ownership check: nur eigene Dateien oder Admin
    const auth = (req as any).auth;
    if (auth && file.userId && auth.userId !== file.userId) {
      const user = await prisma.user.findUnique({ where: { id: auth.userId } });
      if (!user || user.role !== "ADMIN") {
        res.status(403).json({ error: "Keine Berechtigung" });
        return;
      }
    }

    await prisma.file.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await createAuditLog({
      action: "DELETE",
      entity: "File",
      entityId: file.id,
      userId: getAuditUserId(req),
      oldValue: { name: file.name },
    });

    res.json({ message: "Datei gelöscht" });
  } catch (error) {
    next(error);
  }
});
