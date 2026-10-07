# Project-specifieke conventies (didactiek)

Algemene schrijfstijl en didactiek staan in `../CLAUDE.md` (en de daarin
geïmporteerde documenten in `../org-handbook/`). Deze site is een uitzondering op
de doelgroep: hij richt zich op **docenten en auteurs**, niet op leerlingen.

- **Toon:** collegiaal, kort, onderbouwend. Geen "je leert"; wel "we doen dit
  omdat …". Geen leerlingaanspreekvorm, geen opdrachten met tip/oplossing.
- **Structuur van de site:** één doorzoekbare tip-lijst op de homepage
  (`src/pages/index.tsx` → `TipZoeker`), gevoed door `src/data/tips.ts`. Elke tip
  linkt naar een detailpagina onder `docs/` (geserveerd op `/bronnen/<slug>`).
  De lijst begint met één tip en groeit naar behoefte.
- **Een tip toevoegen:** voeg een item toe aan `src/data/tips.ts` én maak het
  bijbehorende `docs/<slug>.md`. Houd `slug` en `detailPad` (`/bronnen/<slug>`)
  consistent.
- **Detailpagina-stramien:** H1 = de term · **De tip** (1 zin) · **Waar komt dit
  vandaan** · **Het onderzoek** (auteurs, jaar, kernbevinding) · externe link naar
  de paper (DOI, stabiel) · **Hoe wij dit toepassen**.
- **Citaties:** verwijs naar de oorspronkelijke paper met een DOI-link. Houd de
  bibliografische gegevens (auteurs, jaar, titel) gelijk tussen `tips.ts` en de
  detailpagina.
- Geen emoji, geen "u" — net als de rest van de Coderius-docs.
- **Het zoekfilter van de TipZoeker staat los van React in
  `src/components/TipZoeker/filterTips.ts`** (`filterTips(tips, zoekterm)`), met
  `filterTips.test.ts` ernaast. Vastgelegd gedrag: elk woord uit de zoekterm
  moet ergens voorkomen (term, categorie, samenvatting, papertitel, auteurs of
  trefwoorden), hoofdletterongevoelig, op een deel van een woord, en zonder
  accent-normalisatie ('cognitiëve' vindt 'cognitieve' niet — bewust
  vastgelegd als huidig gedrag, geen wens). De test controleert ook dat elke
  tip uit `tips.ts` op zijn eigen term en trefwoorden te vinden is. Verander je
  het zoekgedrag, pas dan filter en test samen aan.
