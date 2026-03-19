# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Entwicklungs-Workflow (WICHTIG)

Bei jeder Aufgabe diesen Workflow einhalten — keine Ausnahmen:

### 1. Planung (VOR dem Coding)
- Aufgabe analysieren und Rückfragen stellen
- Lösungsvorschlag mit Verbesserungsvorschlägen präsentieren
- **Coding beginnt ERST nach expliziter Freigabe durch den User**

### 2. Coding
- Umsetzung nach abgestimmtem Plan

### 3. Review (automatisch NACH dem Coding)
- Code Review: Qualität, Patterns, Best Practices prüfen
- Security Check: OWASP, Injection, Auth-Lücken prüfen
- Gefundene Probleme direkt fixen

### 4. Dokumentation
- CHANGELOG.md aktualisieren

### 5. Lokal starten
- Änderungen automatisch lokal starten und verifizieren

### 6. Git (NACH Freigabe)
- User muss Änderungen explizit freigeben
- Commit + Push zu GitHub
- GitHub Repo wird beim Projektstart abgefragt falls nicht bekannt

## Tech Stack

- **Frontend:** Next.js 15 (React 19, App Router, Tailwind CSS v4, shadcn/ui, next-themes, sonner, next-intl)
- **Backend:** Express 5 + TypeScript mit Pino Logging, Swagger API-Docs, Sentry
- **ORM:** Prisma mit PostgreSQL 17 (Soft Deletes, Audit Logging)
- **Auth:** Microsoft Entra ID SSO (NextAuth v5) + API Keys (X-API-Key Header)
- **Cache:** Redis (optional, via Docker Profile)
- **Validation:** Zod (Backend Requests + Env-Validation + Frontend Env)
- **Testing:** Vitest + Supertest (Backend), Playwright (E2E)
- **i18n:** next-intl (Deutsch/Englisch)
- **Runtime:** Node.js 22
- **Containerization:** Docker Multi-Stage + Nginx Reverse Proxy

## Architecture

Monorepo: Root `package.json` (Scripts, Husky), `backend/`, `frontend/`, `e2e/`.

### Backend (`backend/`)
- **App Factory:** `app.ts` (testbar) vs `index.ts` (Server-Start, Logging, Shutdown)
- **Middleware-Kette:** pinoHttp → helmet → compression → cors → json → apiKeyAuth → routes → errorHandler
- **Auth:** `requireAuth` (JWT), `optionalAuth`, `requireRole("ADMIN")`, `apiKeyAuth` (X-API-Key)
- **Audit:** `createAuditLog()` wird in allen CUD-Operationen aufgerufen
- **Cache:** `config/redis.ts` — cacheGet/cacheSet/cacheDel, funktioniert auch ohne Redis (graceful degradation)
- **Env-Validation:** `config/env.ts` — Zod crasht sofort bei fehlenden Variablen

### Frontend (`frontend/`)
- **Route Groups:** `(dashboard)/` (Sidebar + Header Layout), `(auth)/` (Login)
- **Auth:** middleware.ts schützt alle Routen außer `/login`
- **API Client:** `lib/api.ts` mit Auth-Header-Injection, Error-Handling, 401→Login-Redirect
- **Data Fetching:** React Query Hooks in `lib/hooks/`
- **i18n:** `messages/de.json` + `messages/en.json`, Locale via Cookie

### Docker (Production)
```
Nginx (:80)
├── /api/* → Backend (:4000)
└── /*    → Frontend (:3000)

Backend → PostgreSQL + Redis (optional)
```

### Daten auf Host
- `./data/postgres/` — DB (Bind-Mount)
- `./data/uploads/` — Datei-Uploads (Bind-Mount)
- `./data/backups/` — DB-Backups

## Commands

```bash
# Projekt initialisieren (Ports konfigurieren + .env generieren)
npm run init                                    # Standard-Ports (80/4000/3000/5432)
.\scripts\Init-Project.ps1 -AppPort 8080 -BackendPort 4001 -FrontendPort 3001 -DbPort 5433

# Root
npm run dev:all            # DB + Backend + Frontend parallel
npm run docker:up          # Full Docker Stack mit Nginx
npm run test               # Backend Tests

# Backend (cd backend)
npm run dev                # Dev Server (Port aus .env)
npm test                   # Vitest
npx prisma migrate dev     # Migration
npx prisma db seed         # Seed Data

# Frontend (cd frontend)
npm run dev                # Next.js Dev (Port aus .env)

# E2E (cd e2e)
npm test                   # Playwright Tests

# Docker mit Redis
docker compose --env-file .env --profile redis up --build
```

## Port-Konfiguration

Ports werden zentral in der Root `.env` konfiguriert (via `Init-Project.ps1`):

| Variable | Default | Beschreibung |
|---|---|---|
| `APP_PORT` | 80 | Nginx (Production) — einziger extern exponierter Port |
| `BACKEND_PORT` | 4000 | Backend API |
| `FRONTEND_PORT` | 3000 | Frontend Dev-Server |
| `DB_PORT` | 5432 | PostgreSQL (nur Dev, in Prod intern) |

Mehrere Instanzen auf einem Server: Jede Instanz bekommt eigene Ports via `.env`.

## API Endpoints

Alle unter `/api/v1/`:

| Route | Auth | Beschreibung |
|---|---|---|
| GET /health | Nein | Health-Check (DB + Redis) |
| GET /users | Ja* | Benutzer (paginiert) |
| GET /users/:id | Ja* | Einzelner Benutzer |
| POST /users | Ja* | Benutzer erstellen |
| PUT /users/:id | Ja* | Benutzer aktualisieren |
| DELETE /users/:id | Ja* | Benutzer löschen (Soft Delete) |
| GET /files | Ja* | Dateien (paginiert) |
| POST /files | Ja* | Datei hochladen (multipart) |
| GET /files/:id/download | Ja* | Datei herunterladen |
| DELETE /files/:id | Ja* | Datei löschen (Soft Delete) |
| GET /audit | Ja* | Audit Log (paginiert, filterbar) |
| GET /api-keys | Ja | Eigene API Keys |
| POST /api-keys | Ja | API Key erstellen |
| DELETE /api-keys/:id | Ja | API Key widerrufen |

*Auth nur wenn AZURE_AD_TENANT_ID gesetzt. Akzeptiert Bearer Token ODER X-API-Key.

## Conventions

- API: `/api/v1/` Prefix, Swagger JSDoc, Rate Limiting, Pagination (limit/offset)
- Validation: Zod co-located mit Route Handlers, max-length auf Strings
- Errors: via `next(error)` an zentralen Error-Handler, strukturierte JSON-Response
- Audit: `createAuditLog()` bei jedem CREATE/UPDATE/DELETE
- Soft Delete: `deletedAt` statt echtem Delete, `where: { deletedAt: null }` in Queries
- **Neue Features erfordern:** Route + Swagger + Tests + PowerShell Script + Audit-Logging + Doku
- PowerShell: Verb-Noun, `-BaseUrl` + `-Token` + `-ApiKey` Parameter
- Frontend: shadcn/ui, Server Components default, React Query für Data Fetching
- Docker: DB + Uploads als Host Bind-Mount, nie Docker Volumes
- i18n: Keys in `messages/de.json` + `messages/en.json`
