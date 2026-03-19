<#
.SYNOPSIS
    Stellt ein PostgreSQL Backup wieder her.
.DESCRIPTION
    Stellt eine .sql Backup-Datei wieder her, die mit Backup-Database.ps1 erstellt wurde.
    Die Datenbank wird gelöscht und neu erstellt, bevor das Backup eingespielt wird.
    ACHTUNG: Dieser Vorgang ist destruktiv — alle aktuellen Daten gehen verloren!
.PARAMETER BackupFile
    Pfad zur .sql Backup-Datei.
.PARAMETER ContainerName
    Name des Docker-Containers. Standard: claudedefault-db-1
.PARAMETER DbName
    Name der Datenbank. Standard: appdb
.PARAMETER DbUser
    Datenbankbenutzer. Standard: app
.EXAMPLE
    .\Restore-Database.ps1 -BackupFile ".\data\backups\backup_2026-03-19_120000.sql"
    .\Restore-Database.ps1 -BackupFile ".\data\backups\backup_2026-03-19_120000.sql" -ContainerName "myapp-db-1"
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,
    [string]$ContainerName = "claudedefault-db-1",
    [string]$DbName = "appdb",
    [string]$DbUser = "app"
)

if (-not (Test-Path $BackupFile)) {
    Write-Error "Backup-Datei nicht gefunden: $BackupFile"
    exit 1
}

$backupSize = (Get-Item $BackupFile).Length / 1KB
Write-Host "Backup-Datei: $BackupFile ($([math]::Round($backupSize, 1)) KB)" -ForegroundColor Cyan
Write-Host ""
Write-Host "WARNUNG: Dieser Vorgang löscht die Datenbank '$DbName' und stellt das Backup wieder her!" -ForegroundColor Red
Write-Host "Alle aktuellen Daten gehen verloren!" -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Fortfahren? (ja/nein)"
if ($confirm -ne "ja") {
    Write-Host "Abgebrochen." -ForegroundColor Yellow
    exit 0
}

try {
    Write-Host "Trenne bestehende Verbindungen..." -ForegroundColor Cyan
    docker exec $ContainerName psql -U $DbUser -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DbName' AND pid <> pg_backend_pid();" 2>$null | Out-Null

    Write-Host "Lösche Datenbank '$DbName'..." -ForegroundColor Cyan
    docker exec $ContainerName dropdb -U $DbUser --if-exists $DbName
    if ($LASTEXITCODE -ne 0) { throw "Fehler beim Löschen der Datenbank" }

    Write-Host "Erstelle Datenbank '$DbName'..." -ForegroundColor Cyan
    docker exec $ContainerName createdb -U $DbUser $DbName
    if ($LASTEXITCODE -ne 0) { throw "Fehler beim Erstellen der Datenbank" }

    Write-Host "Stelle Backup wieder her..." -ForegroundColor Cyan
    Get-Content $BackupFile -Raw | docker exec -i $ContainerName psql -U $DbUser -d $DbName
    if ($LASTEXITCODE -ne 0) { throw "Fehler beim Wiederherstellen des Backups" }

    Write-Host "Datenbank '$DbName' erfolgreich wiederhergestellt!" -ForegroundColor Green
}
catch {
    Write-Error "Wiederherstellung fehlgeschlagen: $_"
    exit 1
}
