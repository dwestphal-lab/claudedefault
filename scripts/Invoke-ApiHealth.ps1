<#
.SYNOPSIS
    Prüft den Health-Status der API.
.DESCRIPTION
    Ruft den /api/v1/health Endpoint auf und gibt den Status von Backend und Datenbank zurück.
.PARAMETER BaseUrl
    Die Basis-URL der API. Standard: http://localhost:4000
.EXAMPLE
    .\Invoke-ApiHealth.ps1
    .\Invoke-ApiHealth.ps1 -BaseUrl "https://api.example.com"
#>
param(
    [string]$BaseUrl = "http://localhost:4000"
)

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/health" -Method Get
    Write-Host "Backend: $($response.status) (v$($response.version))" -ForegroundColor $(if ($response.status -eq "ok") { "Green" } else { "Red" })
    Write-Host "Datenbank: $($response.db)" -ForegroundColor $(if ($response.db -eq "connected") { "Green" } else { "Red" })
    return $response
}
catch {
    Write-Error "API nicht erreichbar: $_"
}
