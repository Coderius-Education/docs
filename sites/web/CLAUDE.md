# Project-specifieke conventies (web)

Algemene schrijfstijl, didactiek en schrijfskills staan in `../CLAUDE.md` (en de daarin geïmporteerde documenten in `../org-handbook/`).

- HTML- en CSS-voorbeelden tonen altijd zowel de code als (in tekst) het verwachte resultaat. Een screenshot mag, maar tekstuele beschrijving heeft de voorkeur voor toegankelijkheid.
- Bij selectors/properties: gebruik `<details>`-blokken in dezelfde stijl als de play-docs cheatsheet.
- Voor responsive/layout-onderwerpen: noem expliciet welke browser-breedtes je laat zien.
- Bij code-voorbeelden: complete minimal `<html>`-snippets (geen losse fragmenten zonder `<!DOCTYPE>` / `<head>` / `<body>` waar relevant).
- Raak je `src/checker/` aan (de nakijker op `/website-checken`)? Draai dan `pnpm test`. De voorbeeldprojecten in `src/checker/__fixtures__/` leggen vast welke concepten herkend worden; die map staat bewust buiten biome, dus formatteer hem niet.
