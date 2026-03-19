<#
.SYNOPSIS
    Importiert Benutzer aus einer CSV-Datei über die API.
.DESCRIPTION
    Liest eine CSV-Datei mit Spalten "email" und "name" und erstellt Benutzer via POST /api/v1/users.
    Bereits existierende E-Mails werden übersprungen (409).
.PARAMETER CsvPath
    Pfad zur CSV-Datei.
.PARAMETER BaseUrl
    Die Basis-URL der API. Standard: http://localhost:4000
.PARAMETER Token
    Optional: Bearer Token.
.PARAMETER ApiKey
    Optional: API Key als Alternative.
.EXAMPLE
    .\Import-ApiUsers.ps1 -CsvPath ".\users.csv"
    .\Import-ApiUsers.ps1 -CsvPath ".\users.csv" -ApiKey "ak_..."
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$CsvPath,
    [string]$BaseUrl = "http://localhost:4000",
    [string]$Token,
    [string]$ApiKey
)

if (-not (Test-Path $CsvPath)) {
    Write-Error "CSV-Datei nicht gefunden: $CsvPath"
    exit 1
}

$headers = @{ "Content-Type" = "application/json" }
if ($Token) { $headers["Authorization"] = "Bearer $Token" }
if ($ApiKey) { $headers["X-API-Key"] = $ApiKey }

$users = Import-Csv $CsvPath
$created = 0
$skipped = 0
$errors = 0

foreach ($user in $users) {
    $body = @{ email = $user.email }
    if ($user.name) { $body["name"] = $user.name }

    try {
        Invoke-RestMethod -Uri "$BaseUrl/api/v1/users" -Method Post -Headers $headers -Body ($body | ConvertTo-Json) | Out-Null
        $created++
        Write-Host "  Erstellt: $($user.email)" -ForegroundColor Green
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 409) {
            $skipped++
            Write-Host "  Übersprungen (existiert): $($user.email)" -ForegroundColor Yellow
        }
        else {
            $errors++
            Write-Host "  Fehler: $($user.email) - $_" -ForegroundColor Red
        }
    }
}

Write-Host "`nImport abgeschlossen: $created erstellt, $skipped übersprungen, $errors Fehler" -ForegroundColor Cyan
