<#
.SYNOPSIS
    Erstellt einen neuen API Key.
.DESCRIPTION
    POST /api/v1/api-keys — Erstellt einen API Key zur Nutzung mit X-API-Key Header.
    Der Key wird nur einmal angezeigt!
.PARAMETER Name
    Beschreibender Name für den Key.
.PARAMETER ExpiresInDays
    Optional: Gültigkeitsdauer in Tagen (1-365).
.PARAMETER BaseUrl
    Die Basis-URL der API. Standard: http://localhost:4000
.PARAMETER Token
    Bearer Token für Authentifizierung.
.EXAMPLE
    .\New-ApiKey.ps1 -Name "PowerShell Automation" -Token $token
    .\New-ApiKey.ps1 -Name "CI/CD" -ExpiresInDays 90 -Token $token
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [int]$ExpiresInDays,
    [string]$BaseUrl = "http://localhost:4000",
    [Parameter(Mandatory = $true)]
    [string]$Token
)

$body = @{ name = $Name }
if ($ExpiresInDays -gt 0) { $body["expiresInDays"] = $ExpiresInDays }

$headers = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $Token"
}

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/api-keys" -Method Post -Headers $headers -Body ($body | ConvertTo-Json)
    Write-Host "API Key erstellt: $($response.name)" -ForegroundColor Green
    Write-Host "Key: $($response.key)" -ForegroundColor Cyan
    Write-Host "ACHTUNG: Der Key wird nur einmal angezeigt!" -ForegroundColor Yellow
    return $response
}
catch {
    Write-Error "Fehler beim Erstellen des API Keys: $_"
}
