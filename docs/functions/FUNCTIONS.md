# Funktionsdokumentation

## Backend

### Architektur

```
backend/src/
├── index.ts              # Server-Start, Logging, Graceful Shutdown
├── app.ts                # Express App Factory (testbar)
├── config/
│   ├── env.ts            # Zod Env-Validation (crasht bei fehlenden Vars)
│   ├── logger.ts         # Pino Logger (pretty in Dev, JSON in Prod)
│   ├── redis.ts          # Redis Cache (optional, graceful degradation)
│   ├── sentry.ts         # Sentry Error Tracking (optional)
│   └── swagger.ts        # OpenAPI/Swagger Konfiguration
├── middleware/
│   ├── auth.ts           # requireAuth + optionalAuth (Entra ID JWT)
│   ├── rbac.ts           # requireRole() — Rollen-basierte Zugriffskontrolle
│   ├── api-key.ts        # apiKeyAuth — X-API-Key als Auth-Alternative
│   ├── audit.ts          # createAuditLog() + getAuditUserId()
│   ├── error-handler.ts  # Zentrales Error-Handling
│   └── prisma.ts         # Prisma Singleton + Disconnect
├── routes/
│   ├── health.ts         # GET /api/v1/health
│   ├── users.ts          # CRUD /api/v1/users (Rate Limited, Paginiert)
│   ├── files.ts          # Upload/Download /api/v1/files
│   ├── audit.ts          # GET /api/v1/audit (Admin, filterbar)
│   └── api-keys.ts       # CRUD /api/v1/api-keys
└── __tests__/
    ├── health.test.ts
    ├── users.test.ts
    ├── files.test.ts
    ├── audit.test.ts
    ├── api-keys.test.ts
    └── middleware.test.ts
```

### Middleware-Reihenfolge

1. `pino-http` — Request-Logging
2. `helmet` — Security Headers
3. `compression` — gzip/brotli
4. `cors` — CORS (konfiguriert via CORS_ORIGIN)
5. `express.json` — Body Parser (max 1MB)
6. `apiKeyAuth` — X-API-Key Header prüfen
7. Routes (mit optionalem `requireAuth` + `requireRole`)
8. `errorHandler` — Zentraler Error-Handler

### Neue Route erstellen

1. Datei unter `backend/src/routes/<name>.ts` anlegen
2. Router mit Swagger JSDoc Kommentare erstellen
3. Zod Schema für Request-Validierung
4. Rate Limiting hinzufügen wenn nötig
5. `requireAuth` / `requireRole` Middleware wenn Auth nötig
6. Pagination für Listen-Endpoints (limit/offset)
7. `createAuditLog()` bei CREATE/UPDATE/DELETE aufrufen
8. Alle Fehler via `next(error)` an Error-Handler weiterleiten
9. Route in `backend/src/app.ts` einbinden
10. Test in `backend/src/__tests__/` erstellen
11. PowerShell Script unter `scripts/` erstellen
12. Docs aktualisieren

### Auth-Fluss

```
Request → apiKeyAuth → requireAuth → requireRole → Route Handler
                ↓             ↓            ↓
          X-API-Key?    Bearer Token?   Rolle ok?
          → req.auth    → req.auth     → 403 wenn nicht
```

Wenn `AZURE_AD_TENANT_ID` nicht gesetzt ist, werden Auth-Middlewares übersprungen (Development-Modus).

### Env-Validation

Beim Start validiert `config/env.ts` alle erforderlichen Variablen mit Zod. Fehlt eine Variable, loggt das Backend die Fehler und beendet sich mit Exit Code 1.

### Redis Cache

`config/redis.ts` bietet `cacheGet<T>()`, `cacheSet()`, `cacheDel()`. Funktioniert auch ohne Redis — gibt dann `null` zurück (graceful degradation). Aktivierung via `REDIS_URL` in `.env`.

## Frontend

### Architektur

```
frontend/src/
├── middleware.ts           # Auth-Schutz für alle Routen (außer /login)
├── i18n/
│   └── request.ts          # next-intl Konfiguration
├── lib/
│   ├── auth.ts             # NextAuth v5 mit Entra ID
│   ├── api.ts              # API Client mit Auth-Header + Error-Handling
│   ├── env.ts              # Zod Frontend Env-Validation
│   ├── hooks/
│   │   └── use-users.ts    # React Query Hooks
│   └── utils.ts            # cn() für Tailwind class merging
├── types/
│   └── next-auth.d.ts      # Typ-Erweiterung für Session.accessToken
├── components/
│   ├── ui/                  # shadcn/ui Komponenten
│   └── layout/              # Header, Sidebar, Theme/Language Toggle
├── messages/
│   ├── de.json              # Deutsche Übersetzungen
│   └── en.json              # Englische Übersetzungen
└── app/
    ├── layout.tsx           # Root Layout + Tailwind + Providers
    ├── error.tsx            # Global Error Boundary
    ├── not-found.tsx        # 404 Seite
    ├── (auth)/
    │   └── login/page.tsx   # Login Seite (öffentlich)
    └── (dashboard)/
        ├── layout.tsx       # Sidebar + Header Layout
        ├── page.tsx         # Dashboard
        ├── users/page.tsx   # Benutzer
        ├── files/page.tsx   # Dateien
        ├── audit/page.tsx   # Audit Log
        └── settings/page.tsx# Einstellungen
```

### Neue Seite erstellen

1. Verzeichnis unter `frontend/src/app/(dashboard)/<route>/` anlegen
2. `page.tsx` erstellen (Server Component by default)
3. Seite ist automatisch auth-geschützt (via middleware.ts)
4. i18n-Keys in `messages/de.json` + `messages/en.json` ergänzen
5. Für öffentliche Seiten: Pfad in `middleware.ts` Matcher ausschließen

## Docker

### Architektur (Production)

```
Nginx (:80)
├── /api/auth/*  → Frontend (:3000)  [Rate Limit: 10r/m]
├── /api/v1/files → Backend (:4000)  [Rate Limit: 30r/m, 50MB Upload]
├── /api/*       → Backend (:4000)   [Rate Limit: 60r/s]
└── /*           → Frontend (:3000)

Backend → PostgreSQL (:5432) + Redis (optional)
```

### Security Headers (Nginx)

- Content-Security-Policy (CSP)
- Permissions-Policy
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Server-Tokens: off

### Container Healthchecks

- **DB:** `pg_isready` alle 5s
- **Backend:** `wget /api/v1/health` alle 30s
- **Frontend:** `wget /` alle 30s
- **Nginx:** `wget /api/v1/health` alle 30s (durchgehender Check)
