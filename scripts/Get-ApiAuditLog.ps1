<#
.SYNOPSIS
    Ruft das Audit Log über die API ab.
.DESCRIPTION
    GET /api/v1/audit — Paginiertes Audit Log mit optionalen Filtern.
.PARAMETER BaseUrl
    Die Basis-URL der API. Standard: http://localhost:4000
.PARAMETER Token
    Optional: Bearer Token für authentifizierte Requests.
.PARAMETER Limit
    Anzahl Ergebnisse pro Seite. Standard: 20
.PARAMETER Offset
    Offset für Pagination. Standard: 0
.PARAMETER Entity
    Filter nach Entity (User, File, etc.)
.PARAMETER Action
    Filter nach Action (CREATE, UPDATE, DELETE)
.EXAMPLE
    .\Get-ApiAuditLog.ps1
    .\Get-ApiAuditLog.ps1 -Entity "User" -Action "DELETE"
    .\Get-ApiAuditLog.ps1 -Limit 50 | Select-Object -ExpandProperty data | Format-Table
#>
param(
    [string]$BaseUrl = "http://localhost:4000",
    [string]$Token,
    [int]$Limit = 20,
    [int]$Offset = 0,
    [string]$Entity,
    [string]$Action
)

$headers = @{ "Content-Type" = "application/json" }
if ($Token) { $headers["Authorization"] = "Bearer $Token" }

$query = "limit=$Limit&offset=$Offset"
if ($Entity) { $query += "&entity=$Entity" }
if ($Action) { $query += "&action=$Action" }

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/audit?$query" -Method Get -Headers $headers
    Write-Host "Ergebnis: $($response.data.Count) von $($response.total) Eintr\u00e4gen" -ForegroundColor Cyan
    return $response
}
catch {
    Write-Error "Fehler beim Abrufen des Audit Logs: $_"
}
