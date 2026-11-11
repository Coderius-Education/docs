# Project-specifieke conventies (didactiek)

Algemene schrijfstijl en didactiek staan in `../CLAUDE.md` (en de daarin
geïmporteerde documenten in `../org-handbook/`). Deze site is een uitzondering op
de doelgroep: hij richt zich op **docenten en auteurs**, niet op leerlingen.

- **Toon:** collegiaal, kort, onderbouwend. Geen "je leert"; wel "we doen dit
  omdat …". Geen leerlingaanspreekvorm, geen opdrachten met tip/oplossing.
- **Structuur van de site:** één doorzoekbare tip-lijst op de homepage
  (`src/pages/index.tsx` → `TipZoeker`), gevoed door `src/data/tips.ts`. Elke tip
  linkt naar een detailpagina onder `docs/` (geserveerd op `/bronnen/<slug>`).
  De lijst groeit naar behoefte.
- **Tips per categorie, als checklist voor de cursussen** (november 2026). De
  tips zijn ook de invoer voor het nalopen en verbeteren van de cursussen.
  Daarom staat elke tip in één categorie uit de vaste lijst `CATEGORIEEN` in
  `tips.ts` (de onderdelen van een les, in de volgorde van het nalopen: Uitleg,
  Voorbeelden, Opdrachten, Fouten en feedback, Volgorde en opbouw, Beoordelen)
  en heeft hij één `controlevraag`: een vraag aan een les waarop ja betekent dat
  de tip is toegepast. Eerst was de categorie een vrij tekstveld. De homepage
  groepeert per categorie, met een knop per categorie (een lege categorie staat
  erbij, uitgeschakeld, zodat te zien is waar de verzameling leeg is); de
  pagina `/checklist` (`src/components/Checklist`) zet alle controlevragen onder
  elkaar; en de build schrijft `tips.json` naast de site (`src/data/export.ts`,
  plugin in `docusaurus.config.ts`) voor gebruik buiten deze repo. De skill
  `leerling-doorloop` leest `tips.ts` zelf. `src/data/tips.test.ts` eist de
  categorie uit de lijst, één vraag per tip die woordelijk op de detailpagina
  staat, en voor elke pagina een tip.
- **Twee soorten tips: uit onderzoek en uit de praktijk** (`bron` in `tips.ts`).
  Een tip uit onderzoek heeft een `paper`; een tip uit de praktijk een
  `herkomst` van één zin en geen paper. De site zegt welke van de twee het is,
  en een tip uit de praktijk doet zich niet voor als onderzoek: geen kop Het
  onderzoek, geen DOI, wel "uit onze eigen praktijk, niet uit een onderzoek" en
  een kop Wat we zagen. Beweer daar alleen wat we deden en zagen, geen
  leeropbrengst die niet gemeten is. De eerste is Kleine stappen met een
  succesmoment.
- **De tips onderbouwen de werkvormen van een les.** Elk les-tabblad van de
  web-cursus heeft een werkvorm met een icoon, en de docentenhandleiding linkt
  per werkvorm naar een of meer tips hier (`packages/shared/werkvormen/werkvormen.json`,
  zie de root-`CLAUDE.md`). Hernoem of verwijder je een tip die daar staat,
  pas dat bestand dan mee aan; `packages/shared/werkvormen.test.ts` faalt
  anders. Daarvoor zijn in november 2026 vier tips uit onderzoek bijgekomen:
  PRIMM, uitgewerkte voorbeelden, hulp in stappen en leren van fouten. Bij
  elke tip zegt de pagina ook wat het onderzoek niet laat zien (jonge
  kinderen en blokken, experimenten in het lab).
- **Een tip toevoegen:** voeg een item toe aan `src/data/tips.ts` én maak het
  bijbehorende `docs/<slug>.md`. Houd `slug` en `detailPad` (`/bronnen/<slug>`)
  consistent.
- **Detailpagina-stramien:** H1 = de term · **De tip** (1 zin) ·
  **Controlevraag:** (gelijk aan `tips.ts`) · **Waar komt dit vandaan** · **Het
  onderzoek** (auteurs, jaar, kernbevinding) · externe link naar de paper (DOI,
  stabiel) · **Hoe wij dit toepassen**. Bij een tip uit de praktijk staat **Wat
  we zagen** op de plek van Het onderzoek.
- **Citaties:** verwijs naar de oorspronkelijke paper met een DOI-link. Houd de
  bibliografische gegevens (auteurs, jaar, titel) gelijk tussen `tips.ts` en de
  detailpagina.
- Geen emoji, geen "u" — net als de rest van de Coderius-docs.
- **Het zoekfilter van de TipZoeker staat los van React in
  `src/components/TipZoeker/filterTips.ts`** (`filterTips(tips, zoekterm)`), met
  `filterTips.test.ts` ernaast. Vastgelegd gedrag: elk woord uit de zoekterm
  moet ergens voorkomen (term, het label van de categorie, samenvatting,
  controlevraag, trefwoorden, en de bron: papertitel en auteurs, of de herkomst
  en het woord praktijk), hoofdletterongevoelig, op een deel van een woord, en zonder
  accent-normalisatie ('cognitiëve' vindt 'cognitieve' niet — bewust
  vastgelegd als huidig gedrag, geen wens). De test controleert ook dat elke
  tip uit `tips.ts` op zijn eigen term en trefwoorden te vinden is. Verander je
  het zoekgedrag, pas dan filter en test samen aan.
