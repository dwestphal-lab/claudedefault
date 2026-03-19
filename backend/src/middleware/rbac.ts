import { type RequestHandler } from "express";
import type { AuthenticatedRequest } from "./auth.js";

/**
 * Middleware: Prüft ob der User eine bestimmte Rolle hat.
 * Muss NACH requireAuth verwendet werden.
 *
 * Beispiel: router.get("/admin", requireAuth, requireRole("ADMIN"), handler)
 */
export function requireRole(...roles: string[]): RequestHandler {
  return (req, res, next) => {
    const auth = (req as any).auth as AuthenticatedRequest | undefined;

    if (!auth) {
      res.status(401).json({ error: "Nicht authentifiziert" });
      return;
    }

    // Rolle aus dem JWT-Token oder aus den Entra ID Rollen
    const userRoles = auth.roles || [];

    // Auch die app-interne Rolle prüfen (aus DB, falls im Token vorhanden)
    const hasRole = roles.some(
      (role) => userRoles.includes(role) || userRoles.includes(role.toLowerCase())
    );

    if (!hasRole) {
      res.status(403).json({ error: "Keine Berechtigung für diese Aktion" });
      return;
    }

    next();
  };
}
