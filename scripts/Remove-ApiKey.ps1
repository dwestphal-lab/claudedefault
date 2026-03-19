<#
.SYNOPSIS
    Widerruft einen API Key (Soft Delete).
.DESCRIPTION
    DELETE /api/v1/api-keys/:id — Markiert den API Key als gelöscht.
.PARAMETER KeyId
    Die ID des zu löschenden API Keys.
.PARAMETER BaseUrl
    Die Basis-URL der API. Standard: http://localhost:4000
.PARAMETER Token
    Optional: Bearer Token für authentifizierte Requests.
.PARAMETER ApiKey
    Optional: API Key als Alternative.
.EXAMPLE
    .\Remove-ApiKey.ps1 -KeyId "abc123" -Token $token
    .\Remove-ApiKey.ps1 -KeyId "abc123" -ApiKey "ak_..."
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$KeyId,
    [string]$BaseUrl = "http://localhost:4000",
    [string]$Token,
    [string]$ApiKey
)

$headers = @{ "Content-Type" = "application/json" }
if ($Token) { $headers["Authorization"] = "Bearer $Token" }
if ($ApiKey) { $headers["X-API-Key"] = $ApiKey }

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/api-keys/$KeyId" -Method Delete -Headers $headers
    Write-Host "API Key widerrufen: $KeyId" -ForegroundColor Yellow
    return $response
}
catch {
    Write-Error "Fehler beim Widerrufen des API Keys: $_"
}
