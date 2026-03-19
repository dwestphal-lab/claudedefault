<#
.SYNOPSIS
    Aktualisiert einen Benutzer über die API.
.DESCRIPTION
    PUT /api/v1/users/:id — Name und/oder Rolle ändern.
.PARAMETER Id
    Die ID des Benutzers.
.PARAMETER Name
    Neuer Name (optional).
.PARAMETER Role
    Neue Rolle: ADMIN oder USER (optional).
.PARAMETER BaseUrl
    Die Basis-URL der API. Standard: http://localhost:4000
.PARAMETER Token
    Optional: Bearer Token oder API Key.
.PARAMETER ApiKey
    Optional: API Key als Alternative zum Token.
.EXAMPLE
    .\Update-ApiUser.ps1 -Id "abc123" -Name "Neuer Name"
    .\Update-ApiUser.ps1 -Id "abc123" -Role "ADMIN" -ApiKey "ak_..."
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$Id,
    [string]$Name,
    [string]$Role,
    [string]$BaseUrl = "http://localhost:4000",
    [string]$Token,
    [string]$ApiKey
)

$body = @{}
if ($Name) { $body["name"] = $Name }
if ($Role) { $body["role"] = $Role }

if ($body.Count -eq 0) {
    Write-Error "Mindestens -Name oder -Role angeben."
    exit 1
}

$headers = @{ "Content-Type" = "application/json" }
if ($Token) { $headers["Authorization"] = "Bearer $Token" }
if ($ApiKey) { $headers["X-API-Key"] = $ApiKey }

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/users/$Id" -Method Put -Headers $headers -Body ($body | ConvertTo-Json)
    Write-Host "Benutzer aktualisiert: $($response.id)" -ForegroundColor Green
    return $response
}
catch {
    Write-Error "Fehler beim Aktualisieren: $_"
}
