# PowerShell Scripts

## Übersicht

| Script | Beschreibung |
|---|---|
| `Init-Project.ps1` | Projekt initialisieren, Ports + .env generieren |
| `Invoke-ApiHealth.ps1` | Health-Check (schnell) |
| `Get-ApiHealth.ps1` | Health-Check (detailliert, farbcodiert) |
| `Get-ApiUsers.ps1` | Benutzer paginiert abrufen |
| `New-ApiUser.ps1` | Neuen Benutzer anlegen |
| `Update-ApiUser.ps1` | Benutzer aktualisieren (Name/Rolle) |
| `Remove-ApiUser.ps1` | Benutzer löschen (Soft Delete) |
| `Import-ApiUsers.ps1` | Bulk-Import aus CSV-Datei |
| `Get-ApiFiles.ps1` | Dateien paginiert abrufen |
| `Send-ApiFile.ps1` | Datei hochladen |
| `Save-ApiFile.ps1` | Datei herunterladen |
| `Get-ApiAuditLog.ps1` | Audit Log abrufen (filterbar) |
| `New-ApiKey.ps1` | API Key erstellen |
| `Get-ApiKeys.ps1` | Eigene API Keys auflisten |
| `Remove-ApiKey.ps1` | API Key widerrufen |
| `Get-EntraIdToken.ps1` | Entra ID Access Token holen |
| `Backup-Database.ps1` | PostgreSQL Backup mit Rotation |
| `Restore-Database.ps1` | PostgreSQL Backup wiederherstellen |

## Authentifizierung

Alle API-Scripts unterstützen drei Auth-Varianten:

```powershell
# 1. Ohne Auth (lokal, wenn AZURE_AD_TENANT_ID nicht gesetzt)
.\scripts\Get-ApiUsers.ps1

# 2. Mit Bearer Token (Entra ID)
$token = .\scripts\Get-EntraIdToken.ps1 -TenantId "..." -ClientId "..." -ClientSecret "..."
.\scripts\Get-ApiUsers.ps1 -Token $token

# 3. Mit API Key (einfacher für Automation)
.\scripts\Get-ApiUsers.ps1 -ApiKey "ak_..."
```

## Standardparameter

| Parameter | Default | Beschreibung |
|---|---|---|
| `-BaseUrl` | `http://localhost:4000` | API-Basis-URL |
| `-Token` | — | Bearer Token (Entra ID) |
| `-ApiKey` | — | API Key (X-API-Key Header) |

## Beispiele

### Benutzer-Management

```powershell
# Alle Benutzer abrufen
.\scripts\Get-ApiUsers.ps1 -Limit 50

# Benutzer erstellen
.\scripts\New-ApiUser.ps1 -Email "user@example.com" -Name "Max Mustermann"

# Benutzer aktualisieren
.\scripts\Update-ApiUser.ps1 -UserId "cuid..." -Name "Neuer Name" -Role "ADMIN"

# Benutzer löschen (Soft Delete)
.\scripts\Remove-ApiUser.ps1 -UserId "cuid..."

# Bulk-Import (CSV: email,name)
.\scripts\Import-ApiUsers.ps1 -CsvPath ".\users.csv"
```

### Datei-Management

```powershell
# Datei hochladen
.\scripts\Send-ApiFile.ps1 -FilePath ".\dokument.pdf"

# Dateien auflisten
.\scripts\Get-ApiFiles.ps1

# Datei herunterladen
.\scripts\Save-ApiFile.ps1 -FileId "cuid..."
```

### API Keys

```powershell
# Key erstellen (wird nur einmal angezeigt!)
.\scripts\New-ApiKey.ps1 -Name "Automation" -Token $token

# Keys auflisten
.\scripts\Get-ApiKeys.ps1 -Token $token

# Key widerrufen
.\scripts\Remove-ApiKey.ps1 -KeyId "cuid..." -Token $token
```

### Datenbank

```powershell
# Backup erstellen
.\scripts\Backup-Database.ps1
.\scripts\Backup-Database.ps1 -KeepDays 30   # Mit Rotation

# Backup wiederherstellen
.\scripts\Restore-Database.ps1 -BackupFile ".\data\backups\backup_2026-03-19.sql"
```
