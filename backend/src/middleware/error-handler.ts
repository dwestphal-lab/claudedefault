import type { ErrorRequestHandler } from "express";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error({ err }, "Unhandled error");

  const status = err.status || err.statusCode || 500;
  const message = env.NODE_ENV === "production" ? "Interner Serverfehler" : err.message;

  res.status(status).json({
    error: message,
    ...(env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};
