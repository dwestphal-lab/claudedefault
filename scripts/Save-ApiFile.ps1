<#
.SYNOPSIS
    Lädt eine Datei über die API herunter.
.DESCRIPTION
    GET /api/v1/files/:id/download — Lädt eine Datei anhand der ID herunter.
    Verwendet den Dateinamen aus Content-Disposition Header oder Fallback.
.PARAMETER FileId
    Die ID der herunterzuladenden Datei.
.PARAMETER OutputPath
    Zielverzeichnis für die Datei. Standard: aktuelles Verzeichnis.
.PARAMETER BaseUrl
    Die Basis-URL der API. Standard: http://localhost:4000
.PARAMETER Token
    Optional: Bearer Token für authentifizierte Requests.
.PARAMETER ApiKey
    Optional: API Key als Alternative.
.EXAMPLE
    .\Save-ApiFile.ps1 -FileId "abc123"
    .\Save-ApiFile.ps1 -FileId "abc123" -OutputPath "C:\Downloads" -Token $token
    .\Save-ApiFile.ps1 -FileId "abc123" -ApiKey "ak_..."
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$FileId,
    [string]$OutputPath = ".",
    [string]$BaseUrl = "http://localhost:4000",
    [string]$Token,
    [string]$ApiKey
)

$headers = @{}
if ($Token) { $headers["Authorization"] = "Bearer $Token" }
if ($ApiKey) { $headers["X-API-Key"] = $ApiKey }

if (-not (Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
}

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/v1/files/$FileId/download" -Method Get -Headers $headers

    # Dateiname aus Content-Disposition Header extrahieren
    $fileName = $null
    $disposition = $response.Headers["Content-Disposition"]
    if ($disposition) {
        $dispositionValue = if ($disposition -is [array]) { $disposition[0] } else { $disposition }
        if ($dispositionValue -match 'filename="?([^";\s]+)"?') {
            $fileName = $Matches[1]
        }
    }

    if (-not $fileName) {
        $fileName = "download_$FileId"
    }

    $outFile = Join-Path $OutputPath $fileName
    [System.IO.File]::WriteAllBytes($outFile, $response.Content)

    $size = (Get-Item $outFile).Length / 1KB
    Write-Host "Datei gespeichert: $outFile ($([math]::Round($size, 1)) KB)" -ForegroundColor Green
    return $outFile
}
catch {
    Write-Error "Fehler beim Herunterladen der Datei: $_"
}
