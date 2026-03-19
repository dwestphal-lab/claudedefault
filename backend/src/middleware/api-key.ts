import { type RequestHandler } from "express";
import crypto from "crypto";
import { prisma } from "./prisma.js";
import { logger } from "../config/logger.js";
import type { AuthenticatedRequest } from "./auth.js";

/**
 * Generiert einen zufälligen API Key.
 */
export function generateApiKey(): string {
  return `ak_${crypto.randomBytes(32).toString("hex")}`;
}

/**
 * Middleware: Akzeptiert X-API-Key Header als Alternative zu Bearer Token.
 * Prüft ob der Key gültig und nicht abgelaufen ist.
 * Setzt req.auth mit User-Infos des Key-Owners.
 */
export const apiKeyAuth: RequestHandler = async (req, _res, next) => {
  // Wenn bereits via Bearer Token authentifiziert, überspringen
  if ((req as any).auth) {
    next();
    return;
  }

  const apiKey = req.headers["x-api-key"] as string | undefined;
  if (!apiKey) {
    next();
    return;
  }

  try {
    const key = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: true },
    });

    if (!key || key.deletedAt) {
      next();
      return;
    }

    if (key.expiresAt && key.expiresAt < new Date()) {
      next();
      return;
    }

    // lastUsed aktualisieren (async, blockiert nicht)
    prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsed: new Date() },
    }).catch(() => {});

    (req as any).auth = {
      userId: key.user.id,
      email: key.user.email,
      name: key.user.name ?? undefined,
      roles: [key.user.role],
    } satisfies AuthenticatedRequest;

    next();
  } catch (error) {
    logger.error({ error }, "API key validation failed");
    next();
  }
};
