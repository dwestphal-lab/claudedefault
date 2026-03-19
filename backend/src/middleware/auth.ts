import { type RequestHandler } from "express";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

// jose is ESM-only — use dynamic import and cache the module
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let joseModule: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let jwks: any = null;

async function loadJose() {
  if (!joseModule) {
    joseModule = await import("jose");
  }
  return joseModule;
}

async function getJwks() {
  if (!jwks) {
    const tenantId = env.AZURE_AD_TENANT_ID;
    if (!tenantId) {
      throw new Error("AZURE_AD_TENANT_ID is not configured");
    }
    const jose = await loadJose();
    jwks = jose.createRemoteJWKSet(
      new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`)
    );
  }
  return jwks;
}

export interface AuthenticatedRequest {
  userId: string;
  email?: string;
  name?: string;
  roles: string[];
}

/**
 * Middleware: Validiert Entra ID Bearer Token.
 * Setzt req.auth mit User-Infos.
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authorization header mit Bearer Token erforderlich" });
    return;
  }

  const token = header.slice(7);

  try {
    const jose = await loadJose();
    const { payload } = await jose.jwtVerify(token, await getJwks(), {
      issuer: `https://login.microsoftonline.com/${env.AZURE_AD_TENANT_ID}/v2.0`,
      audience: env.AZURE_AD_CLIENT_ID,
    });

    (req as any).auth = {
      userId: (payload.oid as string | undefined) || (payload.sub as string) || "",
      email: (payload.preferred_username as string | undefined) || (payload.email as string | undefined),
      name: payload.name as string | undefined,
      roles: (payload.roles as string[]) || [],
    } satisfies AuthenticatedRequest;

    next();
  } catch (error) {
    logger.warn({ error }, "Token validation failed");
    res.status(401).json({ error: "Ungültiges oder abgelaufenes Token" });
  }
};

/**
 * Middleware: Auth optional — setzt req.auth wenn Token vorhanden, blockiert aber nicht.
 */
export const optionalAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }

  try {
    const jose = await loadJose();
    const token = header.slice(7);
    const { payload } = await jose.jwtVerify(token, await getJwks(), {
      issuer: `https://login.microsoftonline.com/${env.AZURE_AD_TENANT_ID}/v2.0`,
      audience: env.AZURE_AD_CLIENT_ID,
    });

    (req as any).auth = {
      userId: (payload.oid as string | undefined) || (payload.sub as string) || "",
      email: (payload.preferred_username as string | undefined) || (payload.email as string | undefined),
      name: payload.name as string | undefined,
      roles: (payload.roles as string[]) || [],
    } satisfies AuthenticatedRequest;
  } catch {
    // Token ungültig — weiter ohne Auth
  }

  next();
};
