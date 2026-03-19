# Installation & Setup

## Voraussetzungen

- Node.js 22+
- Docker & Docker Compose
- (Optional) Microsoft Entra ID App Registration für SSO

## 1. Repository klonen

```bash
git clone <repo-url>
cd claudedefault
npm install
```

## 2. Projekt initialisieren (Ports + .env)

```powershell
# Standard-Ports (80/4000/3000/5432)
.\scripts\Init-Project.ps1

# Oder: Eigene Ports für Multi-Instanz Deployment
.\scripts\Init-Project.ps1 -AppPort 8080 -BackendPort 4001 -FrontendPort 3001 -DbPort 5433

# Shortcut (Standard-Ports)
npm run init
```

Das Script generiert automatisch `.env`, `backend/.env` und `frontend/.env`.

### Port-Konfiguration

| Variable | Default | Beschreibung |
|---|---|---|
| `APP_PORT` | 80 | Nginx (Production) — einziger extern exponierter Port |
| `BACKEND_PORT` | 4000 | Backend API |
| `FRONTEND_PORT` | 3000 | Frontend Dev-Server |
| `DB_PORT` | 5432 | PostgreSQL (nur Dev — in Prod intern) |

### Weitere Umgebungsvariablen

| Variable | Beschreibung | Pflicht |
|---|---|---|
| `POSTGRES_USER` | PostgreSQL Benutzername | Ja |
| `POSTGRES_PASSWORD` | PostgreSQL Passwort | Ja |
| `POSTGRES_DB` | Datenbankname | Ja |
| `AZURE_AD_CLIENT_ID` | Entra ID Application ID | Für SSO |
| `AZURE_AD_CLIENT_SECRET` | Entra ID Client Secret | Für SSO |
| `AZURE_AD_TENANT_ID` | Entra ID Tenant ID | Für SSO |
| `NEXTAUTH_SECRET` | Zufälliger String (wird auto-generiert) | Ja (Prod) |

## 3a. Lokale Entwicklung

```bash
# Alles auf einmal starten (DB + Backend + Frontend)
npm run dev:all

# Oder manuell:
npm run dev:db                              # PostgreSQL starten
cd backend && npm install && npx prisma migrate dev && npm run dev
cd frontend && npm install && npm run dev   # Neues Terminal
```

- Frontend: http://localhost:{FRONTEND_PORT}
- Backend: http://localhost:{BACKEND_PORT}
- API Docs: http://localhost:{BACKEND_PORT}/api/v1/docs

## 3b. Docker Stack (Staging/Produktion)

```bash
npm run docker:up     # Baut und startet alle Services inkl. Nginx
```

- App: http://localhost:{APP_PORT} (Nginx Reverse Proxy)
- API: http://localhost:{APP_PORT}/api/v1/

### Mehrere Instanzen auf einem Server

```powershell
# Instanz 1
cd /srv/app1
.\scripts\Init-Project.ps1 -AppPort 8080 -BackendPort 4000 -FrontendPort 3000 -DbPort 5432
npm run docker:up

# Instanz 2
cd /srv/app2
.\scripts\Init-Project.ps1 -AppPort 8081 -BackendPort 4001 -FrontendPort 3001 -DbPort 5433
npm run docker:up
```

Jeder Stack nutzt eigene Ports und ein eigenes Docker-Netzwerk.

Nginx routet automatisch `/api/*` ans Backend und alles andere ans Frontend.

## 4. Entra ID Konfiguration

1. Azure Portal → App Registrations → Neue Registrierung
2. Redirect URI: `http://localhost:3000/api/auth/callback/microsoft-entra-id`
3. Client Secret erstellen
4. Werte in `.env` eintragen

Wenn `AZURE_AD_TENANT_ID` gesetzt ist, werden Backend-Routes automatisch per Bearer Token geschützt.

## 5. Datenbank

Die PostgreSQL-Daten liegen auf dem Host unter `./data/postgres/` (Bind-Mount).

### Backup erstellen

```powershell
.\scripts\Backup-Database.ps1
.\scripts\Backup-Database.ps1 -KeepDays 30   # Alte Backups nach 30 Tagen löschen
```

Backups werden unter `./data/backups/` gespeichert.

## Tests

```bash
cd backend && npm test          # Unit + Integration Tests
cd backend && npm run test:watch  # Watch Mode
cd backend && npm run test:coverage  # Coverage Report
```
