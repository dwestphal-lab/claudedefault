<#
.SYNOPSIS
    Holt ein Access Token von Microsoft Entra ID für API-Zugriff.
.DESCRIPTION
    Authentifiziert sich per Client Credentials Flow bei Entra ID und gibt ein Bearer Token zurück,
    das in anderen Scripts als -Token Parameter verwendet werden kann.
.PARAMETER TenantId
    Die Azure AD Tenant ID.
.PARAMETER ClientId
    Die Application (Client) ID der App Registration.
.PARAMETER ClientSecret
    Das Client Secret der App Registration.
.PARAMETER Scope
    Der Scope für den Token. Standard: api://<ClientId>/.default
.EXAMPLE
    $token = .\Get-EntraIdToken.ps1 -TenantId "xxx" -ClientId "yyy" -ClientSecret "zzz"
    .\Get-ApiUsers.ps1 -Token $token
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$TenantId,

    [Parameter(Mandatory = $true)]
    [string]$ClientId,

    [Parameter(Mandatory = $true)]
    [string]$ClientSecret,

    [string]$Scope
)

if (-not $Scope) {
    $Scope = "api://$ClientId/.default"
}

$tokenUrl = "https://login.microsoftonline.com/$TenantId/oauth2/v2.0/token"

$body = @{
    grant_type    = "client_credentials"
    client_id     = $ClientId
    client_secret = $ClientSecret
    scope         = $Scope
}

try {
    $response = Invoke-RestMethod -Uri $tokenUrl -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"
    Write-Host "Token erhalten (gültig für $($response.expires_in) Sekunden)" -ForegroundColor Green
    return $response.access_token
}
catch {
    Write-Error "Fehler beim Abrufen des Tokens: $_"
}
