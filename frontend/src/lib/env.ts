import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

const serverEnvSchema = z.object({
  BACKEND_URL: z.string().default("http://localhost:4000"),
  NEXTAUTH_URL: z.string().default("http://localhost:3000"),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  AZURE_AD_CLIENT_ID: z.string().optional(),
  AZURE_AD_CLIENT_SECRET: z.string().optional(),
  AZURE_AD_TENANT_ID: z.string().optional(),
});

// Client-side env (NEXT_PUBLIC_*)
export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

// Server-side env (nur in Server Components / Route Handlers)
export function getServerEnv() {
  return serverEnvSchema.parse(process.env);
}
