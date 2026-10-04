# Onderzoek

Materiaal voor het doen van onderzoek, gericht op bovenbouw havo/vwo. Een
Docusaurus-site in de Coderius-monorepo, onder het vak wetenschapsoriëntatie:

**https://wo.coderius.nl/onderzoek/**

## Lokaal draaien

Vanuit de root van de monorepo:

```bash
pnpm install
pnpm --filter @coderius/onderzoek start
```

## Productie-build

```bash
pnpm --filter @coderius/onderzoek build
```

De statische site komt in de map `build/`.

## Inhoud toevoegen

Pagina's zijn Markdown-bestanden in `docs/`. Voeg een nieuw bestand toe en zet het id in `sidebars.js` om het in het menu te tonen.
