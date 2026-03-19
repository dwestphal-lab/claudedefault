<#
.SYNOPSIS
    Initialisiert das Projekt mit konfigurierbaren Ports.
.DESCRIPTION
    Liest die Root .env (oder erstellt sie aus .env.example) und generiert
    die backend/.env und frontend/.env mit den richtigen Ports.
    Ermöglicht mehrere Instanzen auf demselben Server.
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
param(
    [int]$AppPort = 80,
    [int]$BackendPort = 4000,
    [int]$FrontendPort = 3000,
    [int]$DbPort = 5432,
    [string]$PostgresUser = "app",
    [string]$PostgresPassword = "secret",
    [string]$PostgresDb = "appdb"
)

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "Projekt initialisieren..." -ForegroundColor Cyan
Write-Host "  APP_PORT:      $AppPort" -ForegroundColor Gray
Write-Host "  BACKEND_PORT:  $BackendPort" -ForegroundColor Gray
Write-Host "  FRONTEND_PORT: $FrontendPort" -ForegroundColor Gray
Write-Host "  DB_PORT:       $DbPort" -ForegroundColor Gray

# --- Root .env ---
$rootEnv = @"
# Port-Konfiguration
APP_PORT=$AppPort
BACKEND_PORT=$BackendPort
FRONTEND_PORT=$FrontendPort
DB_PORT=$DbPort

# PostgreSQL
POSTGRES_USER=$PostgresUser
POSTGRES_PASSWORD=$PostgresPassword
POSTGRES_DB=$PostgresDb

# Auth (optional)
AZURE_AD_TENANT_ID=
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
NEXTAUTH_SECRET=$(
    -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
)

# Optional
REDIS_URL=
SENTRY_DSN=
CORS_ORIGIN=http://localhost:$FrontendPort
"@

$rootEnvPath = Join-Path $projectRoot ".env"
if (-not (Test-Path $rootEnvPath)) {
    $rootEnv | Set-Content -Path $rootEnvPath -Encoding UTF8
    Write-Host "  .env erstellt" -ForegroundColor Green
} else {
    Write-Host "  .env existiert bereits — wird nicht überschrieben" -ForegroundColor Yellow
    Write-Host "  Ports werden aus bestehender .env gelesen..." -ForegroundColor Yellow

    # Ports aus bestehender .env lesen
    Get-Content $rootEnvPath | ForEach-Object {
        if ($_ -match "^APP_PORT=(\d+)") { $AppPort = [int]$Matches[1] }
        if ($_ -match "^BACKEND_PORT=(\d+)") { $BackendPort = [int]$Matches[1] }
        if ($_ -match "^FRONTEND_PORT=(\d+)") { $FrontendPort = [int]$Matches[1] }
        if ($_ -match "^DB_PORT=(\d+)") { $DbPort = [int]$Matches[1] }
        if ($_ -match "^POSTGRES_USER=(.+)") { $PostgresUser = $Matches[1] }
        if ($_ -match "^POSTGRES_PASSWORD=(.+)") { $PostgresPassword = $Matches[1] }
        if ($_ -match "^POSTGRES_DB=(.+)") { $PostgresDb = $Matches[1] }
    }

    Write-Host "  Gelesene Ports: APP=$AppPort, BACKEND=$BackendPort, FRONTEND=$FrontendPort, DB=$DbPort" -ForegroundColor Gray
}

# --- Backend .env ---
$backendEnv = @"
DATABASE_URL=postgresql://${PostgresUser}:${PostgresPassword}@localhost:${DbPort}/${PostgresDb}
CORS_ORIGIN=http://localhost:$FrontendPort
PORT=$BackendPort
NODE_ENV=development
"@

$backendEnvPath = Join-Path $projectRoot "backend\.env"
$backendEnv | Set-Content -Path $backendEnvPath -Encoding UTF8
Write-Host "  backend/.env generiert (Port $BackendPort, DB-Port $DbPort)" -ForegroundColor Green

# --- Frontend .env ---
$frontendEnv = @"
NEXT_PUBLIC_API_URL=http://localhost:$BackendPort
NEXTAUTH_URL=http://localhost:$FrontendPort
NEXTAUTH_SECRET=dev-secret-change-in-production
"@

$frontendEnvPath = Join-Path $projectRoot "frontend\.env"
$frontendEnv | Set-Content -Path $frontendEnvPath -Encoding UTF8
Write-Host "  frontend/.env generiert (Port $FrontendPort, API auf $BackendPort)" -ForegroundColor Green

Write-Host ""
Write-Host "Fertig! Nächste Schritte:" -ForegroundColor Cyan
Write-Host "  npm run dev:db     # PostgreSQL starten (Port $DbPort)" -ForegroundColor White
Write-Host "  npm run dev        # Backend ($BackendPort) + Frontend ($FrontendPort)" -ForegroundColor White
Write-Host "  npm run docker:up  # Full Stack mit Nginx (Port $AppPort)" -ForegroundColor White
