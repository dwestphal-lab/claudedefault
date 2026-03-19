# TANSS API Endpoints — Vollständige Referenz

> api_version: 10.12.0
> Stand: 2026-03-19
> Quelle: https://api-doc.tanss.de/combined.yaml
> Letzer Sync: 2026-03-19

---

## Security

| Methode | Pfad | Beschreibung |
|---|---|---|
| POST | `/api/v1/login` | Login, generiert apiToken (4h) + refreshToken (5d) |

---

## Tickets

| Methode | Pfad | Beschreibung |
|---|---|---|
| POST | `/api/v1/tickets` | Neues Ticket erstellen |
| PUT | `/api/v1/tickets` | Ticket-Liste mit Filtern abrufen |
| GET | `/api/v1/tickets/{ticketId}` | Einzelnes Ticket abrufen |
| PUT | `/api/v1/tickets/{ticketId}` | Ticket aktualisieren |
| DELETE | `/api/v1/tickets/{ticketId}` | Ticket löschen (optional Entities verschieben) |
| GET | `/api/v1/tickets/history/{ticketId}` | Ticket-History (Kommentare, Supports, Mails) |
| POST | `/api/v1/tickets/{ticketId}/comments` | Kommentar erstellen (optional pinnen) |

### Ticket erstellen — POST /api/v1/tickets
**Body (wichtigste Felder):**
- `companyId` (int, required) — Firmen-ID
- `title` (string) — Betreff
- `content` (string) — Beschreibung
- `statusId` (int) — Ticket-Status (→ linkedEntities.ticketStates)
- `typeId` (int) — Ticket-Typ
- `assignedToEmployeeId` (int) — Zugewiesener Techniker
- `assignedToDepartmentId` (int) — Zugewiesene Abteilung
- `dueDate` (timestamp) — Fälligkeitsdatum
- `reminder` (timestamp) — Erinnerung
- `project` (boolean) — Ist Projekt
- `projectId` (int) — Übergeordnetes Projekt
- `repair` (boolean) — Reparatur-Ticket
- `estimatedMinutes` (int) — Geschätzte Minuten
- `attention` (enum: NO|YES|RESUBMISSION|MAIL)
- `installationFee` (enum: NO|YES|NO_PROJECT_INSTALLATION_FEE)
- `installationFeeDriveMode` (enum: NONE|DRIVE_INCLUDED|DRIVE_EXCLUDED)
- `separateBilling` (boolean)
- `orderNumber` (string) — Bestellnummer
- `localTicketAdminFlag` (enum: NONE|LOCAL_ADMIN|TECHNICIAN)
- `clearanceMode` (enum: DEFAULT|DONT_CLEAR_SUPPORTS|MAY_CLEAR_SUPPORTS)
- `tags` (array) — Tags
- `extTicketId` (string) — Externe Ticket-ID

### Ticket-Liste filtern — PUT /api/v1/tickets
**Body:**
- `ticketStates` (array of int) — Status-Filter
- `ticketTypes` (array of int) — Typ-Filter
- `companyId` (int) — Firmen-Filter
- `employeeId` (int) — Mitarbeiter-Filter
- `orderBy` (string) — Sortierung
- `orderDirection` (string: ASC|DESC)
- `itemsPerPage` (int) — Pagination
- `page` (int) — Seitennummer

---

## Ticket-Listen (vordefinierte Views)

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/tickets/own` | Eigene zugewiesene Tickets |
| GET | `/api/v1/tickets/general` | Nicht zugewiesene Tickets |
| GET | `/api/v1/tickets/company/{companyId}` | Tickets einer Firma |
| GET | `/api/v1/tickets/technician` | Techniker-Tickets (ohne aktuellen User) |
| GET | `/api/v1/tickets/repair` | Alle Reparatur-Tickets |
| GET | `/api/v1/tickets/notIdentified` | Nicht identifizierte Tickets |
| GET | `/api/v1/tickets/projects` | Alle Projekte |
| GET | `/api/v1/tickets/localAdminOverview` | Local Admin Tickets |
| GET | `/api/v1/tickets/withRole` | Tickets nach Techniker-Rolle |

**Gemeinsame Query-Parameter für Listen:**
- `itemsPerPage` (int) — Ergebnisse pro Seite
- `page` (int) — Seitennummer
- `orderBy` (string) — Sortierfeld
- `orderDirection` (string: ASC|DESC)

---

## Ticket Content (Dokumente & Bilder)

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/tickets/{ticketId}/documents` | Alle Ticket-Dokumente |
| GET | `/api/v1/tickets/{ticketId}/documents/{documentId}` | Download-Link für Dokument |
| GET | `/api/v1/tickets/{ticketId}/screenshots` | Alle Ticket-Bilder |
| GET | `/api/v1/tickets/{ticketId}/screenshots/{imageId}` | Download-Link für Bild |
| POST | `/api/v1/tickets/{ticketId}/upload` | Dateien hochladen (multipart/form-data) |

### Upload — POST /api/v1/tickets/{ticketId}/upload
**Form-Data:**
- `files` (binary, required) — Dateien
- `descriptions` (string) — Beschreibungen (kommasepariert)
- `internal` (boolean) — Intern markieren

---

## Ticket States

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/admin/ticketStates` | Alle Ticket-Status abrufen |

---

## Phone Calls (Rolle: PHONE)

| Methode | Pfad | Beschreibung |
|---|---|---|
| POST | `/api/calls/v1` | Anruf erstellen/importieren |
| PUT | `/api/calls/v1` | Anrufe mit Filtern abrufen |
| GET | `/api/calls/v1/{id}` | Einzelnen Anruf abrufen |
| PUT | `/api/calls/v1/{id}` | Anruf aktualisieren |
| POST | `/api/calls/v1/identify` | Anruf identifizieren (Company/Employee auflösen) |
| GET | `/api/calls/v1/employeeAssignment` | idString→Employee Mappings |
| POST | `/api/calls/v1/notification` | Anruf-Benachrichtigung |

### Phone Calls (User Context)

| Methode | Pfad | Beschreibung |
|---|---|---|
| PUT | `/api/v1/phoneCalls` | Anrufe im User-Kontext abrufen |
| POST | `/api/v1/phoneCalls/identify` | Telefonnummer identifizieren |

### Anruf erstellen — POST /api/calls/v1
**Body:**
- `callId` (string) — Externe Anruf-ID
- `telephoneSystemId` (int) — Telefonanlage-ID
- `date` (timestamp) — Zeitpunkt
- `fromPhoneNumber` (string) — Anrufer
- `toPhoneNumber` (string) — Angerufener
- `direction` (enum: INTERNAL|INCOMING|OUTGOING)
- `connectionEstablished` (boolean) — Verbindung aufgebaut
- `durationTotal` (int) — Gesamtdauer inkl. Klingeln
- `durationCall` (int) — Gesprächsdauer
- `group` (string) — Gruppierung
- `phoneParticipants` (array) — Techniker-Zuordnungen
  - `idString` (string) — Identifier der Telefonanlage
  - `employeeId` (int) — TANSS Mitarbeiter-ID

---

## Remote Supports (Rolle: REMOTE_SUPPORT)

| Methode | Pfad | Beschreibung |
|---|---|---|
| POST | `/api/remoteSupports/v1` | Fernwartung erstellen/importieren |
| PUT | `/api/remoteSupports/v1` | Fernwartungen mit Filtern abrufen |
| GET | `/api/remoteSupports/v1/{remoteSupportId}` | Einzelne Fernwartung abrufen |
| PUT | `/api/remoteSupports/v1/{remoteSupportId}` | Fernwartung aktualisieren |
| DELETE | `/api/remoteSupports/v1/{remoteSupportId}` | Fernwartung löschen (nur externe, type >= 1000) |
| GET | `/api/remoteSupports/v1/assignDevice` | Alle Geräte-Zuordnungen |
| POST | `/api/remoteSupports/v1/assignDevice` | Geräte-Zuordnung erstellen |
| DELETE | `/api/remoteSupports/v1/assignDevice` | Geräte-Zuordnung löschen |
| GET | `/api/remoteSupports/v1/assignEmployee` | Alle Techniker-Zuordnungen |
| POST | `/api/remoteSupports/v1/assignEmployee` | Techniker-Zuordnung erstellen |
| DELETE | `/api/remoteSupports/v1/assignEmployee` | Techniker-Zuordnung löschen |

---

## Monitoring (Rolle: MONITORING)

| Methode | Pfad | Beschreibung |
|---|---|---|
| POST | `/api/monitoring/v1/ticket` | Ticket via Monitoring erstellen (mit groupName) |
| POST | `/api/monitoring/v1/assignGroup` | Gruppen-Zuordnung erstellen |
| GET | `/api/monitoring/v1/assignGroup` | Alle Gruppen-Zuordnungen |
| DELETE | `/api/monitoring/v1/assignGroup` | Gruppen-Zuordnung löschen |
| GET | `/api/monitoring/v1/ticketsFromGroup` | Tickets einer Monitoring-Gruppe |
| PUT | `/api/monitoring/v1/ticketsFromGroup` | Tickets einer Gruppe filtern |

---

## ERP (Rolle: ERP)

| Methode | Pfad | Beschreibung |
|---|---|---|
| POST | `/api/erp/v1/invoices` | Rechnungen importieren |
| GET | `/api/erp/v1/invoices` | Abrechenbare Supports abrufen |
| GET | `/api/erp/v1/customers` | Kunden-Export |
| PUT | `/api/erp/v1/customers` | Kunden mit Filtern abrufen |
| GET | `/api/erp/v1/tickets` | Tickets für ERP |
| GET | `/api/erp/v1/tickets/status` | Ticket-Status für ERP |
| GET | `/api/erp/v1/tickets/types` | Ticket-Typen für ERP |
| GET | `/api/erp/v1/companies/employees` | Mitarbeiter einer Firma (ERP) |
| GET | `/api/erp/v1/companies/departments` | Abteilungen einer Firma (ERP) |
| GET | `/api/erp/v1/companyCategories` | Firmen-Kategorien (ERP) |
| GET | `/api/erp/v1/companies/employees/departments/` | Mitarbeiter nach Abteilung |
| GET | `/api/erp/v1/checklists` | Checklisten (ERP) |

---

## Timestamps (Zeiterfassung)

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/timestamps` | Zeitstempel eines Zeitraums (from/till Query) |
| POST | `/api/v1/timestamps` | Zeitstempel erstellen |
| PUT | `/api/v1/timestamps` | Zeitstempel-Liste filtern |
| GET | `/api/v1/timestamps/info` | Zeitstempel-Info |
| GET | `/api/v1/timestamps/statistics` | Zeitstempel-Statistiken |
| GET | `/api/v1/timestamps/dayClosing` | Tagesabschluss |
| PUT | `/api/v1/timestamps/dayClosing/tillDate` | Tagesabschluss bis Datum |
| GET | `/api/v1/timestamps/pauseConfigs` | Pausen-Konfigurationen |

### Zeitstempel — Query-Parameter
- `from` (timestamp) — Start (default: Tagesbeginn)
- `till` (timestamp) — Ende (default: Tagesende)

### Zeitstempel-States
- `ON` — Eingestempelt
- `OFF` — Ausgestempelt
- `PAUSE_START` — Pause begonnen
- `PAUSE_END` — Pause beendet

---

## Chats

| Methode | Pfad | Beschreibung |
|---|---|---|
| POST | `/api/v1/chats` | Chat erstellen |
| PUT | `/api/v1/chats` | Chats mit Filtern abrufen |
| GET | `/api/v1/chats/{id}` | Einzelnen Chat abrufen |
| PUT | `/api/v1/chats/{id}` | Chat aktualisieren |
| DELETE | `/api/v1/chats/{id}` | Chat löschen |
| GET | `/api/v1/chats/closeRequests` | Schließ-Anfragen |
| POST | `/api/v1/chats/messages` | Nachricht senden |
| GET | `/api/v1/chats/messages` | Nachrichten abrufen |
| GET | `/api/v1/chats/participants` | Teilnehmer abrufen |
| POST | `/api/v1/chats/participants` | Teilnehmer hinzufügen |
| DELETE | `/api/v1/chats/participants` | Teilnehmer entfernen |

### Chat-Filter (PUT /api/v1/chats)
- `status` (enum: OPEN|CLOSED)
- `searchString` (string) — Textsuche
- `creatorId` (int) — Ersteller
- `showOnlyParticapatedChat` (boolean) — Nur eigene Chats
- `loadMessages` (enum: NONE|ALL|LAST) — Nachrichten laden

---

## Offers (Angebote)

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/offers/erpSelections` | ERP-Auswahlen |
| PUT | `/api/v1/offers/erpSelections` | ERP-Auswahlen filtern |
| GET | `/api/v1/offers/templates` | Angebots-Vorlagen |
| POST | `/api/v1/offers/templates` | Vorlage erstellen |
| PUT | `/api/v1/offers/templates` | Vorlage aktualisieren |
| GET | `/api/v1/offers/erpSelections/matPicker` | Material-Picker |
| POST | `/api/v1/offers` | Angebot erstellen |
| GET | `/api/v1/offers` | Angebote abrufen |
| PUT | `/api/v1/offers` | Angebote filtern |

---

## Availability (Verfügbarkeit)

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/availability` | Verfügbarkeit aller Mitarbeiter |

### Response enthält pro Mitarbeiter:
- `employeeId` — Mitarbeiter-ID
- `absences` — Aktuelle Abwesenheiten (Urlaub, krank, etc.)
- `appointments` — Aktuelle Termine
- `endInfos` — Wann Abwesenheit endet (timeType: TIME|TODAY|TOMORROW)

---

## Employees (Mitarbeiter)

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/employees` | Alle Mitarbeiter |
| GET | `/api/v1/employees/technicians` | Nur Techniker |

### Employee-Felder:
- `id` (int) — ID
- `name` (string) — Name
- `initials` (string) — Kürzel
- `companyId` (int) — Firmen-Zuordnung
- `active` (boolean) — Aktiv

---

## Mails

| Methode | Pfad | Beschreibung |
|---|---|---|
| POST | `/api/v1/mails/test/smtp` | SMTP-Verbindung testen |

---

## Tags

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/tags` | Alle Tags abrufen |
| POST | `/api/v1/tags` | Tag erstellen |
| PUT | `/api/v1/tags/{id}` | Tag aktualisieren |
| GET | `/api/v1/tags/assignment` | Tag-Zuordnungen |
| POST | `/api/v1/tags/assignment` | Tag zuordnen |
| DELETE | `/api/v1/tags/assignment` | Tag-Zuordnung entfernen |
| GET | `/api/v1/tags/assignment/log` | Tag-Zuordnungs-Log |

---

## Callbacks (Rückrufe)

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/callbacks` | Rückrufe abrufen |
| POST | `/api/v1/callbacks` | Rückruf erstellen |
| GET | `/api/v1/callbacks/{id}` | Einzelnen Rückruf abrufen |
| PUT | `/api/v1/callbacks/{id}` | Rückruf aktualisieren |
| DELETE | `/api/v1/callbacks/{id}` | Rückruf löschen |

---

## Search (Suche)

| Methode | Pfad | Beschreibung |
|---|---|---|
| POST | `/api/v1/search` | Universale Suche (Firmen, Mitarbeiter, etc.) |

### Such-Body:
- `searchString` (string) — Suchbegriff
- `types` (array) — Suchbereiche (COMPANY, EMPLOYEE, etc.)

---

## Checklists

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/checklists` | Alle Checklisten |
| POST | `/api/v1/checklists` | Checkliste erstellen |
| PUT | `/api/v1/checklists/{id}` | Checkliste aktualisieren |
| DELETE | `/api/v1/checklists/{id}` | Checkliste löschen |
| POST | `/api/v1/checklists/{linkTypeId}/{linkId}` | Checkliste zuordnen (z.B. Ticket) |
| DELETE | `/api/v1/checklists/{linkTypeId}/{linkId}/{checklistId}` | Zuordnung entfernen |
| GET | `/api/v1/checklists/assignment/{linkTypeId}/{linkId}` | Checklisten eines Tickets |
| POST | `/api/v1/checklists/check` | Checklist-Item abhaken |

### linkTypeId-Werte:
- `11` = Ticket

---

## Supports (Leistungseinträge)

| Methode | Pfad | Beschreibung |
|---|---|---|
| PUT | `/api/v1/supports/list` | Supports mit Filtern abrufen |
| POST | `/api/v1/supports` | Support erstellen |
| GET | `/api/v1/supports/{id}` | Einzelnen Support abrufen |
| PUT | `/api/v1/supports/{id}` | Support aktualisieren |
| DELETE | `/api/v1/supports/{id}` | Support löschen |

### Support erstellen — POST /api/v1/supports
**Body:**
- `ticketId` (int) — Zugehöriges Ticket
- `date` (timestamp) — Datum
- `employeeId` (int) — Techniker
- `location` (enum: OFFICE|CUSTOMER|REMOTE)
- `duration` (int) — Arbeitszeit (Sekunden)
- `durationApproach` (int) — Anfahrt (Sekunden)
- `durationDeparture` (int) — Abfahrt (Sekunden)
- `text` (string) — Beschreibung
- `planningType` (object) — Leistungsart

---

## Support Types

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/supportTypes` | Alle Leistungsarten |
| POST | `/api/v1/supportTypes` | Leistungsart erstellen |
| PUT | `/api/v1/supportTypes/{id}` | Leistungsart aktualisieren |
| GET | `/api/v1/supportTypes/active` | Nur aktive Leistungsarten |

---

## Timers

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/timers` | Laufende Timer |
| POST | `/api/v1/timers` | Timer starten |
| PUT | `/api/v1/timers/{id}` | Timer aktualisieren |
| DELETE | `/api/v1/timers/{id}` | Timer stoppen/löschen |
| GET | `/api/v1/timers/notes` | Timer-Notizen |
| POST | `/api/v1/timers/notes` | Timer-Notiz erstellen |
| PUT | `/api/v1/timers/notes/{id}` | Timer-Notiz aktualisieren |
| DELETE | `/api/v1/timers/notes/{id}` | Timer-Notiz löschen |

---

## Ticket Board

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/ticketBoard` | Board abrufen |
| POST | `/api/v1/ticketBoard` | Board erstellen |
| GET | `/api/v1/ticketBoard/panel` | Panel abrufen |
| POST | `/api/v1/ticketBoard/panel` | Panel erstellen |
| PUT | `/api/v1/ticketBoard/panel` | Panel aktualisieren |
| DELETE | `/api/v1/ticketBoard/panel/{id}` | Panel löschen |
| GET | `/api/v1/ticketBoard/project/globalPanels` | Globale Projekt-Panels |

### Panel-Typen:
- `panelType`: DEFAULT | PROJECT
- `registerType`: NONE | COMPANY | EMPLOYEE | DEPARTMENT | TAG | TICKET_TYPE | TICKET_STATUS | PROJECT_PHASE

---

## Device Management: PCs/Server

| Methode | Pfad | Beschreibung |
|---|---|---|
| POST | `/api/v1/pcs` | PC/Server erstellen |
| PUT | `/api/v1/pcs` | PCs mit Filtern abrufen |
| GET | `/api/v1/pcs/{pcId}` | Einzelnen PC abrufen |
| PUT | `/api/v1/pcs/{pcId}` | PC aktualisieren |
| DELETE | `/api/v1/pcs/{pcId}` | PC löschen |

**Alternativ-Pfad mit Device-Management-Token:** `/api/deviceManagement/v1/pcs`

---

## Device Management: Peripherie

| Methode | Pfad | Beschreibung |
|---|---|---|
| POST | `/api/v1/peripheries` | Peripherie erstellen |
| PUT | `/api/v1/peripheries` | Peripherie mit Filtern abrufen |
| GET | `/api/v1/peripheries/{id}` | Einzelne Peripherie |
| PUT | `/api/v1/peripheries/{id}` | Peripherie aktualisieren |
| DELETE | `/api/v1/peripheries/{id}` | Peripherie löschen |
| GET | `/api/v1/peripheries/types` | Peripherie-Typen |
| POST | `/api/v1/peripheries/types` | Peripherie-Typ erstellen |
| PUT | `/api/v1/peripheries/types/{id}` | Peripherie-Typ aktualisieren |

---

## Device Management: Komponenten

| Methode | Pfad | Beschreibung |
|---|---|---|
| POST | `/api/v1/components` | Komponente erstellen |
| GET | `/api/v1/components/{id}` | Einzelne Komponente |
| PUT | `/api/v1/components/{id}` | Komponente aktualisieren |
| DELETE | `/api/v1/components/{id}` | Komponente löschen |
| GET | `/api/v1/components/types` | Komponenten-Typen |
| POST | `/api/v1/components/types` | Typ erstellen |
| PUT | `/api/v1/components/types/{id}` | Typ aktualisieren |

---

## Device Management: Services

| Methode | Pfad | Beschreibung |
|---|---|---|
| POST | `/api/v1/services` | Service erstellen |
| GET | `/api/v1/services/{id}` | Einzelnen Service abrufen |
| PUT | `/api/v1/services/{id}` | Service aktualisieren |
| DELETE | `/api/v1/services/{id}` | Service löschen |

---

## Device Management: IP-Adressen

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/ips/{assignmentType}/{assignmentId}` | IPs eines Geräts |
| POST | `/api/v1/ips` | IP-Adresse erstellen |
| PUT | `/api/v1/ips/{id}` | IP-Adresse aktualisieren |
| DELETE | `/api/v1/ips/{id}` | IP-Adresse löschen |

### assignmentType: PC | PERIPHERY

---

## Device Management: Betriebssysteme

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/os` | Alle Betriebssysteme |
| POST | `/api/v1/os` | Betriebssystem erstellen |
| PUT | `/api/v1/os/{id}` | Betriebssystem aktualisieren |
| DELETE | `/api/v1/os/{id}` | Betriebssystem löschen |

---

## Device Management: Hersteller

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/manufacturers` | Alle Hersteller |
| POST | `/api/v1/manufacturers` | Hersteller erstellen |
| PUT | `/api/v1/manufacturers/{id}` | Hersteller aktualisieren |
| DELETE | `/api/v1/manufacturers/{id}` | Hersteller löschen |

---

## Device Management: CPUs

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/cpus` | Alle CPUs |
| POST | `/api/v1/cpus` | CPU erstellen |
| PUT | `/api/v1/cpus/{id}` | CPU aktualisieren |
| DELETE | `/api/v1/cpus/{id}` | CPU löschen |

---

## Device Management: HDD-Typen

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/hddTypes` | Alle HDD-Typen |
| POST | `/api/v1/hddTypes` | HDD-Typ erstellen |
| PUT | `/api/v1/hddTypes/{id}` | HDD-Typ aktualisieren |
| DELETE | `/api/v1/hddTypes/{id}` | HDD-Typ löschen |

---

## Companies (Firmen)

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/companies` | Alle Firmen |
| POST | `/api/v1/companies` | Firma erstellen |
| GET | `/api/v1/companies/{id}` | Einzelne Firma |
| PUT | `/api/v1/companies/{id}` | Firma aktualisieren |

---

## Company Categories

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/companyCategories` | Alle Kategorien |
| POST | `/api/v1/companyCategories` | Kategorie erstellen |
| PUT | `/api/v1/companyCategories/{id}` | Kategorie aktualisieren |
| GET | `/api/v1/companyCategories/types` | Kategorie-Typen |
| POST | `/api/v1/companyCategories/types` | Typ erstellen |
| PUT | `/api/v1/companyCategories/types/{id}` | Typ aktualisieren |

---

## Identify (Name→ID Auflösung)

| Methode | Pfad | Beschreibung |
|---|---|---|
| POST | `/api/v1/identify` | Name zu ID auflösen (Hersteller, CPU, etc.) |

---

## Email Accounts

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/emailAccounts` | E-Mail-Konten einer Firma |
| POST | `/api/v1/emailAccounts` | E-Mail-Konto erstellen |
| PUT | `/api/v1/emailAccounts/{id}` | E-Mail-Konto aktualisieren |
| DELETE | `/api/v1/emailAccounts/{id}` | E-Mail-Konto löschen |
| GET | `/api/v1/emailAccounts/types` | E-Mail-Konto-Typen |

---

## Vacation Requests (Urlaubsanträge)

| Methode | Pfad | Beschreibung |
|---|---|---|
| PUT | `/api/v1/vacationRequests/list` | Urlaubsanträge mit Filtern |
| POST | `/api/v1/vacationRequests` | Urlaubsantrag erstellen |
| PUT | `/api/v1/vacationRequests/{id}` | Urlaubsantrag aktualisieren |
| DELETE | `/api/v1/vacationRequests/{id}` | Urlaubsantrag löschen |
| GET | `/api/v1/vacationRequests/planningAdditionalTypes` | Zusätzliche Planungstypen |
| GET | `/api/v1/vacationRequests/vacationDays` | Urlaubstage-Übersicht |

---

## WebHooks / TANSS Events

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/tanssEvents/rules` | Alle Regeln |
| POST | `/api/v1/tanssEvents/rules` | Regel erstellen |
| GET | `/api/v1/tanssEvents/rules/{id}` | Einzelne Regel |
| PUT | `/api/v1/tanssEvents/rules/{id}` | Regel aktualisieren |
| DELETE | `/api/v1/tanssEvents/rules/{id}` | Regel löschen |
| PUT | `/api/v1/tanssEvents/rules/test/action` | Regel testen |
| GET | `/api/v1/tanssEvents` | Events abrufen |
| GET | `/api/v1/tanssEvents/unseen` | Ungelesene Events |
| POST | `/api/v1/tanssEvents/mark/all/seen` | Alle als gelesen markieren |

---

## Activity Feed

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/tanssEvents` | Activity Feed (= TANSS Events) |

---

## Documents (Firmen-Dokumente)

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/documents` | Firmen-Dokumente abrufen |
| POST | `/api/v1/documents` | Dokument hochladen |
| GET | `/api/v1/documents/{id}` | Einzelnes Dokument |
| DELETE | `/api/v1/documents/{id}` | Dokument löschen |

---

## Domains

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/domains` | Alle Domains |
| POST | `/api/v1/domains` | Domain erstellen |
| GET | `/api/v1/domains/{id}` | Einzelne Domain |
| PUT | `/api/v1/domains/{id}` | Domain aktualisieren |
| DELETE | `/api/v1/domains/{id}` | Domain löschen |

---

## Software Licenses

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | `/api/v1/softwarelicenses` | Alle Software-Lizenzen |
| POST | `/api/v1/softwarelicenses` | Lizenz erstellen |
| GET | `/api/v1/softwarelicenses/{id}` | Einzelne Lizenz |
| PUT | `/api/v1/softwarelicenses/{id}` | Lizenz aktualisieren |
| DELETE | `/api/v1/softwarelicenses/{id}` | Lizenz löschen |
| GET | `/api/v1/softwarelicenses/types` | Lizenz-Typen |
| POST | `/api/v1/softwarelicenses/types` | Lizenz-Typ erstellen |
| PUT | `/api/v1/softwarelicenses/types/{id}` | Lizenz-Typ aktualisieren |
