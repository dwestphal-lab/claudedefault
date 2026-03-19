# App Template

Fullstack-Webapplikation Template mit Express 5, Next.js 15, PostgreSQL, Docker und Microsoft Entra ID SSO.

## Tech Stack

| Schicht | Technologie |
|---|---|
| Frontend | Next.js 15, React 19, Tailwind CSS v4, shadcn/ui, next-intl (DE/EN) |
| Backend | Express 5, TypeScript, Pino, Swagger, Sentry |
| Datenbank | PostgreSQL 17 (Prisma ORM), Redis (optional) |
| Auth | Microsoft Entra ID SSO (NextAuth v5) + API Keys |
| Infra | Docker Multi-Stage, Nginx Reverse Proxy |
| Tests | Vitest + Supertest (Backend), Playwright (E2E) |
| CI/CD | GitHub Actions |

## Quickstart

### Voraussetzungen

- Node.js 22+
- Docker Desktop
- PowerShell 7+ (für Scripts)

### 1. Repository klonen und initialisieren

```bash
git clone <repo-url> meine-app
cd meine-app
npm run init
```

Das Init-Script generiert `.env`-Dateien und konfiguriert Ports. Für eigene Ports:

```powershell
.\scripts\Init-Project.ps1 -AppPort 8080 -BackendPort 4001 -FrontendPort 3001 -DbPort 5433
```

### 2. Abhängigkeiten installieren

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 3a. Development (lokal)

```bash
npm run dev:all    # Startet DB (Docker) + Backend + Frontend
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api/v1/health
- Swagger Docs: http://localhost:4000/api/v1/docs

### 3b. Production (Docker)

```bash
npm run docker:up
```

- App: http://localhost (Nginx)
- API: http://localhost/api/v1/health

## Architektur

```
Nginx (:80)
├── /api/*    → Backend (:4000)
└── /*        → Frontend (:3000)

Backend → PostgreSQL (:5432) + Redis (optional)
```

### Monorepo-Struktur

```
├── backend/          # Express 5 API
│   ├── src/
│   │   ├── config/   # env, logger, redis, swagger, sentry
│   │   ├── middleware/# auth, rbac, api-key, audit, error-handler, prisma
│   │   ├── routes/   # health, users, files, audit, api-keys
│   │   └── __tests__/ # Vitest Tests
│   ├── prisma/       # Schema, Migrations, Seed
│   └── Dockerfile
├── frontend/         # Next.js 15
│   ├── src/
│   │   ├── app/      # (dashboard)/, (auth)/ Route Groups
│   │   ├── components/# shadcn/ui + Layout
│   │   ├── lib/      # API Client, Auth, Hooks
│   │   └── messages/ # i18n (de.json, en.json)
│   └── Dockerfile
├── e2e/              # Playwright Tests
├── scripts/          # PowerShell Automation
├── .docker/          # Nginx Config
└── .github/          # CI/CD Workflows
```

## Datenbank

```bash
cd backend
npx prisma migrate dev     # Migration erstellen/ausführen
npx prisma db seed         # Seed-Daten laden
npx prisma studio          # DB Browser öffnen
```

### Modelle

- **User** — E-Mail, Name, Role (ADMIN/USER), Soft Delete
- **File** — Upload-Metadaten, Ownership, Soft Delete
- **ApiKey** — Authentifizierung per X-API-Key Header, Expiration
- **AuditLog** — Alle CREATE/UPDATE/DELETE Operationen

## API

Alle Endpoints unter `/api/v1/`. Auth akzeptiert Bearer Token ODER X-API-Key.

| Route | Methode | Auth | Beschreibung |
|---|---|---|---|
| /health | GET | Nein | Health-Check (DB + Redis) |
| /users | GET | Ja | Benutzer (paginiert) |
| /users/:id | GET | Ja | Einzelner Benutzer |
| /users | POST | Admin | Benutzer erstellen |
| /users/:id | PUT | Admin | Benutzer aktualisieren |
| /users/:id | DELETE | Admin | Benutzer löschen (Soft Delete) |
| /files | GET | Ja | Dateien (paginiert) |
| /files | POST | Ja | Datei hochladen (multipart) |
| /files/:id/download | GET | Ja | Datei herunterladen |
| /files/:id | DELETE | Ja | Datei löschen (Soft Delete) |
| /audit | GET | Admin | Audit Log (paginiert, filterbar) |
| /api-keys | GET | Ja | Eigene API Keys |
| /api-keys | POST | Ja | API Key erstellen |
| /api-keys/:id | DELETE | Ja | API Key widerrufen |

Swagger UI: http://localhost:4000/api/v1/docs

## Auth konfigurieren

### Microsoft Entra ID (optional)

In `.env` setzen:

```env
AZURE_AD_CLIENT_ID=<Application (client) ID>
AZURE_AD_CLIENT_SECRET=<Client Secret>
AZURE_AD_TENANT_ID=<Directory (tenant) ID>
```

Ohne Entra ID laufen alle Endpoints unauthentifiziert (Development-Modus).

### API Keys

```powershell
# Key erstellen (nur bei Erstellung sichtbar!)
.\scripts\New-ApiKey.ps1 -Name "Automation" -Token $token

# Key nutzen
.\scripts\Get-ApiUsers.ps1 -ApiKey "ak_..."
```

## PowerShell Scripts

Alle Scripts unter `scripts/` mit einheitlichen Parametern `-BaseUrl`, `-Token`, `-ApiKey`.

| Script | Beschreibung |
|---|---|
| Init-Project.ps1 | Projekt initialisieren, Ports + .env generieren |
| Invoke-ApiHealth.ps1 | Health-Check |
| Get-ApiHealth.ps1 | Health-Check (detailliert, farbcodiert) |
| Get-ApiUsers.ps1 | Benutzer abrufen (paginiert) |
| New-ApiUser.ps1 | Benutzer erstellen |
| Update-ApiUser.ps1 | Benutzer aktualisieren |
| Remove-ApiUser.ps1 | Benutzer löschen |
| Import-ApiUsers.ps1 | Benutzer-Bulk-Import |
| Get-ApiFiles.ps1 | Dateien abrufen |
| Send-ApiFile.ps1 | Datei hochladen |
| Save-ApiFile.ps1 | Datei herunterladen |
| New-ApiKey.ps1 | API Key erstellen |
| Get-ApiKeys.ps1 | API Keys auflisten |
| Remove-ApiKey.ps1 | API Key widerrufen |
| Get-ApiAuditLog.ps1 | Audit Log abrufen |
| Get-EntraIdToken.ps1 | Entra ID Token generieren |
| Backup-Database.ps1 | Datenbank-Backup |
| Restore-Database.ps1 | Datenbank-Restore |

## Tests

```bash
# Backend Unit Tests
cd backend && npm test

# Backend mit Coverage
cd backend && npm run test:coverage

# E2E Tests
cd e2e && npm test
```

## Docker

```bash
npm run docker:up      # Full Stack starten
npm run docker:down    # Stack stoppen
npm run docker:logs    # Logs anzeigen

# Mit Redis
docker compose --env-file .env --profile redis up --build -d
```

### Mehrere Instanzen

Jede Instanz bekommt eigene Ports via `.env`:

```powershell
.\scripts\Init-Project.ps1 -AppPort 8080 -BackendPort 4001 -FrontendPort 3001 -DbPort 5433
```

### Daten

Host Bind-Mounts (kein Docker Volume):

| Pfad | Inhalt |
|---|---|
| `./data/postgres/` | PostgreSQL Daten |
| `./data/uploads/` | Datei-Uploads |
| `./data/backups/` | DB-Backups |

## Neue App aus Template erstellen

1. Repository klonen, `.git` entfernen, neu initialisieren
2. `npm run init` ausführen
3. `backend/prisma/schema.prisma` anpassen — eigene Modelle hinzufügen
4. Routes in `backend/src/routes/` erstellen
5. Frontend-Seiten in `frontend/src/app/(dashboard)/` bauen
6. i18n-Keys in `frontend/messages/` ergänzen
7. PowerShell-Scripts in `scripts/` erstellen

Jedes neue Feature braucht: **Route + Swagger + Tests + PowerShell Script + Audit-Logging**
