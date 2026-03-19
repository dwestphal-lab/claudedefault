<#
.SYNOPSIS
    Löscht einen Benutzer über die API (Soft Delete).
.DESCRIPTION
    DELETE /api/v1/users/:id — Markiert den Benutzer als gelöscht.
.PARAMETER Id
    Die ID des Benutzers.
.PARAMETER BaseUrl
    Die Basis-URL der API. Standard: http://localhost:4000
.PARAMETER Token
    Optional: Bearer Token.
.PARAMETER ApiKey
    Optional: API Key als Alternative.
.EXAMPLE
    .\Remove-ApiUser.ps1 -Id "abc123"
    .\Remove-ApiUser.ps1 -Id "abc123" -ApiKey "ak_..."
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$Id,
    [string]$BaseUrl = "http://localhost:4000",
    [string]$Token,
    [string]$ApiKey
)

$headers = @{ "Content-Type" = "application/json" }
if ($Token) { $headers["Authorization"] = "Bearer $Token" }
if ($ApiKey) { $headers["X-API-Key"] = $ApiKey }

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/users/$Id" -Method Delete -Headers $headers
    Write-Host "Benutzer gelöscht" -ForegroundColor Yellow
    return $response
}
catch {
    Write-Error "Fehler beim Löschen: $_"
}
