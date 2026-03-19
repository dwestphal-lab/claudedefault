import { initSentry } from "./config/sentry.js";
initSentry();

import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { disconnectPrisma } from "./middleware/prisma.js";
import { disconnectRedis } from "./config/redis.js";
import { createApp } from "./app.js";

const app = createApp();

app.use(pinoHttp({ logger }));

const server = app.listen(env.PORT, () => {
  logger.info(`Backend running on http://localhost:${env.PORT}`);
  logger.info(`API Docs:  http://localhost:${env.PORT}/api/v1/docs`);
});

async function shutdown(signal: string) {
  logger.info(`${signal} received — shutting down`);
  server.close(async () => {
    await disconnectRedis();
    await disconnectPrisma();
    process.exit(0);
  });
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
