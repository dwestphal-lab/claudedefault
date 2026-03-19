<#
.SYNOPSIS
    Lädt eine Datei über die API hoch.
.DESCRIPTION
    POST /api/v1/files — Multipart File Upload.
.PARAMETER FilePath
    Pfad zur hochzuladenden Datei.
.PARAMETER BaseUrl
    Die Basis-URL der API. Standard: http://localhost:4000
.PARAMETER Token
    Optional: Bearer Token für authentifizierte Requests.
.EXAMPLE
    .\Send-ApiFile.ps1 -FilePath "C:\Daten\report.pdf"
    .\Send-ApiFile.ps1 -FilePath ".\users.csv" -Token $token
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,

    [string]$BaseUrl = "http://localhost:4000",

    [string]$Token
)

if (-not (Test-Path $FilePath)) {
    Write-Error "Datei nicht gefunden: $FilePath"
    exit 1
}

$headers = @{}
if ($Token) { $headers["Authorization"] = "Bearer $Token" }

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/files" -Method Post -Headers $headers -Form @{
        file = Get-Item $FilePath
    }
    Write-Host "Datei hochgeladen: $($response.name) ($($response.id))" -ForegroundColor Green
    return $response
}
catch {
    Write-Error "Fehler beim Hochladen: $_"
}
