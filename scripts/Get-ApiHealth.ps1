<#
.SYNOPSIS
    Zeigt detaillierten Health-Status der API an.
.DESCRIPTION
    GET /api/v1/health — Ruft den Health-Endpoint auf und zeigt Status von
    Backend, Datenbank, Redis und Version mit farbiger Ausgabe.
.PARAMETER BaseUrl
    Die Basis-URL der API. Standard: http://localhost:4000
.PARAMETER Token
    Optional: Bearer Token für authentifizierte Requests.
.PARAMETER ApiKey
    Optional: API Key als Alternative.
.EXAMPLE
    .\Get-ApiHealth.ps1
    .\Get-ApiHealth.ps1 -BaseUrl "https://api.example.com"
#>
param(
    [string]$BaseUrl = "http://localhost:4000",
    [string]$Token,
    [string]$ApiKey
)

$headers = @{ "Content-Type" = "application/json" }
if ($Token) { $headers["Authorization"] = "Bearer $Token" }
if ($ApiKey) { $headers["X-API-Key"] = $ApiKey }

function Get-StatusColor {
    param([string]$Value)
    switch ($Value) {
        "ok"         { return "Green" }
        "connected"  { return "Green" }
        "disabled"   { return "Yellow" }
        "skipped"    { return "Yellow" }
        default      { return "Red" }
    }
}

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/health" -Method Get -Headers $headers

    Write-Host ""
    Write-Host "=== API Health Check ===" -ForegroundColor Cyan
    Write-Host ""

    # Status
    $statusColor = Get-StatusColor $response.status
    Write-Host "  Status:   " -NoNewline
    Write-Host "$($response.status)" -ForegroundColor $statusColor

    # Version
    if ($response.version) {
        Write-Host "  Version:  " -NoNewline
        Write-Host "v$($response.version)" -ForegroundColor Cyan
    }

    # Datenbank
    if ($response.db) {
        $dbColor = Get-StatusColor $response.db
        Write-Host "  Datenbank:" -NoNewline
        Write-Host " $($response.db)" -ForegroundColor $dbColor
    }

    # Redis
    if ($null -ne $response.redis) {
        $redisColor = Get-StatusColor $response.redis
        Write-Host "  Redis:    " -NoNewline
        Write-Host "$($response.redis)" -ForegroundColor $redisColor
    }

    # Uptime
    if ($response.uptime) {
        Write-Host "  Uptime:   " -NoNewline
        Write-Host "$($response.uptime)s" -ForegroundColor Cyan
    }

    Write-Host ""
    return $response
}
catch {
    Write-Error "API nicht erreichbar: $_"
}
