<#
.SYNOPSIS
    Erstellt einen neuen Benutzer über die API.
.DESCRIPTION
    POST /api/v1/users — Legt einen Benutzer mit E-Mail und optionalem Namen an.
.PARAMETER Email
    Die E-Mail-Adresse des Benutzers (Pflichtfeld).
.PARAMETER Name
    Der Anzeigename des Benutzers (optional).
.PARAMETER BaseUrl
    Die Basis-URL der API. Standard: http://localhost:4000
.PARAMETER Token
    Optional: Bearer Token für authentifizierte Requests (Entra ID).
.EXAMPLE
    .\New-ApiUser.ps1 -Email "max@example.com" -Name "Max Mustermann"
    .\New-ApiUser.ps1 -Email "test@example.com"
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$Email,

    [string]$Name,

    [string]$BaseUrl = "http://localhost:4000",

    [string]$Token
)

$body = @{ email = $Email }
if ($Name) { $body["name"] = $Name }

$headers = @{ "Content-Type" = "application/json" }
if ($Token) {
    $headers["Authorization"] = "Bearer $Token"
}

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/users" -Method Post -Headers $headers -Body ($body | ConvertTo-Json)
    Write-Host "Benutzer erstellt: $($response.id)" -ForegroundColor Green
    return $response
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 409) {
        Write-Warning "E-Mail '$Email' ist bereits vergeben."
    }
    elseif ($statusCode -eq 400) {
        Write-Error "Validierungsfehler: $_"
    }
    else {
        Write-Error "Fehler beim Erstellen des Benutzers: $_"
    }
}
