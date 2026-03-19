<#
.SYNOPSIS
    Erstellt ein PostgreSQL Backup der Datenbank.
.DESCRIPTION
    Nutzt pg_dump via Docker, um ein Backup der Datenbank zu erstellen.
    Backups werden unter ./data/backups/ mit Timestamp gespeichert.
.PARAMETER ComposeFile
    Docker Compose Datei. Standard: docker-compose.dev.yml
.PARAMETER KeepDays
    Anzahl Tage, die Backups behalten werden. Standard: 7
.EXAMPLE
    .\Backup-Database.ps1
    .\Backup-Database.ps1 -KeepDays 30
#>
param(
    [string]$ComposeFile = "docker-compose.dev.yml",
    [int]$KeepDays = 7
)

$backupDir = Join-Path $PSScriptRoot "..\data\backups"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupFile = Join-Path $backupDir "backup_$timestamp.sql"

Write-Host "Erstelle Backup..." -ForegroundColor Cyan

try {
    docker compose -f $ComposeFile exec -T db pg_dump -U app appdb > $backupFile
    $size = (Get-Item $backupFile).Length / 1KB
    Write-Host "Backup erstellt: $backupFile ($([math]::Round($size, 1)) KB)" -ForegroundColor Green
}
catch {
    Write-Error "Backup fehlgeschlagen: $_"
    exit 1
}

# Alte Backups aufräumen
$cutoff = (Get-Date).AddDays(-$KeepDays)
$old = Get-ChildItem $backupDir -Filter "backup_*.sql" | Where-Object { $_.CreationTime -lt $cutoff }
if ($old) {
    $old | Remove-Item -Force
    Write-Host "$($old.Count) alte Backup(s) gelöscht (älter als $KeepDays Tage)" -ForegroundColor Yellow
}
