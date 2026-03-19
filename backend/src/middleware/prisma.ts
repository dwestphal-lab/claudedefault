import { PrismaClient } from "@prisma/client";
import { logger } from "../config/logger.js";

export const prisma = new PrismaClient();

export async function disconnectPrisma() {
  await prisma.$disconnect();
  logger.info("Prisma disconnected");
}
