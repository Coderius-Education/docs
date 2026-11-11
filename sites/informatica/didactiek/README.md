# Coderius Didactiek

De onderbouwing achter het Coderius-lesmateriaal: een doorzoekbare lijst van
didactische tips, elk gekoppeld aan het onderzoek waarop het berust.

- Homepage (`/`): zoekveld + tip-lijst (`src/pages/index.tsx`, `src/components/TipZoeker`).
- Tip-data: `src/data/tips.ts`: de vaste categorieën en de tips, elk met een controlevraag.
- Checklist (`/checklist`): de controlevragen van alle tips per categorie (`src/components/Checklist`).
- Export: de build schrijft `tips.json` naast de site (`src/data/export.ts`).
- Detailpagina's per bron: `docs/` (geserveerd op `/bronnen/<slug>`).

## Ontwikkelen

```bash
pnpm --filter @coderius/didactiek-docs start
pnpm --filter @coderius/didactiek-docs build
pnpm --filter @coderius/didactiek-docs typecheck
```

Deze site staat standalone: hij is bewust niet in `packages/shared/sites.js`
geregistreerd en verschijnt dus niet in de "Cursussen"-dropdown van de cursussen.
