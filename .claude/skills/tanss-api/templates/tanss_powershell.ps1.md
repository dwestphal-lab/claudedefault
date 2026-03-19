# TANSS PowerShell Script — Templates

## Login-Funktion (wiederverwendbar)

```powershell
function Connect-Tanss {
    <#
    .SYNOPSIS
        Meldet sich an der TANSS API an und gibt den Token zurück.
    .PARAMETER BaseUrl
        TANSS Server URL (z.B. https://tanss.firma.de oder https://tanss.firma.de/backend)
    .PARAMETER Username
        TANSS Benutzername
    .PARAMETER Password
        TANSS Passwort
    .PARAMETER TwoFactorToken
        Optional: 2FA Token
    .EXAMPLE
        $auth = Connect-Tanss -BaseUrl "https://tanss.firma.de" -Username "admin" -Password "geheim"
        $auth.apiKey  # Bearer Token für weitere Requests
    #>
    param(
        [Parameter(Mandatory)][string]$BaseUrl,
        [Parameter(Mandatory)][string]$Username,
        [Parameter(Mandatory)][string]$Password,
        [string]$TwoFactorToken
    )

    $body = @{ username = $Username; password = $Password }
    if ($TwoFactorToken) { $body.token = $TwoFactorToken }

    try {
        $response = Invoke-RestMethod `
            -Uri "$BaseUrl/api/v1/login" `
            -Method Post `
            -Body ($body | ConvertTo-Json) `
            -ContentType "application/json"

        return @{
            apiKey       = $response.content.apiKey
            refresh      = $response.content.refresh
            expire       = $response.content.expire
            employeeId   = $response.content.employeeId
            employeeType = $response.content.employeeType
            BaseUrl      = $BaseUrl
        }
    }
    catch {
        Write-Error "TANSS Login fehlgeschlagen: $_"
    }
}
```

## Request-Helper

```powershell
function Invoke-TanssApi {
    <#
    .SYNOPSIS
        Führt einen authentifizierten TANSS API-Call aus.
    .PARAMETER Auth
        Auth-Objekt von Connect-Tanss
    .PARAMETER Method
        HTTP-Methode (GET, POST, PUT, DELETE)
    .PARAMETER Path
        API-Pfad (z.B. /api/v1/tickets/own)
    .PARAMETER Body
        Optional: Request-Body als Hashtable
    #>
    param(
        [Parameter(Mandatory)][hashtable]$Auth,
        [Parameter(Mandatory)][string]$Method,
        [Parameter(Mandatory)][string]$Path,
        [hashtable]$Body
    )

    $headers = @{ "apiToken" = $Auth.apiKey }
    $params = @{
        Uri         = "$($Auth.BaseUrl)$Path"
        Method      = $Method
        Headers     = $headers
        ContentType = "application/json"
    }

    if ($Body) {
        $params.Body = $Body | ConvertTo-Json -Depth 10
    }

    try {
        return Invoke-RestMethod @params
    }
    catch {
        $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($errorBody.error) {
            Write-Error "TANSS Fehler: $($errorBody.error.localizedText) ($($errorBody.error.text))"
        }
        else {
            Write-Error "TANSS API Fehler: $_"
        }
    }
}
```

## Beispiel-Scripts

### Eigene Tickets abrufen

```powershell
# Get-TanssOwnTickets.ps1
param(
    [Parameter(Mandatory)][string]$BaseUrl,
    [Parameter(Mandatory)][string]$Username,
    [Parameter(Mandatory)][string]$Password
)

$auth = Connect-Tanss -BaseUrl $BaseUrl -Username $Username -Password $Password
$result = Invoke-TanssApi -Auth $auth -Method GET -Path "/api/v1/tickets/own"

Write-Host "Eigene Tickets: $($result.content.Count)" -ForegroundColor Cyan
$result.content | ForEach-Object {
    [PSCustomObject]@{
        ID     = $_.id
        Titel  = $_.title
        Status = $result.meta.linkedEntities.ticketStates."$($_.statusId)".name
        Firma  = $result.meta.linkedEntities.companies."$($_.companyId)".name
    }
} | Format-Table -AutoSize
```

### Ticket erstellen

```powershell
# New-TanssTicket.ps1
param(
    [Parameter(Mandatory)][string]$BaseUrl,
    [Parameter(Mandatory)][string]$Username,
    [Parameter(Mandatory)][string]$Password,
    [Parameter(Mandatory)][int]$CompanyId,
    [Parameter(Mandatory)][string]$Title,
    [string]$Content,
    [int]$AssignedTo
)

$auth = Connect-Tanss -BaseUrl $BaseUrl -Username $Username -Password $Password

$ticket = @{
    companyId = $CompanyId
    title     = $Title
}
if ($Content) { $ticket.content = $Content }
if ($AssignedTo) { $ticket.assignedToEmployeeId = $AssignedTo }

$result = Invoke-TanssApi -Auth $auth -Method POST -Path "/api/v1/tickets" -Body $ticket
Write-Host "Ticket erstellt: #$($result.content.id) — $($result.content.title)" -ForegroundColor Green
return $result.content
```

### Support erfassen

```powershell
# New-TanssSupport.ps1
param(
    [Parameter(Mandatory)][string]$BaseUrl,
    [Parameter(Mandatory)][string]$Username,
    [Parameter(Mandatory)][string]$Password,
    [Parameter(Mandatory)][int]$TicketId,
    [Parameter(Mandatory)][int]$DurationMinutes,
    [ValidateSet("OFFICE","CUSTOMER","REMOTE")]
    [string]$Location = "OFFICE",
    [string]$Text
)

$auth = Connect-Tanss -BaseUrl $BaseUrl -Username $Username -Password $Password

$support = @{
    ticketId = $TicketId
    date     = [int][double]::Parse((Get-Date -UFormat %s))
    location = $Location
    duration = $DurationMinutes * 60  # Sekunden
}
if ($Text) { $support.text = $Text }

$result = Invoke-TanssApi -Auth $auth -Method POST -Path "/api/v1/supports" -Body $support
Write-Host "Support erfasst: $DurationMinutes Min. für Ticket #$TicketId" -ForegroundColor Green
return $result.content
```

### Datei an Ticket anhängen

```powershell
# Send-TanssFile.ps1
param(
    [Parameter(Mandatory)][string]$BaseUrl,
    [Parameter(Mandatory)][string]$Username,
    [Parameter(Mandatory)][string]$Password,
    [Parameter(Mandatory)][int]$TicketId,
    [Parameter(Mandatory)][string]$FilePath,
    [string]$Description,
    [switch]$Internal
)

$auth = Connect-Tanss -BaseUrl $BaseUrl -Username $Username -Password $Password

$headers = @{ "apiToken" = $auth.apiKey }

$form = @{
    files = Get-Item -Path $FilePath
}
if ($Description) { $form.descriptions = $Description }
if ($Internal) { $form.internal = "true" }

$result = Invoke-RestMethod `
    -Uri "$BaseUrl/api/v1/tickets/$TicketId/upload" `
    -Method Post `
    -Headers $headers `
    -Form $form

Write-Host "Datei hochgeladen zu Ticket #$TicketId" -ForegroundColor Green
return $result
```
