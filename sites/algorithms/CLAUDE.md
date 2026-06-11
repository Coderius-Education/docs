# Project-specifieke conventies (algorithms)

Algemene schrijfstijl, didactiek en schrijfskills staan in `../CLAUDE.md` (en de daarin geïmporteerde documenten in `../org-handbook/`).

- Lessen volgen een vaste opbouw per algoritme: `01-concept` → `02-stellingen` → `03+ bouwen-*` (stap-voor-stap implementatie) → `compleet` → `aanpassen` → `zelf-bouwen` → `fouten` → `cheatsheet`.
- Voor elk algoritme: chapter-nummer in volgorde van de sidebar (bv. lineair-zoeken=1, binair-zoeken=2, vind-maximum=3, max-en-min=4, bubble-sort=5, selection-sort=6 — of houd de bestaande volgorde aan).
- `concept`-pagina's: korte uitleg + analogie + visueel voorbeeld; geen volledige code.
- `stellingen`-pagina's: Predict-fase — meerkeuzevragen of waar/niet-waar met antwoord in `<details>`.
- `bouwen-*`-pagina's: één klein stukje code per pagina (≤ 10 regels), met PyRunner-component voor uitvoering, opbouwend naar de volledige oplossing.
- `compleet`-pagina: de volledige werkende implementatie + runner.
- `aanpassen`-pagina: Modify-fase met varianten van de basisoplossing.
- `zelf-bouwen`-pagina: Make-fase met een uitdaging die de leerling vanaf nul oplost.
- `fouten`-pagina: gebruik het "Er gaat iets mis"-format uit §8 van de schrijfgids.
- `cheatsheet`-pagina: `<details>`-blokken per concept/functie van het algoritme.
- Bij Python-code: gebruik dezelfde conventies als de play-docs (variabelnamen NL waar natuurlijk, keywords/built-ins EN).
