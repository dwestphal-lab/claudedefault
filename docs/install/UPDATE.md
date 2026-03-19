# Update-Vorgang

## Lokale Entwicklung

```bash
git pull
npm install               # Root-Dependencies (husky, concurrently)

cd backend
npm install
npx prisma migrate dev    # Neue Migrations anwenden
# Dev Server neu starten

cd ../frontend
npm install
# Dev Server neu starten
```

Oder alles auf einmal:

```bash
git pull && npm install && cd backend && npm install && npx prisma migrate dev && cd ../frontend && npm install
npm run dev:all
```

## Docker Stack

```bash
git pull
npm run docker:up         # Baut neu und startet alle Services
```

Prisma Migrations werden automatisch beim Backend-Start via `prisma migrate deploy` ausgeführt.

## Vor dem Update: Backup

```powershell
.\scripts\Backup-Database.ps1
```

## Datenbank-Migration prüfen

```bash
cd backend
npx prisma migrate status    # Zeigt ausstehende Migrations
npx prisma migrate deploy    # Wendet ausstehende Migrations an
```

## Rollback

Bei Problemen nach einem Update:

```bash
# Vorherigen Stand auschecken
git log --oneline -10
git checkout <commit-hash>

# Docker neu bauen
npm run docker:up
```

Für Datenbank-Rollbacks: Backup einspielen:

```powershell
.\scripts\Restore-Database.ps1 -BackupFile ".\data\backups\backup_YYYY-MM-DD_HHmmss.sql"
```
