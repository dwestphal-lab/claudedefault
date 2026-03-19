# TANSS API Authentifizierung

> api_version: 10.12.0
> Stand: 2026-03-19
> Quelle: https://api-doc.tanss.de/combined.yaml

## Base-URL Hinweis

Manche TANSS-Instanzen nutzen einen Subpfad. Je nach Deployment kann die API unter verschiedenen Basis-URLs erreichbar sein:

| Variante | Beispiel |
|---|---|
| Standard | `https://tanss.firma.de/api/v1/...` |
| Mit `/backend` Prefix | `https://tanss.firma.de/backend/api/v1/...` |

**Beim ersten Kontakt mit einer TANSS-Instanz immer prüfen**, ob `/backend` benötigt wird. Typisch bei Setups mit Reverse-Proxy (Nginx), wo Frontend und Backend unter derselben Domain laufen.

## Login

### POST /api/v1/login

Erstellt einen API-Token und Refresh-Token für weitere Authentifizierung.

**Request Body:**
```json
{
  "username": "string (required) — Login-Name",
  "password": "string (required) — Passwort",
  "token": "string (optional) — 2FA-Token"
}
```

**Response (200):**
```json
{
  "meta": { "text": "" },
  "content": {
    "employeeId": 123,
    "apiKey": "Bearer eyJ...",
    "expire": 1700000000,
    "refresh": "Bearer eyR...",
    "employeeType": "TECHNICIAN"
  }
}
```

**Response (403):** Login fehlgeschlagen

### Token-Lifecycle

| Token | Gültigkeit | Header | Erneuerung |
|---|---|---|---|
| `apiKey` | 4 Stunden | `apiToken: Bearer ...` | Via Refresh-Token |
| `refresh` | 5 Tage | — | Neuer Login nötig |

### Header-Format

```
apiToken: Bearer eyJ...
```

**WICHTIG:** Der Header heißt `apiToken`, NICHT `Authorization`!

## Employee Types

| Typ | Beschreibung |
|---|---|
| `TECHNICIAN` | Techniker/Mitarbeiter |
| `CUSTOMER` | Kunde |

## Externe API-Tokens (Rollen)

Für spezielle APIs werden externe Tokens erstellt (in der TANSS-Administration):

| Rolle | API-Bereich | Prefix |
|---|---|---|
| `PHONE` | Phone Calls | `/api/calls/v1` |
| `REMOTE_SUPPORT` | Fernwartung | `/api/remoteSupports/v1` |
| `MONITORING` | Monitoring | `/api/monitoring/v1` |
| `ERP` | ERP/Rechnungen | `/api/erp/v1` |
| `DEVICE_MANAGEMENT` | Geräte-Verwaltung | `/api/deviceManagement/v1` |

Diese Tokens werden in der TANSS-Administration unter "Externe API-Anbindungen" erstellt und haben einen festen Rollen-Typ.

## Token-Refresh Pattern (TypeScript)

```typescript
async function refreshToken(refreshToken: string): Promise<string> {
  // TANSS hat keinen dedizierten Refresh-Endpoint
  // Der Refresh-Token wird als apiToken im Header gesetzt
  // und ein neuer Login durchgeführt
  // Empfehlung: Token vor Ablauf erneuern (z.B. bei 3h 45min)
}
```

## PowerShell Auth-Pattern

```powershell
# Login und Token speichern
$loginBody = @{ username = "admin"; password = "secret" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $response.content.apiKey

# Token in weiteren Requests verwenden
$headers = @{ "apiToken" = $token }
Invoke-RestMethod -Uri "$BaseUrl/api/v1/tickets/own" -Method Get -Headers $headers
```
