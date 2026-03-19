# TANSS API — Projekt-Integrationen & Abhängigkeiten

> Diese Datei wird automatisch erweitert wenn TANSS-Integrationen gebaut werden.
> Enthält: Welche Apps nutzen welche TANSS-Routen, und welche Routen hängen voneinander ab.

## Route-Abhängigkeiten (Dependency Chains)

Viele TANSS-Operationen erfordern IDs die zuerst aus anderen Routen geholt werden müssen:

### Ticket erstellen (vollständig)
```
1. POST /api/v1/login                    → apiToken
2. POST /api/v1/search                   → companyId
3. GET  /api/v1/employees                → assignedToEmployeeId
4. GET  /api/v1/admin/ticketStates       → statusId
5. POST /api/v1/tickets                  → ticketId
6. POST /api/v1/tickets/{id}/upload      → Anhänge hochladen
7. POST /api/v1/tickets/{id}/comments    → Kommentar hinzufügen
```

### Support erfassen
```
1. POST /api/v1/login                    → apiToken
2. GET  /api/v1/tickets/own              → ticketId
3. GET  /api/v1/supportTypes/active      → planningType
4. POST /api/v1/supports                 → supportId
```

### Gerät anlegen (Device Management)
```
1. POST /api/v1/login                    → apiToken
2. POST /api/v1/search                   → companyId
3. GET  /api/v1/os                       → osId
4. GET  /api/v1/manufacturers            → manufacturerId
5. GET  /api/v1/cpus                     → cpuId
6. POST /api/v1/pcs                      → pcId
7. POST /api/v1/ips                      → IP zuweisen
8. POST /api/v1/components               → Komponenten hinzufügen
```

### Fernwartung importieren
```
1. (Externer REMOTE_SUPPORT Token)
2. POST /api/remoteSupports/v1/assignDevice    → Geräte-Mapping
3. POST /api/remoteSupports/v1/assignEmployee  → Techniker-Mapping
4. POST /api/remoteSupports/v1                 → Fernwartung importieren
```

---

## Projekt-Integrationen

Format für neue Einträge:

```markdown
### [App-Name] — [Kurzbeschreibung]
- **Datum:** YYYY-MM-DD
- **Auth-Methode:** Employee Login / ERP Token / etc.
- **Genutzte Routen:**
  - `METHOD /path` — Zweck
- **Feld-Mapping:**
  - App-Feld → TANSS-Feld
- **Notizen:** ...
```

_Noch keine Projekt-Integrationen dokumentiert. Werden automatisch ergänzt._
