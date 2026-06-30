# Project-specifieke conventies (robotica)

Algemene schrijfstijl, didactiek en schrijfskills staan in `../CLAUDE.md` (en de daarin geïmporteerde documenten in `../org-handbook/`).

## Inleiding

Dit is een project waarin leerlingen zelf via een Arduino Nano RP2040 Connect sensoren en actuatoren aansturen.

## Aandachtspunten

- **Tutorial:** simpel Nederlands. Na elke uitleg een korte controlevraag in een `<details>`-blok, zodat de leerling zelf kan toetsen of het begrepen is.
- **Cheatsheet:** gebruik H2-headers per onderwerp, met daaronder de items in `<details>`-blokken in dezelfde stijl als play-docs.
- Bij hardware-instructies: noem de exacte pin-aansluitingen en toon een minimale werkende schets vóór uitbreidingen.
- Voor de `lego_auto`-sidebar geldt dezelfde stijl; voorbeelden gebruiken complete, vlot uit te voeren scripts.
- **`click_golfer`** is een apart project voor **groep 7/8**: Nederlands, korte zinnen, nog eenvoudiger dan de rest. Leerlingen programmeren in **blokken** (Leaphy Easybloqs), niet in code. De sectie is bewust klein: een intro met het 3D-model (gedeelde `ObjViewer`, model in `static/models/golfer.obj`) en een bouwpagina die het Leaphy-werkboek inline toont (`static/click_golfer/werkboek.pdf`, ©Stichting Leaphy). De `.docx`/`.pptx`-bronnen horen niet in de repo.
