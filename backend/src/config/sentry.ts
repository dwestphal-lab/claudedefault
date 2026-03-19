import * as Sentry from "@sentry/node";
import { logger } from "./logger.js";

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info("SENTRY_DSN nicht gesetzt — Error Tracking deaktiviert");
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
  });

  logger.info("Sentry initialisiert");
}

export { Sentry };
