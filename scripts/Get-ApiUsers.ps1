<#
.SYNOPSIS
    Ruft Benutzer paginiert über die API ab.
.DESCRIPTION
    GET /api/v1/users — Gibt eine paginierte Liste der Benutzer als PowerShell-Objekte zurück.
.PARAMETER BaseUrl
    Die Basis-URL der API. Standard: http://localhost:4000
.PARAMETER Token
    Optional: Bearer Token für authentifizierte Requests (Entra ID).
.PARAMETER Limit
    Anzahl Ergebnisse pro Seite. Standard: 20
.PARAMETER Offset
    Offset für Pagination. Standard: 0
.EXAMPLE
    .\Get-ApiUsers.ps1
    .\Get-ApiUsers.ps1 -Token $accessToken -Limit 50
    .\Get-ApiUsers.ps1 | Select-Object -ExpandProperty data | Format-Table
    .\Get-ApiUsers.ps1 | Select-Object -ExpandProperty data | Export-Csv -Path users.csv -NoTypeInformation
#>
param(
    [string]$BaseUrl = "http://localhost:4000",
    [string]$Token,
    [string]$ApiKey,
    [int]$Limit = 20,
    [int]$Offset = 0
)

$headers = @{ "Content-Type" = "application/json" }
if ($Token) { $headers["Authorization"] = "Bearer $Token" }
if ($ApiKey) { $headers["X-API-Key"] = $ApiKey }

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/users?limit=$Limit&offset=$Offset" -Method Get -Headers $headers
    Write-Host "Ergebnis: $($response.data.Count) von $($response.total) Benutzern (Offset: $($response.offset))" -ForegroundColor Cyan
    return $response
}
catch {
    Write-Error "Fehler beim Abrufen der Benutzer: $_"
}
