Aktualisiere die TANSS API-Referenz mit den neuesten Daten von der offiziellen Dokumentation.

## Schritte:

1. **YAML herunterladen:**
   ```bash
   curl -sL "https://api-doc.tanss.de/combined.yaml" -o "/tmp/tanss_api_latest.yaml"
   ```

2. **Version prüfen:** Vergleiche die Version in der YAML (`grep "version:" /tmp/tanss_api_latest.yaml | head -1`) mit der `api_version` in `.claude/skills/tanss-api/references/tanss_api_endpoints.md`

3. **Bei neuer Version:**
   - Lies die komplette YAML-Datei lokal (sie ist ~17.000 Zeilen)
   - Extrahiere alle Pfade mit `grep -n "^  /api" /tmp/tanss_api_latest.yaml`
   - Aktualisiere `tanss_api_endpoints.md` mit neuen/geänderten Endpoints
   - Aktualisiere `tanss_api_schemas.md` mit neuen/geänderten Schemas
   - Aktualisiere die Version und das Datum in allen Referenz-Dateien
   - Melde welche Endpoints neu/geändert/entfernt wurden

4. **Bei gleicher Version:** Melde dass die Referenz aktuell ist

5. **Temporäre Datei aufräumen:** `rm /tmp/tanss_api_latest.yaml`
