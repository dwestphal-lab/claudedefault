import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { apiKeyAuth } from "./middleware/api-key.js";
import { healthRouter } from "./routes/health.js";
import { userRouter } from "./routes/users.js";
import { auditRouter } from "./routes/audit.js";
import { fileRouter } from "./routes/files.js";
import { apiKeyRouter } from "./routes/api-keys.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(compression());
  app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
  app.use(express.json({ limit: "1mb" }));

  // API Key Auth (vor Routes, nach JSON parser)
  app.use(apiKeyAuth);

  // Swagger
  app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api/v1/docs.json", (_req, res) => res.json(swaggerSpec));

  // Routes
  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/users", userRouter);
  app.use("/api/v1/audit", auditRouter);
  app.use("/api/v1/files", fileRouter);
  app.use("/api/v1/api-keys", apiKeyRouter);

  // Backwards-compat redirects
  app.use("/api/docs", (_req, res) => res.redirect("/api/v1/docs"));
  app.use("/api/health", (_req, res) => res.redirect("/api/v1/health"));
  app.use("/api/users", (_req, res) => res.redirect("/api/v1/users"));

  // Error handler
  app.use(errorHandler);

  return app;
}
