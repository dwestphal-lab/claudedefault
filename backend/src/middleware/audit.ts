import { prisma } from "./prisma.js";
import { logger } from "../config/logger.js";
import type { AuthenticatedRequest } from "./auth.js";

interface AuditParams {
  action: "CREATE" | "UPDATE" | "DELETE";
  entity: string;
  entityId: string;
  userId: string;
  oldValue?: unknown;
  newValue?: unknown;
}

export async function createAuditLog(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        userId: params.userId,
        oldValue: params.oldValue ? JSON.parse(JSON.stringify(params.oldValue)) : undefined,
        newValue: params.newValue ? JSON.parse(JSON.stringify(params.newValue)) : undefined,
      },
    });
  } catch (error) {
    logger.error({ error, params }, "Audit log creation failed");
  }
}

/**
 * Helper: User-ID aus Request extrahieren (Auth oder Fallback "system")
 */
export function getAuditUserId(req: any): string {
  const auth = req.auth as AuthenticatedRequest | undefined;
  return auth?.userId || "system";
}
