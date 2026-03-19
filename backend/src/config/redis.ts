import Redis from "ioredis";
import { logger } from "./logger.js";

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.REDIS_URL;
  if (!url) {
    logger.info("REDIS_URL nicht gesetzt — Cache deaktiviert");
    return null;
  }

  redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  redis.on("connect", () => logger.info("Redis connected"));
  redis.on("error", (err) => logger.error({ err }, "Redis error"));

  redis.connect().catch(() => {
    logger.warn("Redis nicht erreichbar — Cache deaktiviert");
    redis = null;
  });

  return redis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;

  try {
    const val = await r.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
  const r = getRedis();
  if (!r) return;

  try {
    await r.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Cache-Fehler ignorieren
  }
}

export async function cacheDel(pattern: string): Promise<void> {
  const r = getRedis();
  if (!r) return;

  try {
    const keys = await r.keys(pattern);
    if (keys.length > 0) await r.del(...keys);
  } catch {
    // Cache-Fehler ignorieren
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    logger.info("Redis disconnected");
  }
}
