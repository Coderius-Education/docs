# Project-specifieke conventies (play)

Algemene schrijfstijl, didactiek en schrijfskills staan in `../CLAUDE.md` (en de daarin geïmporteerde documenten in `../org-handbook/`).

- **`play-docs` is de stijl-referentie** voor alle andere `*-docs` projecten — wijzigingen aan voorbeelden, opdracht-format of cheatsheet hier zijn richtinggevend.
- **Interne links altijd controleren** dat ze bestaan vóór commit.
- **Opdracht-nummering** strikt volgens `H.S.letter` (sectie 2.1 begint met 2.1.a, dan 2.1.b, doortellend over de hele sectie).
- **Runnable code** toon je met `<PygbagRunner code={`…`} height={300} />` (globaal geregistreerd, geen import nodig) — dat is de levende opvolger van de oudere TryButton-vermeldingen. Voorbeelden die een bestand nodig hebben (afbeelding, geluid, video) krijgen géén runner maar het vaste `:::warning[Online speeltuin]`-blok plus een gewoon codeblok; de speeltuin kan geen lokale bestanden laden.
- **De speeltuin draait op een gebundelde wheel** in `static/whl/` (verwezen vanuit `src/components/CodeRunner/engine.js`). Documenteer je nieuwe API, bouw dan óók een verse wheel uit de play-repo en vervang de oude — anders tonen de lessen code die de speeltuin nog niet kent. `src/api-tests/api.test.ts` bewaakt dat de wheel bestaat, dat engine.js ernaar wijst en dat elke `play.new_…` uit de lessen erin zit.
- **Elk speeltuin-blok wordt in CI echt uitgevoerd** (`scripts/draai-play-blokken.py`, job `play`): headless tegen de gebundelde wheel, met de game-loop uit. Kale ```python-blokken worden alleen gecompileerd. Een les die bewust kapotte code toont markeert dat blok met `{/* niet-draaien: reden */}` (runtime-fout; compileren moet nog lukken) of `{/* niet-compileren: reden */}` (syntaxfout of fragment) direct erboven — zo dwingt een nieuw kapot voorbeeld een expliciete keuze af.
- **`play.start_program()` weglaten** in voorbeelden: play start automatisch, en de cheatsheet zegt dat expliciet.
- **Cheatsheet** in `cheatsheet.md` met `<details><summary>vraag (functie_naam)</summary>`-blokken, gegroepeerd onder H2-thema's in elk een eigen `<CheatsheetGrid>`; nieuw gedrag markeer je met `(nieuw in <versie>)` in de summary en één blok "Nieuw of verbeterd in coderius-play versie <versie>" bovenaan.
- **API-wijzigingen die uitstralen vanuit de play-repo** (github.com/Coderius-Education/play): update beide repos in dezelfde wijzigingsronde.
