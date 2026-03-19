---
name: tanss-api
description: TANSS Ticketsystem API Integration Skill. Aktiviert sich automatisch bei TANSS-bezogener Arbeit (Imports, API-Calls, Ticket-Operationen). Enthält komplette API-Referenz, Schemas, Auth-Flow und Auto-Sync mit der offiziellen TANSS API-Dokumentation. Erweitert sich selbst bei neuen Route-Entdeckungen.
---

# TANSS API Integration Skill

Komplettes Wissen über die TANSS Ticketsystem API (https://api-doc.tanss.de/).

## Aktivierung

Dieser Skill wird automatisch aktiv wenn:
- Code `tanss` referenziert (Imports, Variablen, Kommentare)
- API-Routen erstellt werden die TANSS-Endpunkte ansprechen
- PowerShell-Scripts für TANSS geschrieben werden
- Der User nach TANSS-Funktionalität fragt

## Auto-Sync: API-Dokumentation aktualisieren

### PFLICHT bei jeder TANSS-Arbeit:

**Vor** dem Arbeiten mit TANSS-Routen, prüfe ob die lokale Referenz aktuell ist:

```bash
# 1. YAML herunterladen (immer aktuell von der offiziellen Doku)
curl -sL "https://api-doc.tanss.de/combined.yaml" -o "/tmp/tanss_api_latest.yaml"

# 2. Version prüfen
grep "version:" /tmp/tanss_api_latest.yaml | head -1
```

Vergleiche die Version mit dem `api_version` Feld in `references/tanss_api_endpoints.md`.
Bei neuer Version: Referenz-Dateien aktualisieren, ohne Rückfrage.

### Warum curl statt WebFetch?
Die TANSS-Doku nutzt ReDoc (JavaScript-SPA). WebFetch kann nur statisches HTML lesen.
Die `combined.yaml` enthält **alle** API-Daten und wird zuverlässig per `curl` geladen (710 KB, 17.000+ Zeilen).

## Auto-Extension: Selbstverbesserung

### PFLICHT — ohne Rückfrage ausführen:

1. **Neue Routen entdeckt:** Wenn beim Arbeiten eine TANSS API-Route verwendet wird die NICHT in `references/tanss_api_endpoints.md` steht → sofort in `references/tanss_undocumented_routes.md` eintragen mit:
   - HTTP-Methode + Pfad
   - Bekannte Parameter/Body
   - Quelle (woher die Route bekannt ist)
   - Datum der Entdeckung

2. **Abhängigkeiten erkannt:** Wenn eine Route eine andere voraussetzt (z.B. "Ticket erstellen braucht companyId → GET /api/v1/companies") → in `references/tanss_project_routes.md` als Dependency-Chain dokumentieren

3. **Projekt-Integrationen:** Wenn in einer App eine TANSS-Integration gebaut wird → automatisch in `references/tanss_project_routes.md` dokumentieren:
   - Welche App / welcher Service
   - Welche TANSS-Routen werden genutzt
   - Auth-Methode (Token / API-Key)
   - Mapping von App-Daten auf TANSS-Felder

## Referenz-Dateien

| Datei | Inhalt |
|---|---|
| `references/tanss_api_endpoints.md` | Alle 104+ dokumentierten API-Routen mit Methode, Pfad, Parametern |
| `references/tanss_api_schemas.md` | Datenmodelle: Ticket, Company, Employee, Support, etc. |
| `references/tanss_api_auth.md` | Auth-Flow: Login, Token, Refresh, Rollen, API-Keys |
| `references/tanss_undocumented_routes.md` | Manuell/automatisch ergänzte undokumentierte Routen |
| `references/tanss_project_routes.md` | Projekt-spezifische TANSS-Integrationen und Abhängigkeiten |

## Templates

| Datei | Inhalt |
|---|---|
| `templates/tanss_client.ts.md` | TypeScript API-Client Vorlage |
| `templates/tanss_powershell.ps1.md` | PowerShell Script Vorlage |

## Base-URL

Manche TANSS-Instanzen erfordern einen `/backend` Prefix (typisch bei Reverse-Proxy Setups):

| Variante | URL |
|---|---|
| Standard | `https://tanss.firma.de/api/v1/...` |
| Mit Prefix | `https://tanss.firma.de/backend/api/v1/...` |

**Beim ersten Kontakt immer prüfen** ob `/backend` nötig ist (400 Bad Request = falscher Pfad).

## Wichtige API-Konzepte

### Response-Format (alle Endpoints)
```json
{
  "meta": {
    "linkedEntities": {},
    "properties": {}
  },
  "content": { }
}
```

### Error-Format
```json
{
  "error": {
    "text": "ERROR_CODE",
    "localizedText": "Lokalisierte Fehlermeldung",
    "type": "ExceptionType"
  }
}
```

### Auth-Rollen
| Rolle | Zugriff | Token-Typ |
|---|---|---|
| (Standard) | Tickets, Users, Companies, etc. | Employee Login |
| PHONE | Phone Calls API | Externer API-Token |
| REMOTE_SUPPORT | Remote Support API | Externer API-Token |
| MONITORING | Monitoring API | Externer API-Token |
| ERP | ERP/Invoicing API | Externer API-Token |
| DEVICE_MANAGEMENT | Device Mgmt alternativ-Pfad | Externer API-Token |

### Timestamps
Alle Datums-/Zeitwerte sind **Unix Timestamps** (Sekunden seit Epoch).

### Pagination
Listen-Endpoints nutzen `itemsPerPage` und `page` als Query-Parameter.

### Device Management Dual-Path
Device-Management-Routen sind unter zwei Pfaden erreichbar:
- `/api/v1/pcs` (mit Employee-Login)
- `/api/deviceManagement/v1/pcs` (mit Device-Management-Token)

## Schnell-Referenz: Häufigste Operationen

```
Login:                POST /api/v1/login
Ticket erstellen:     POST /api/v1/tickets
Ticket abrufen:       GET  /api/v1/tickets/{ticketId}
Eigene Tickets:       GET  /api/v1/tickets/own
Ticket kommentieren:  POST /api/v1/tickets/{ticketId}/comments
Datei hochladen:      POST /api/v1/tickets/{ticketId}/upload
Support erstellen:    POST /api/v1/supports
Company suchen:       POST /api/v1/search
Mitarbeiter:          GET  /api/v1/employees
Tags:                 GET  /api/v1/tags
```
