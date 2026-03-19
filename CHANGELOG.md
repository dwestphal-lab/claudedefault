# Changelog

## [1.2.0] - 2026-03-19

### Added
- `.gitattributes` für korrekte Line-Endings (CRLF für `.ps1`, LF für `.sh`)
- Montserrat als Projektschriftart (via `next/font/google`)
- Neues Farbschema mit Teal/Cyan Palette und warmen Backgrounds
  - Light: `#ebebf0` / `#e7e2d3` Background, `#1e7378` Primary
  - Dark: `#0a322d` Background, `#5afff5` Primary Accent
- `.claude/` Verzeichnis (Skills, Agents, Commands) wird jetzt in Git getrackt

### Fixed
- `Init-Project.ps1`: Komplett überarbeitet — Here-Strings durch String-Arrays ersetzt (PS 5.1 kompatibel)
- `Init-Project.ps1`: Variable-Scoping-Bug in `.env`-Parsing behoben (`foreach` statt `ForEach-Object`)
- `Init-Project.ps1`: NEXTAUTH_SECRET wird jetzt konsistent in Root- und Frontend-.env geschrieben
- `Init-Project.ps1`: Secret-Generierung mit Wiederholung (echte Zufälligkeit statt Permutation)
- `Init-Project.ps1`: BOM-freies UTF-8 für Node.js/Docker-Kompatibilität
- `Init-Project.ps1`: Port-Validierung (1-65535), `[CmdletBinding()]`, `#Requires -Version 5.1`
- `Init-Project.ps1`: Verzeichnis-Existenz-Prüfung vor .env-Erstellung, `$PSScriptRoot` statt `Split-Path`-Kette
- `.gitignore`: Nur noch user-spezifische Claude-Dateien ausgeschlossen statt gesamtem `.claude/`

### Changed
- Frontend-Farbschema von generischem Schwarz/Weiß auf gebrandetes Teal/Cyan-Design
- System-Font-Stack durch Montserrat ersetzt

## [1.1.0] - 2026-03-19

### Added
- **Backend Tests**: Umfassende Tests für Audit, API-Keys, Files Routes und Middleware (RBAC, Error-Handler, Audit)
- **PowerShell Scripts**: Save-ApiFile, Get-ApiKeys, Remove-ApiKey, Restore-Database, Get-ApiHealth
- **Security**: CSP-Headers, Permissions-Policy, Nginx Rate-Limiting (Auth, Upload, API), Server-Token-Hiding
- **Swagger**: Gemeinsame Error-Response-Schemas (400, 401, 403, 404, 409, 429), API-Key Security-Scheme, PaginatedResponse-Schema
- **CI/CD**: Test-Coverage-Reporting mit Artifact-Upload, Dependency-Security-Scanning
- **Code Quality**: Prettier-Konfiguration, EditorConfig, erweiterte .gitignore

### Fixed
- Backend TypeScript-Fehler: jose ESM-Import via dynamischem `import()`, Express 5 `req.params` Typ-Casts, `null`→`undefined` Konvertierung in API-Key-Middleware
- Frontend TypeScript-Fehler: `tenantId`→`issuer` Migration (next-auth v5), `accessToken` Typ-Cast
- Docker Production Stack: Alle 4 Container (DB, Backend, Frontend, Nginx) bauen und starten erfolgreich

### Changed
- Nginx-Konfiguration: Separate Rate-Limit-Zones für Auth (10r/m), Upload (30r/m), API (60r/s)
- File-Upload Timeout auf 60s erhöht (für große Dateien)

## [1.0.0] - 2026-03-18

### Added
- Initiales Projekt-Template
- Backend: Express 5, Prisma, PostgreSQL, Auth (Entra ID + API Keys), RBAC, Audit-Logging, File-Upload, Redis-Cache
- Frontend: Next.js 15, React 19, shadcn/ui, next-intl (DE/EN), NextAuth v5
- Docker: Multi-Stage Builds, Nginx Reverse Proxy, PostgreSQL, Redis (optional)
- PowerShell: Init-Project, Health-Check, User-CRUD, File-Upload, API-Key-Erstellung, Audit-Log, DB-Backup
- CI/CD: GitHub Actions (Lint, Typecheck, Test, Docker Build)
- Swagger API-Dokumentation
