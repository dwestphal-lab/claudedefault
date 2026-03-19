<#
.SYNOPSIS
    Ruft alle eigenen API Keys ab.
.DESCRIPTION
    GET /api/v1/api-keys — Listet alle API Keys des authentifizierten Benutzers.
.PARAMETER BaseUrl
    Die Basis-URL der API. Standard: http://localhost:4000
.PARAMETER Token
    Optional: Bearer Token für authentifizierte Requests.
.PARAMETER ApiKey
    Optional: API Key als Alternative.
.EXAMPLE
    .\Get-ApiKeys.ps1 -Token $token
    .\Get-ApiKeys.ps1 -ApiKey "ak_..." | Format-Table name, id, expiresAt
#>
param(
    [string]$BaseUrl = "http://localhost:4000",
    [string]$Token,
    [string]$ApiKey
)

$headers = @{ "Content-Type" = "application/json" }
if ($Token) { $headers["Authorization"] = "Bearer $Token" }
if ($ApiKey) { $headers["X-API-Key"] = $ApiKey }

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/api-keys" -Method Get -Headers $headers
    $keys = if ($response.data) { $response.data } else { $response }
    Write-Host "Ergebnis: $($keys.Count) API Key(s)" -ForegroundColor Cyan
    return $response
}
catch {
    Write-Error "Fehler beim Abrufen der API Keys: $_"
}
