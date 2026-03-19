#Requires -Version 5.1
<#
.SYNOPSIS
    Initialisiert das Projekt mit konfigurierbaren Ports.
.DESCRIPTION
    Liest die Root .env (oder erstellt sie aus .env.example) und generiert
    die backend/.env und frontend/.env mit den richtigen Ports.
    Ermoeglicht mehrere Instanzen auf demselben Server.
.PARAMETER AppPort
    Nginx Port (Production). Standard: 80
.PARAMETER BackendPort
    Backend API Port. Standard: 4000
.PARAMETER FrontendPort
    Frontend Dev-Server Port. Standard: 3000
.PARAMETER DbPort
    PostgreSQL Port (nur Dev). Standard: 5432
.EXAMPLE
    # Standard-Ports
    .\scripts\Init-Project.ps1

    # Zweite Instanz auf anderen Ports
    .\scripts\Init-Project.ps1 -AppPort 8080 -BackendPort 4001 -FrontendPort 3001 -DbPort 5433
#>
[CmdletBinding()]
param(
    [ValidateRange(1, 65535)]
    [int]$AppPort = 80,

    [ValidateRange(1, 65535)]
    [int]$BackendPort = 4000,

    [ValidateRange(1, 65535)]
    [int]$FrontendPort = 3000,

    [ValidateRange(1, 65535)]
    [int]$DbPort = 5432,

    [string]$PostgresUser = "app",
    [string]$PostgresPassword = "secret",
    [string]$PostgresDb = "appdb"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

# NEXTAUTH_SECRET generieren (kryptographisch sichere Zufallszeichen)
$secretChars = @()
$charPool = ((65..90) + (97..122) + (48..57))
for ($i = 0; $i -lt 32; $i++) {
    $secretChars += [char]($charPool | Get-Random)
}
$NextAuthSecret = -join $secretChars

Write-Host "Projekt initialisieren..." -ForegroundColor Cyan
Write-Host "  APP_PORT:      $AppPort" -ForegroundColor Gray
Write-Host "  BACKEND_PORT:  $BackendPort" -ForegroundColor Gray
Write-Host "  FRONTEND_PORT: $FrontendPort" -ForegroundColor Gray
Write-Host "  DB_PORT:       $DbPort" -ForegroundColor Gray

# --- Hilfsfunktion: .env als BOM-freies UTF-8 schreiben ---
function Write-EnvFile {
    param(
        [string]$Path,
        [string[]]$Lines
    )
    $parentDir = Split-Path -Parent $Path
    if (-not (Test-Path $parentDir)) {
        Write-Error "Verzeichnis nicht gefunden: $parentDir"
        return
    }
    $content = ($Lines -join "`r`n") + "`r`n"
    [System.IO.File]::WriteAllText($Path, $content, (New-Object System.Text.UTF8Encoding $false))
}

# --- Root .env ---
$rootEnvPath = Join-Path $projectRoot ".env"
if (-not (Test-Path $rootEnvPath)) {
    $rootEnvLines = @(
        "# Port-Konfiguration",
        "APP_PORT=$AppPort",
        "BACKEND_PORT=$BackendPort",
        "FRONTEND_PORT=$FrontendPort",
        "DB_PORT=$DbPort",
        "",
        "# PostgreSQL",
        "POSTGRES_USER=$PostgresUser",
        "POSTGRES_PASSWORD=$PostgresPassword",
        "POSTGRES_DB=$PostgresDb",
        "",
        "# Auth (optional)",
        "AZURE_AD_TENANT_ID=",
        "AZURE_AD_CLIENT_ID=",
        "AZURE_AD_CLIENT_SECRET=",
        "NEXTAUTH_SECRET=$NextAuthSecret",
        "",
        "# Optional",
        "REDIS_URL=",
        "SENTRY_DSN=",
        "CORS_ORIGIN=http://localhost:$FrontendPort"
    )
    Write-EnvFile -Path $rootEnvPath -Lines $rootEnvLines
    Write-Host "  .env erstellt" -ForegroundColor Green
} else {
    Write-Host "  .env existiert bereits - wird nicht ueberschrieben" -ForegroundColor Yellow
    Write-Host "  Ports werden aus bestehender .env gelesen..." -ForegroundColor Yellow

    # Ports aus bestehender .env lesen (foreach statt ForEach-Object wegen Scoping)
    foreach ($line in (Get-Content $rootEnvPath)) {
        if ($line -match "^APP_PORT=(\d+)") { $AppPort = [int]$Matches[1] }
        if ($line -match "^BACKEND_PORT=(\d+)") { $BackendPort = [int]$Matches[1] }
        if ($line -match "^FRONTEND_PORT=(\d+)") { $FrontendPort = [int]$Matches[1] }
        if ($line -match "^DB_PORT=(\d+)") { $DbPort = [int]$Matches[1] }
        if ($line -match "^POSTGRES_USER=(.+)$") { $PostgresUser = $Matches[1].Trim() }
        if ($line -match "^POSTGRES_PASSWORD=(.+)$") { $PostgresPassword = $Matches[1].Trim() }
        if ($line -match "^POSTGRES_DB=(.+)$") { $PostgresDb = $Matches[1].Trim() }
        if ($line -match "^NEXTAUTH_SECRET=(.+)$") { $NextAuthSecret = $Matches[1].Trim() }
    }

    Write-Host "  Gelesene Ports: APP=$AppPort, BACKEND=$BackendPort, FRONTEND=$FrontendPort, DB=$DbPort" -ForegroundColor Gray
}

# --- Backend .env ---
$backendDir = Join-Path $projectRoot "backend"
$backendEnvPath = Join-Path $backendDir ".env"
$backendEnvLines = @(
    "DATABASE_URL=postgresql://${PostgresUser}:${PostgresPassword}@localhost:${DbPort}/${PostgresDb}",
    "CORS_ORIGIN=http://localhost:$FrontendPort",
    "PORT=$BackendPort",
    "NODE_ENV=development"
)
Write-EnvFile -Path $backendEnvPath -Lines $backendEnvLines
Write-Host "  backend/.env generiert (Port $BackendPort, DB-Port $DbPort)" -ForegroundColor Green

# --- Frontend .env ---
$frontendDir = Join-Path $projectRoot "frontend"
$frontendEnvPath = Join-Path $frontendDir ".env"
$frontendEnvLines = @(
    "NEXT_PUBLIC_API_URL=http://localhost:$BackendPort",
    "NEXTAUTH_URL=http://localhost:$FrontendPort",
    "NEXTAUTH_SECRET=$NextAuthSecret"
)
Write-EnvFile -Path $frontendEnvPath -Lines $frontendEnvLines
Write-Host "  frontend/.env generiert (Port $FrontendPort, API auf $BackendPort)" -ForegroundColor Green

Write-Host ""
Write-Host "Fertig! Naechste Schritte:" -ForegroundColor Cyan
Write-Host "  npm run dev:db     # PostgreSQL starten (Port $DbPort)" -ForegroundColor White
Write-Host "  npm run dev        # Backend ($BackendPort) + Frontend ($FrontendPort)" -ForegroundColor White
Write-Host "  npm run docker:up  # Full Stack mit Nginx (Port $AppPort)" -ForegroundColor White
