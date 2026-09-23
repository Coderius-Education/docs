# Coderius — gedeelde instructies

Deze map bevat twee soorten repos:

- **`*-docs/`** — Docusaurus-leersites. Volg de schrijfstijl, het didactisch kader en de schrijfskills hieronder.
- **`play/`** — Python-bibliotheek. Library-conventies, géén docs-conventies; zie `play/CLAUDE.md`.

Elke repo heeft zijn eigen `CLAUDE.md` met uitsluitend project-specifieke aanvullingen (lesvolgorde, naam-prefixen, lab-framing, …). Die wordt automatisch bovenop deze gids geladen.

## Preview-links

Elke branch krijgt per site automatisch een preview op
`https://<branch-met-streepjes>--<site-id>.preview.coderius.nl/` — de `/` in de
branchnaam wordt een `-`, de site-id is de mapnaam onder `sites/`. Voorbeeld:
branch `claude/status-ttlwfx` + site `play` →
`https://claude-status-ttlwfx--play.preview.coderius.nl/`. Zet in elke
PR-beschrijving de preview-links van de aangepaste sites.

## Links tussen cursussen

Elke cursus is een eigen site; Docusaurus controleert alleen links binnen de
eigen site. Links naar een andere cursus (`<SiteLink>`, `<Voorkennis>`) worden
tweemaal bewaakt: door de guard-tests in `packages/shared` (snel, een benadering
van de routing) en door de CI-job `cross-links`, die na de builds elke href in de
gebouwde HTML tegen de build van de doelsite legt (de waarheid). Lokaal:
`pnpm cross-links` na `pnpm build`.

## Huisstijl

Kleuren, letters en de logo's van elke cursus komen uit
`packages/shared/huisstijl/` en worden gegenereerd met
`node scripts/genereer-huisstijl.mjs`; `createConfig` zet merk, naam, favicon en
cursuskleur per site. Stel die niet per site in, pas nooit de gegenereerde
bestanden aan, en zet tekst op een primary-vlak in `var(--coderius-on-primary)`,
niet in `#fff`. Een Infima-variabele overschrijven kan alleen op
`:root:not(#\#):not(#\#)`: een kale `:root` verliest van Infima's
layer-polyfill. Zie `packages/shared/huisstijl/README.md`.

De homepage van elke cursus past in één scherm, footer meegerekend, vanaf
1280×720: de hero en de kaarten (stijlen van `HomepageHero` en
`HomepageFeatures`, gebruikt door `HomepageSections`) zijn compact, en
`ManagedHomepage` zet de klasse `coderius-homepage`, waardoor de footer daar op
één regel per kolom staat (`packages/shared/css/custom.css`). De homepage vult het scherm
tot de footer: een hero gevolgd door een sectie of `main` vangt het grootste
deel van de extra ruimte op, en de kaarten staan gecentreerd in de rest
(`ManagedHomepage/styles.module.css`); zo staat er op een groot scherm geen
leeg vlak onder de kaarten. Wie iets aan een homepage toevoegt, bouwt
de site en meet in headless Chromium dat
`document.documentElement.scrollHeight <= window.innerHeight` op 1280×720 en
1366×768, in licht en donker. Een module-klasse die een maat van Infima wil
overschrijven (`.hero`, `h2`, `h3`, `p`) staat op dezelfde opgehoogde selector,
anders wint Infima stil; `huisstijl.test.ts` bewaakt dat voor de homepages.

## Code in MDX-expressies

MDX eet van elke vervolgregel in een `{`…`}`-expressie tot twee spaties op.
Code in `<PyRunner initialCode={`…`} />`, `<CodeExercise>{`…`}</CodeExercise>`
of `<PygbagRunner code={`…`} />` verloor zo de helft van zijn inspringing:
vier spaties in de les, twee in de editor. De pre-loader
`packages/shared/plugins/mdx-inspringing.js` (via `createConfig`, dus op elke
site) zet die twee spaties er vóór het parsen bij, zodat MDX precies de bron
overhoudt. Schrijf code in een les dus gewoon met vier spaties;
`packages/shared/inspringing.test.ts` eist dat ook, en
`mdx-inspringing.test.ts` pint het MDX-gedrag vast voor als een upgrade het
verandert.

## Bugfixes

Een bugfix gaat samen met een test die de bug vastpint, in dezelfde commit.
Tien van de twaalf eerdere fixes kwamen zonder test en van die klasse fouten
komt er anders altijd één terug. Kan de fout niet in node worden nagespeeld
(puur browser-gedrag), zeg dat dan in de commit en beschrijf hoe je 'm met de
hand hebt gecontroleerd.

## Schrijfstijl (alleen voor *-docs)
@org-handbook/WRITING_STYLE_GUIDE.md

## Didactisch kader (PRIMM, scaffolding, cognitive load)
@org-handbook/CLAUDE.md

## Skills voor goed schrijven
@org-handbook/WRITING_SKILLS.md
