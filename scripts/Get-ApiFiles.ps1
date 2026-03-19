<#
.SYNOPSIS
    Ruft alle Dateien über die API ab.
.DESCRIPTION
    GET /api/v1/files — Paginierte Dateiliste.
.PARAMETER BaseUrl
    Die Basis-URL der API. Standard: http://localhost:4000
.PARAMETER Token
    Optional: Bearer Token für authentifizierte Requests.
.PARAMETER Limit
    Anzahl Ergebnisse pro Seite. Standard: 20
.PARAMETER Offset
    Offset für Pagination. Standard: 0
.EXAMPLE
    .\Get-ApiFiles.ps1
    .\Get-ApiFiles.ps1 -Limit 50 | Select-Object -ExpandProperty data | Format-Table
#>
param(
    [string]$BaseUrl = "http://localhost:4000",
    [string]$Token,
    [int]$Limit = 20,
    [int]$Offset = 0
)

$headers = @{ "Content-Type" = "application/json" }
if ($Token) { $headers["Authorization"] = "Bearer $Token" }

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/files?limit=$Limit&offset=$Offset" -Method Get -Headers $headers
    Write-Host "Ergebnis: $($response.data.Count) von $($response.total) Dateien" -ForegroundColor Cyan
    return $response
}
catch {
    Write-Error "Fehler beim Abrufen der Dateien: $_"
}
