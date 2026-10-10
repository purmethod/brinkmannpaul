@AGENTS.md

# Arbeitsregeln von Paul (gelten für jede Session)

- **Keine Screenshots, keine Bilder, keine Test-Bilder** erzeugen oder schicken – nirgends (kostet zu viele Credits).
  Geprüft wird mit Tests, `curl` und `/api/health`, nicht mit Bildern. `npm run screenshots` nur, wenn Paul es ausdrücklich will.
- **Direkt live machen:** Änderungen committen und pushen. Der Workflow `cyclemax-web` deployt jeden Push nach `cyclemax/**`
  automatisch auf https://cyclemax.app und prüft `/api/health`.
