# Coderius — gedeelde instructies

Deze map bevat twee soorten repos:

- **`*-docs/`** — Docusaurus-leersites. Volg de schrijfstijl, het didactisch kader en de schrijfskills hieronder.
- **`play/`** — Python-bibliotheek. Library-conventies, géén docs-conventies; zie `play/CLAUDE.md`.

Elke repo heeft zijn eigen `CLAUDE.md` met uitsluitend project-specifieke aanvullingen (lesvolgorde, naam-prefixen, lab-framing, …). Die wordt automatisch bovenop deze gids geladen.

## Preview-links

Elke branch krijgt per site automatisch een preview op
`https://<branch-met-streepjes>--<site-id>.preview.coderius.nl/` — de `/` in de
branchnaam wordt een `-`, de site-id is de mapnaam onder `sites/<vak>/`. Voorbeeld:
branch `claude/status-ttlwfx` + site `play` →
`https://claude-status-ttlwfx--play.preview.coderius.nl/`. Zet in elke
PR-beschrijving de preview-links van de aangepaste sites.

## Vakken en mappen

Elke cursus hoort bij een vak en staat in `sites/<vak>/<id>/`
(`sites/informatica/python/`); de homepage staat in `sites/home/`. Online staat
een cursus onder een pad van de host van zijn vak:
`https://informatica.coderius.nl/python/`. Vak, pad en URL komen uit één bron,
de registry `packages/shared/sites.js` (`SUBJECTS`, `siteDir(id)`,
`sitesOfSubject(vak)`); `createConfig({ siteId })` leidt er `url` en
`baseUrl` uit af. Scripts lopen via de registry over de sites, Python via
`scripts/sites-json.mjs`. Een kale `<a href="/…">` of `<img src="/…">` in JSX
of MDX krijgt de baseUrl niet; gebruik `<Link to>`, `useBaseUrl` of een
markdown-link (`packages/shared/baseurl.test.ts` bewaakt dat). De oude
subdomeinen (`python.coderius.nl`) sturen alleen nog door; een link ernaartoe
is een fout in de CI-job `cross-links`.

## Werk van het oude adres

Wat een leerling op een oud subdomein bewaarde (`web.coderius.nl`), staat in de
browseropslag van die origin; de cursus op de vak-host kan er niet bij. Een site
met zulke opslag geeft `createConfig` een `oudeOpslag` mee (oude sleutel ->
nieuwe, zie `packages/shared/oude-opslag.js`). Dan komt er een losse pagina op
`<oud-subdomein>/oud/overzetten/` en een route `/overzetten` die het werk
overneemt; docs-management laat `/oud/` op het oude subdomein staan via
`legacy_paths` in `sites.json`. Hernoem je een opslagsleutel, pas dan `naar`
mee aan: `oude-opslag.test.ts` faalt als de nieuwe sleutel niet meer in de code
staat. De IDE heeft een eigen variant (`sites/informatica/ide/.../Overzetten`).

## Links tussen cursussen

Elke cursus is een eigen site; Docusaurus controleert alleen links binnen de
eigen site. Links naar een andere cursus (`<SiteLink>`, `<Voorkennis>`) worden
tweemaal bewaakt: door de guard-tests in `packages/shared` (snel, een benadering
van de routing) en door de CI-job `cross-links`, die na de builds elke href in de
gebouwde HTML tegen de build van de doelsite legt (de waarheid). Lokaal:
`pnpm cross-links` na `pnpm build`.

## Incrementele CI

CI doet alleen wat een wijziging raakt. De job `plan` draait
`scripts/wijzigingen.mjs` (logica en tests in
`packages/shared/wijzigingen.js`) en schrijft `changed.json`: per bestand de
gewijzigde regels, de geraakte sites (pnpm `--filter "...[<base>]"`, dus ook
sites die van een gewijzigd package afhangen) en welke jobs draaien. De
build-matrix bevat alleen geraakte sites; `cross-links` haalt de rest uit de
cache (`scripts/site-hash.mjs`, job `voorraad`). De blokrunners krijgen
`--alleen changed.json` en doen alleen de blokken op gewijzigde regels plus
wat erop doorbouwt (`draaien-met`); de tekstcontrole krijgt `--regels`. Een
globaal bestand (lockfile, root-config, `.github/`, de registry) of de
nachtelijke run draait alles. Een nieuwe runner of een nieuw bestand dat een
job leest: zet het in `RUNNERS`, `PER_JOB` of `GLOBAAL` in
`wijzigingen.js`, anders slaat CI hem stil over.

## Een les verhuizen

Een les die een ander adres krijgt (nieuwe map, nieuw nummer) laat oude links
van buiten de site (werkbladen, bladwijzers, zoekresultaten) op een 404
uitkomen. Geef de oude adressen mee als `omleidingen: [{ van, naar }]` aan
`createConfig`; `packages/shared/plugins/omleidingen.js` zet na de build op elk
oud adres een pagina die doorstuurt, en weigert een oud adres waar weer een
echte pagina staat. De python-cursus houdt de lijst bij in
`src/data/omleidingen.ts`, met een test die eist dat elk doel een les is.

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
