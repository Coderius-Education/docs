# Coderius Didactiek

De onderbouwing achter het Coderius-lesmateriaal: een doorzoekbare lijst van
didactische tips, elk gekoppeld aan het onderzoek waarop het berust.

- Homepage (`/`): zoekveld + tip-lijst (`src/pages/index.tsx`, `src/components/TipZoeker`).
- Tip-data: `src/data/tips.ts` (begint met één tip; voeg er eenvoudig meer toe).
- Detailpagina's per bron: `docs/` (geserveerd op `/bronnen/<slug>`).

## Ontwikkelen

```bash
pnpm --filter @coderius/didactiek-docs start
pnpm --filter @coderius/didactiek-docs build
pnpm --filter @coderius/didactiek-docs typecheck
```

Deze site staat standalone: hij is bewust niet in `packages/shared/sites.js`
geregistreerd en verschijnt dus niet in de "Cursussen"-dropdown van de cursussen.
