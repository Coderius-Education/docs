# Project-specifieke conventies (DVWA)

Algemene schrijfstijl, didactiek en schrijfskills staan in `../CLAUDE.md` (en de daarin geïmporteerde documenten in `../org-handbook/`).

- Elke kwetsbaarheid heeft een eigen genummerde map onder `docs/dvwa_tutorial/` (bijv. `01-brute-force/`) met per difficulty-level één pagina: `low.mdx`, `medium.mdx`, `high.mdx`, `impossible.mdx`. Screenshots staan **gecolokeerd** in diezelfde map (niet in `static/img/`).
- H1 en titel volgen het patroon `# <Onderwerp> — <Low/Medium/High/Impossible>`; `sidebar_label` is `'Low'`/`'Medium'`/… en `sidebar_position` loopt 1→4 binnen de map.
- Elke lespagina volgt het PRIMM-stramien met genummerde H2's: `## 1. Predict` → `## 2. Run` → `## 3. Investigate` → `## 4. Modify & Make` → `## 5. ✓ Wat moest je zien?` → `## 6. Er gaat iets mis...` → optioneel `## Walkthrough`. Gebruik `<details>` voor voorspellingen, tips en antwoorden.
- Interactieve labs draaien via `<DvwaLab module="..." level="..." />` (kwetsbare PHP client-side in een sandboxed iframe) of `<LinuxTerminal />` (command injection). Config per module staat in `src/components/DvwaLab/`.
- Installatie-instructies in stappen (`## Stap 1`, `## Stap 2`, …), met screenshots in `static/img/`.
- De low→impossible-ladder toont per level hoe de code veiliger wordt; impossible laat de veilige versie zien.
- Benadruk dat alles in een eigen DVWA-installatie of het ingebouwde lab hoort, nooit op externe systemen.
