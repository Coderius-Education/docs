# Project-specifieke conventies (editor)

Algemene schrijfstijl, didactiek en schrijfskills staan in `../CLAUDE.md` (en de daarin geïmporteerde documenten in `../org-handbook/`).

- Documentatie over de webeditor zelf: schrijf vanuit het perspectief van een leerling die de editor opent in de browser.
- Screenshots tonen alleen de relevante UI, niet het hele browservenster.
- Voor sneltoetsen: noem zowel Windows/Linux (Ctrl) als Mac (Cmd). **Uitzondering:** `Ctrl+Shift+G` (Source Control) houdt op macOS ook Ctrl — daar bestaat geen Cmd-variant van. `src/git-tests/sneltoetsen.test.ts` bewaakt beide kanten: elke andere Ctrl-toets moet zijn Cmd-variant noemen, en deze juist niet.

## De git-tutorials

- **De simulator drukt echte git-uitvoer af, woordelijk en in het Engels.** Tutorial 2 laat de leerling dezelfde commando's in VS Code typen; herkent hij daar geen regel van, dan was het oefenen zinloos. Uitleg die git zelf niet geeft staat op een `hint:`-regel in het Nederlands — git gebruikt datzelfde voorvoegsel. `src/git-tests/echte-git.test.ts` legt de uitvoer van de simulator naast die van de geïnstalleerde git; wijkt er iets af, dan valt die test om.
- **De hele leerlijn gaat uit van `main`.** Echte git noemt zijn eerste branch nog altijd `master`, dus `vscode/stap-1-config.md` zet `init.defaultBranch main` vóór de eerste `git init`. Zonder die regel loopt de leerling bij zijn eerste push tegen `error: src refspec main does not match any` aan. `welke-knop.test.ts` weert het woord `master` uit alle andere pagina's.
- **De oefeningen staan in `src/components/GitSimulator/scenarios.ts`, niet in de `.mdx`.** Een lespagina verwijst er alleen naar met `<GitSimulator scenarioId="stap-3-add" />`. Elk scenario heeft een `oplossing`, en `scenarios.test.ts` speelt die na om te controleren dat het doel echt haalbaar is én dat het niet meteen op groen staat. Een doel in een JSX-prop is niet te testen; daarom deze omweg.
- **Elke tutorial met stappen sluit af met `welke-knop.md`.** Twee uitzonderingen staan in `ZONDER_TABEL` in de test: `basis` (daar typ je de commando's zelf) en `github` (speelt zich helemaal op de website af). Een commando in zo'n tabel moet ergens in de cursus getoond worden — de tabel mag niets beloven wat geen enkele les uitlegt.
- De zones staan bóven de terminal, niet ernaast. Naast elkaar hield de terminal 29 tekens over op een laptopscherm, en git schrijft regels van 63.
