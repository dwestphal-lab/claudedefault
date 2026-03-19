# API-Dokumentation

## Übersicht

Alle API-Endpoints sind versioniert unter `/api/v1/`. Interaktive Dokumentation:

- **Swagger UI:** http://localhost:4000/api/v1/docs
- **OpenAPI JSON:** http://localhost:4000/api/v1/docs.json

## Authentifizierung

Wenn Entra ID konfiguriert ist (`AZURE_AD_TENANT_ID` gesetzt), erfordern alle Endpoints (außer Health) Authentifizierung.

### Bearer Token (Entra ID SSO)

```
Authorization: Bearer <access-token>
```

### API Key

```
X-API-Key: ak_...
```

Beide Methoden sind gleichwertig. API Keys werden per POST /api/v1/api-keys erstellt.

### Token per PowerShell

```powershell
$token = .\scripts\Get-EntraIdToken.ps1 -TenantId "..." -ClientId "..." -ClientSecret "..."
```

## Rate Limiting

| Bereich | Limit | Beschreibung |
|---|---|---|
| Auth | 10r/m | Brute-Force-Schutz für Login |
| Upload | 30r/m | File-Upload Endpunkt |
| API (allgemein) | 60r/s | Alle anderen API-Endpoints |
| Users (Backend) | 100r/m | Express Rate-Limit auf User-Routes |

Response Headers: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

Bei Überschreitung: HTTP 429 mit `{ "error": "Zu viele Anfragen — bitte warten" }`

## Pagination

Alle Listen-Endpoints unterstützen Pagination:

| Parameter | Typ | Default | Min | Max |
|---|---|---|---|---|
| `limit` | integer | 20 | 1 | 100 |
| `offset` | integer | 0 | 0 | - |

**Response-Format:**
```json
{
  "data": [...],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

## Endpoints

### Health Check

```
GET /api/v1/health
```

Keine Authentifizierung erforderlich.

**Response 200:**
```json
{ "status": "ok", "db": "connected", "redis": "disabled", "version": "1.1.0" }
```

### Benutzer

| Methode | Pfad | Auth | Rolle | Beschreibung |
|---|---|---|---|---|
| GET | /users | Ja | — | Paginierte Liste |
| GET | /users/:id | Ja | — | Einzelner Benutzer |
| POST | /users | Ja | Admin | Benutzer anlegen |
| PUT | /users/:id | Ja | Admin | Benutzer aktualisieren |
| DELETE | /users/:id | Ja | Admin | Soft Delete |

**POST/PUT Body:**
```json
{ "email": "user@example.com", "name": "Max Mustermann", "role": "USER" }
```

### Dateien

| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| GET | /files | Ja | Paginierte Liste |
| POST | /files | Ja | Datei hochladen (multipart/form-data) |
| GET | /files/:id/download | Ja | Datei herunterladen |
| DELETE | /files/:id | Ja | Soft Delete (eigene oder Admin) |

**Upload:** `multipart/form-data` mit Feld `file`. Max 50MB. Erlaubte Typen: JPEG, PNG, GIF, WebP, PDF, TXT, CSV, JSON, XLSX, DOCX.

### Audit Log

```
GET /api/v1/audit
```

Nur Admins. Paginiert + filterbar.

| Filter | Typ | Werte |
|---|---|---|
| `entity` | string | User, File, ApiKey |
| `action` | string | CREATE, UPDATE, DELETE |
| `userId` | string | User-ID des Auslösers |

### API Keys

| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| GET | /api-keys | Ja | Eigene Keys (ohne Key-Wert) |
| POST | /api-keys | Ja | Key erstellen (Key nur einmal sichtbar!) |
| DELETE | /api-keys/:id | Ja | Key widerrufen (Soft Delete) |

**POST Body:**
```json
{ "name": "Automation", "expiresInDays": 90 }
```

## Error-Format

Alle Fehler haben ein einheitliches Format:

```json
{
  "error": "Beschreibung des Fehlers",
  "details": { ... }
}
```

| Status | Beschreibung |
|---|---|
| 400 | Validierungsfehler (mit `details` aus Zod) |
| 401 | Nicht authentifiziert |
| 403 | Keine Berechtigung (falsche Rolle) |
| 404 | Ressource nicht gefunden |
| 409 | Konflikt (z.B. E-Mail bereits vergeben) |
| 429 | Rate Limit überschritten |
| 500 | Interner Serverfehler |

In Development enthält die Response zusätzlich ein `stack` Feld.
