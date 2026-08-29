# Project-specifieke conventies (web)

Algemene schrijfstijl, didactiek en schrijfskills staan in `../CLAUDE.md` (en de daarin geïmporteerde documenten in `../org-handbook/`).

- HTML- en CSS-voorbeelden tonen altijd zowel de code als (in tekst) het verwachte resultaat. Een screenshot mag, maar tekstuele beschrijving heeft de voorkeur voor toegankelijkheid.
- Bij selectors/properties: gebruik `<details>`-blokken in dezelfde stijl als de play-docs cheatsheet.
- Voor responsive/layout-onderwerpen: noem expliciet welke browser-breedtes je laat zien.
- Bij code-voorbeelden: complete minimal `<html>`-snippets (geen losse fragmenten zonder `<!DOCTYPE>` / `<head>` / `<body>` waar relevant).
- Raak je `src/checker/` aan (de nakijker op `/website-checken`)? Draai dan `pnpm test`. De voorbeeldprojecten in `src/checker/__fixtures__/` leggen vast welke concepten herkend worden; die map staat bewust buiten biome, dus formatteer hem niet.
- **Elke opdracht heeft een eigen oefenveld.** Een les heeft drie `<CodeEditor>`-velden: het hoofdveld onder "Probeer het zelf" en één direct onder de opdrachttekst van Modify en Make, vóór de Tip — zo hoeft een leerling nooit omhoog te scrollen tussen opdracht en veld. De startcode staat één keer per pagina in MDX-exports (`startHtml`/`startCss`/`startJs`); het Modify-veld hergebruikt die (de opdracht is "pas deze code aan"), het Make-veld start met een eigen skelet (`makeHtml`/`makeJs`) dat een geraamte geeft maar geen antwoord — bij html/css-lessen een lege body met commentaar, bij JS-lessen de passende HTML-bedrading met een leeg script. Investigate hoort bij het hoofdveld, dat er direct boven staat. `src/docs-tests/opdracht-velden.test.ts` bewaakt dit: drie velden per les, veld vóór de tip, en het Make-veld op zijn eigen skelet.
