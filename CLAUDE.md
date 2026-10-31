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

Elke link naar een pagina in lestekst is een site:-link,
`[tekst](site:<cursus>/<pad>#anker)`, ook binnen de eigen cursus (stijlgids §12);
`packages/shared/plugins/site-links.js` zet hem bij de build om. De vorm bewaakt
`packages/shared/links-in-lestekst.test.ts`. Docusaurus controleert alleen links
binnen de eigen site; de CI-job `cross-links` legt na de builds elke href in de
gebouwde HTML, ook die van `<Voorkennis>`, tegen de build van de doelsite, met
ankers (de waarheid). Lokaal: `pnpm cross-links` na `pnpm build`. Oude links
omzetten: `node scripts/zet-links-om.mjs` (na `pnpm build`).

## Incrementele CI

CI doet alleen wat een wijziging raakt. De job `plan` draait
`scripts/wijzigingen.mjs` (logica en tests in
`packages/shared/wijzigingen.js`) en schrijft `changed.json`: per bestand de
gewijzigde regels, de geraakte sites (pnpm `--filter "...[<base>]"`, dus ook
sites die van een gewijzigd package afhangen) en welke jobs draaien. De
build-matrix bevat alleen geraakte sites, en bouwt tegelijk met de tests:
een build uploadt `<site>-gebouwd`, en pas de job `publiceer` maakt daar na
groene tests `<site>-static` van, het artifact dat de hostingbackend ophaalt
(`packages/shared/ci-poort.test.ts`). Node, pnpm (via corepack) en de
pnpm-store zet elke job op met `.github/actions/node-pnpm`; een site-build
installeert alleen zijn eigen site. `cross-links` haalt de rest uit de
cache (`scripts/site-hash.mjs`, job `voorraad`). Docusaurus bouwt met Rspack
(Docusaurus Faster, `FASTER` in `packages/shared/config`): koud drie tot
zeven keer zo snel als webpack, en elke build byte voor byte gelijk. Er is
dus geen bundler-cache tussen runs (`ci-setup.test.ts`). Twee onderdelen
staan uit, en een site kan ze niet aanzetten (`createConfig` zet `faster` na
`...future`): de HTML-minifier van swc laat aanhalingstekens weg, behalve bij
een waarde met `&` of een spatie, en dan leest `controleer-cross-links.mjs`
nog maar een deel van de links (752 van de 7343 in robotica). Daarom meldt het
script elke pagina met een `href` of `src` zonder aanhalingstekens in een echte
tag als fout, en faalt het als het nergens een link vindt. En de persistente
cache van Rspack geeft andere chunk-namen dan een koude build. De blokrunners krijgen
`--alleen changed.json` en doen alleen de blokken op gewijzigde regels plus
wat erop doorbouwt (`draaien-met`); de tekstcontrole krijgt `--regels`. Een
globaal bestand (lockfile, root-config, `.github/`, de registry) of de
nachtelijke run draait alles. De verplichte check `build` (job `build-klaar`) wacht
op elke job die het plan aanzet, ook de blokrunners; alleen `tekst` telt
bewust niet mee: een spel- of stijlfout mag een merge niet tegenhouden
(`ci-poort.test.ts`). Een nieuwe runner of een nieuw bestand dat een
job leest: zet het in `RUNNERS`, `PER_JOB` of `GLOBAAL` in
`wijzigingen.js`, anders slaat CI hem stil over. De blokrunners draaien
tegelijk in één job, `blokken` (elk met een eigen venv); alleen wat in
`EIGEN_JOB` staat (fullstack, die alle cores gebruikt) heeft een eigen job. Vijf losse jobs maakten de
eerste golf van een brede run groter dan de twintig runners die GitHub
tegelijk geeft, en dan wachtte `test` een halve minuut. Een nieuwe runner
krijgt een vlag, een functie en een plek in de lus van `blokken`;
`ci-poort.test.ts` eist dat. De job `browser` opent de gebouwde python-site in
Chromium en doet daar wat een leerling in de speeltuin doet
(`scripts/rooktest-speeltuin.mjs`); hij draait als de python-site gebouwd wordt,
dus ook na een wijziging in `packages/python-runner`.

## Een les verhuizen

Een les die een ander adres krijgt (nieuwe map, nieuw nummer) laat oude links
van buiten de site (werkbladen, bladwijzers, zoekresultaten) op een 404
uitkomen. Geef de oude adressen mee als `omleidingen: [{ van, naar }]` aan
`createConfig`; `packages/shared/plugins/omleidingen.js` zet na de build op elk
oud adres een pagina die doorstuurt, en weigert een oud adres waar weer een
echte pagina staat. De python-cursus houdt de lijst bij in
`src/data/omleidingen.ts`, met een test die eist dat elk doel een les is.

## Pyodide

Elke site die Python in de browser draait (python, ctf, ide, algorithms,
play), serveert dezelfde Pyodide zelf onder `<baseUrl>pyodide/`: geen CDN,
want schoolnetwerken blokkeren die. De versie staat exact in de catalog
(`pyodide` in `pnpm-workspace.yaml`). De runtime staat niet in git: een site
met `pyodide` als devDependency krijgt hem van `createConfig` bij start en
build uit `node_modules` (`packages/shared/config/pyodide-runtime.js`). Wat
niet op npm staat, de wheels van pakketten als matplotlib of pygame-ce, staat
in `static/pyodide/` van de site en komt uit `haal:wheels`; na een upgrade
haalt de workflow `pyodide-wheels` ze zelf op en commit ze op de branch. Een
site die de gedeelde lader (`CodeExercise`, `PythonPlayground`, de editor)
gebruikt, zet het adres met `setPyodideBaseUrl` in een clientModule; zonder
die regel geeft `getPyodide` een fout. `pyodide-kopie.test.ts` en
`pyodide-adres.test.ts` in `packages/python-runner` bewaken dat: geen runtime
in git, de hele wheel-keten met de checksums uit de lock, overal dezelfde
versie, en geen CDN in de bron. Upgraden is dus: de catalog bumpen, `pnpm
install`, pushen, en de wheel-commit van de workflow afwachten.

## Browsers

Voor welke browsers de sites gebouwd worden staat in één bestand,
`.browserslistrc` in de root; een site zet er geen eigen `browserslist` naast.
Zonder dat bestand zette de babel-preset van Docusaurus alles om naar ES5 in
losse modus, en dan wordt `[...x]` `[].concat(x)`: een Map, Set of string
wordt een lijst met één element. Dat zie je alleen in de browser, want node
draait de bron zonder omzetting. Sinds Docusaurus Faster vertaalt niet babel
maar de swc in Rspack (`builtin:swc-loader`) de code, met dezelfde
browserslist. `packages/shared/browsers.test.ts` bouwt vanuit elke site een
proefbestand met de vertaler die de build gebruikt (Rspack met de loader en
de minifier van Docusaurus, of babel als `swcJsLoader` uit staat) en voert
het resultaat uit.

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
