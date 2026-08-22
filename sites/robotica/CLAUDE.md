# Project-specifieke conventies (robotica)

Algemene schrijfstijl, didactiek en schrijfskills staan in `../CLAUDE.md` (en de daarin geïmporteerde documenten in `../org-handbook/`).

## Inleiding

Dit is een project waarin leerlingen zelf via een Arduino Nano RP2040 Connect sensoren en actuatoren aansturen.

## Aandachtspunten

- **Tutorial:** simpel Nederlands. Na elke uitleg een korte controlevraag in een `<details>`-blok, zodat de leerling zelf kan toetsen of het begrepen is.
- **Cheatsheet:** gebruik H2-headers per onderwerp, met daaronder de items in `<details>`-blokken in dezelfde stijl als play-docs.
- Bij hardware-instructies: noem de exacte pin-aansluitingen en toon een minimale werkende schets vóór uitbreidingen.
- **Bibliotheek versus lego_auto** — twee rollen, twee stijlen:
  - De **Bibliotheek** (`docs/`) is naslag: complete, vlot uit te voeren scripts die je kunt kopiëren. Daar blijft de huidige stijl gelden. Eén uitzondering: hoofdstuk 2 (Tutorial - ingebouwd lampje) is de instap voor wie nog nooit code schreef en bouwt het programma regel voor regel op, met `<Voorkennis>`-links naar de python-cursus.
  - Het **lego_auto**-traject is opbouwend: één groeiend robotscript ("Het robotscript bouwen — Deel N") waarin elke les één of twee nieuwe concepten of regels toevoegt, en dat uitmondt in de lijnvolger. Gebruik nooit een import-stub voor een pagina met python-code; stubs zijn alleen voor hardware- en instructiepagina's zonder code.
- Lesformat voor de lego_auto-delen, naar het model van het bewegingsscript in `../godot`: `## Wat je nu gaat toevoegen` → `## Voorspel: …` (antwoord in details) → `## Stap N` → `## Test het` → `## Je script tot nu toe` (details) → `## Er gaat iets mis` met **Oorzaak:**/**Oplossing:** en bij symptomen zonder foutmelding **Zelf vinden:** (welke concrete meting had de leerling zelf kunnen doen). De controlevraag-in-details blijft daarnaast bestaan.
- Volgorde van het traject: eerst **waarnemen** (lijnsensoren, scherm), dan pas **aansturen** (motoren). Elk onderdeel wordt eerst los aangeleerd — materiaal → aansluiten → minimale test met alléén dat onderdeel — en gaat daarna pas het robotscript in. Elke les eindigt met iets dat op de robot waarneembaar is.
- Opdrachten volgen `## Opdracht <H>.<S>.<letter>:` met H = categoriepositie en S = sidebar_position (bewaakt door `src/lego-tests/structuur.test.ts`). Alleen de slotopdrachten (10.4.a en 10.4.b) hebben geen uitgewerkte oplossing, en dat wordt in Deel 7 aangekondigd.
- Elke lego_auto-pagina heeft een expliciete `slug:`; die is bevroren — verplaats bestanden gerust, maar wijzig geen slug.
- Alle ```python-blokken compileren in CI (`pnpm lego:extract` + `src/lego-tests/compileer.py`). Een bewust kapot voorbeeld markeer je met `{/* niet-compileren: reden */}` vlak boven het blok (MDX-vorm; `<!-- -->` breekt de build). Gebruik alleen API-aanroepen die al in de Bibliotheek voorkomen.
- Python-voorkennis via `<Voorkennis>`-blokken (site `python`); geen hardcoded `python.coderius.nl`-URL's.
- Elk ```python-blok krijgt automatisch een "Open in de editor"-link (theme-wrapper `src/theme/CodeBlock`, code reist mee in de URL-hash); REPL-transcripten met `>>>` niet. Geen aparte TryButton-component gebruiken.
- **`click_golfer`** is een apart project voor **groep 7/8**: Nederlands, korte zinnen, nog eenvoudiger dan de rest. Leerlingen programmeren in **blokken** (Leaphy Easybloqs), niet in code. De sectie is bewust klein: een intro met het 3D-model (gedeelde `ObjViewer`, model in `static/models/golfer.obj`), een bouwpagina die het Leaphy-werkboek inline toont (`static/click_golfer/werkboek.pdf`, ©Stichting Leaphy) plus een onderdelenlijst (`static/click_golfer/onderdelenlijst.csv`), een pagina "De houten baan" met foto's van de laser-gesneden onderdelen (`static/click_golfer/hout/`), en een pagina "Een bal detecteren" met Leaphy-blok-screenshots (`static/click_golfer/analoog_ir/`). De `.docx`/`.pptx`-bronnen horen niet in de repo. Uitzondering: het BrickLink Studio-bronbestand `static/click_golfer/golfer.io` wordt bewust wél meegeleverd als download ("Open in BrickLink Studio"), dus dat niet opschonen.
