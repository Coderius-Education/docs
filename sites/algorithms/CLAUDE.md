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
- **Pyodide staat hier vast op 0.27.4 (Python 3.12), en dat is een keuze.** De site serveert Pyodide zelf uit `static/pyodide/` zodat de runners het ook doen op een schoolnetwerk dat CDN's blokkeert, en die map bevat naast de runtime dertien wheels voor de matplotlib-keten. Vijf daarvan zijn `cp312`-gebonden (`matplotlib`, `numpy`, `pillow`, `contourpy`, `kiwisolver`) en laden niet op Python 3.13. Vijftien lessen leunen erop — de hele Big-O-reeks tekent zijn grafieken ermee. Die dertien wheels komen niet uit de npm-package van Pyodide — die bevat in geen enkele versie wheels, alleen de runtime. `copy:pyodide` is daarom géén veilige upgrade in zijn eentje: dat script begint met de doelmap leeggooien en zou de wheels wissen (het weigert dat nu). Upgraden gaat zo:

  1. `pnpm --filter @coderius/algorithms-docs haal:wheels` — haalt de matplotlib-keten van de geïnstalleerde Pyodide-versie op, twaalf wheels, elk tegen zijn sha256 uit `pyodide-lock.json` gelegd. Dit moet vanaf een machine die `cdn.jsdelivr.net` kan bereiken, of met `--basis <mirror>`; die wheels staan niet op PyPI. Met `--toon` zie je eerst wat er zou komen.
  2. De wheels van de vorige versie uit die map weghalen, en de runtime verversen met `copy:pyodide`.
  3. Die vijftien matplotlib-lessen nalopen in de preview. Dit is het stuk dat geen enkele test dekt.
  4. `algorithms` van de uitzonderingslijst in `pyodide-kopie.test.ts` halen — die test dwingt dat zelf af zodra de checksums gelijklopen.

In 0.29.4 telt de keten twaalf in plaats van dertien pakketten: `matplotlib-pyodide` hoort er niet meer bij. Dat leverde de html5-canvas-backend, en deze site tekent met `matplotlib.use('AGG')` naar een base64-PNG, dus die had hij sowieso niet nodig. `packages/python-runner/src/pyodide-kopie.test.ts` houdt de uitzondering vast, en bewaakt daarnaast dat de wheels bij de Python-versie van de runtime blijven horen.
