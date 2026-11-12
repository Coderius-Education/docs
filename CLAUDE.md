# Coderius — gedeelde instructies

Deze map bevat twee soorten repos:

- **`*-docs/`** — Docusaurus-leersites. Volg de schrijfstijl, het didactisch kader en de schrijfskills hieronder.
- **`play/`** — Python-bibliotheek. Library-conventies, géén docs-conventies; zie `play/CLAUDE.md`.

Elke repo heeft zijn eigen `CLAUDE.md` met uitsluitend project-specifieke aanvullingen (lesvolgorde, naam-prefixen, lab-framing, …). Die wordt automatisch bovenop deze gids geladen.

## Preview-links

Elke branch krijgt per vak automatisch een preview op
`https://<branch-met-streepjes>--<vak>.preview.coderius.nl/<pad>/`, net zoals een
cursus in productie onder de host van zijn vak staat — de `/` in de branchnaam
wordt een `-`, `<vak>` en `<pad>` komen uit de registry. Voorbeeld: branch
`claude/status-ttlwfx` + site `play` →
`https://claude-status-ttlwfx--informatica.preview.coderius.nl/play/`. De vorm
`<branch>--<site-id>.preview.coderius.nl` (van vóór de vakken) geeft "onbekende
host". Een cursus die nieuw is in de registry of een nieuw pad krijgt, kent de
hosting pas na de merge: zijn preview werkt dan nog niet. Zet in elke
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
(`packages/shared/ci-poort.test.ts`). Het register zelf haalt de backend ook
uit CI: de job `registry` uploadt bij elke run de uitvoer van
`scripts/sites-json.mjs` als artifact `registry` (`sites.json`), en de backend
neemt dat van main over. Zonder die job kent hij geen enkele host en geeft
elke preview "onbekende host". Node, pnpm (via corepack) en de
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
versie, en geen CDN in de bron. Upgraden:

1. De versie in de catalog bumpen en `pnpm install`. Draait de nieuwe
   Pyodide een andere Python (3.13 → 3.14), dan ook `python_versie` in de
   SITES-tabel van `scripts/draai-python-blokken.py` en `python-version` van
   de job `blokken` in `build.yml`; het script stopt anders met die melding.
2. `PYODIDE_VERSION` in play's `engine.js` mee (de cachesleutel van zijn
   service worker), en play's pymunk-wheel als de `abi_version` van Pyodide
   verandert (`scripts/play-wheels.py`, zie `sites/informatica/play/CLAUDE.md`).
3. Pushen, en de wheel-commit van de workflow afwachten. Tot die er is, is
   `pyodide-kopie.test.ts` rood op de ontbrekende wheels.
4. In de preview de matplotlib-lessen van algorithms en een play-voorbeeld
   nalopen: of een grafiek of een spel er goed uitziet, ziet geen test.

De job `build` zet na elke site-build `.gz` en `.br` naast elk tekstbestand en
elke wasm (`scripts/comprimeer.mjs`, logica in `packages/shared/comprimeer.js`),
zodat ze in `<site>-static` zitten. Dat helpt alleen als de hostingbackend ze
ook serveert (nginx `gzip_static`/`brotli_static`, Caddy `precompressed`), met
`Content-Encoding` en het Content-Type van het origineel. Een python-les laadt
op 20 Mbit/s dan in 4,8 s in plaats van 8,2 s; de wasm van Pyodide gaat van
8,6 naar 2,2 MB. De rooktest in de job `browser` serveert de `.br` zoals zo'n
server en eist dat Pyodide er gewoon mee start.

Of de browser Pyodide bewaart, hangt ook af van de headers van de hosting; met
`no-store` kwam hij bij elke les opnieuw over de lijn. Daarom krijgt elke site
met Pyodide en zonder eigen PWA (play heeft er een, `src/sw.js`) van
`createConfig` een service worker op `<baseUrl>pyodide-sw.js`
(`packages/shared/pyodide-cache/sw.js`, plugin `plugins/pyodide-cache.js`,
alleen in een productie-build). Hij bewaart alleen wat onder
`<baseUrl>pyodide/` staat, en alleen wat klopt: de build zet de sha256 van elk
bestand daar in de service worker (`INHOUD`), en een bestand dat die
vingerafdruk niet heeft, geeft hij niet door en bewaart hij niet. Leerlingcode
draait in python, ctf, ide en algorithms op de origin van de site en kan via
`import js` in Cache Storage schrijven; zonder die controle draaide een
vervalste `pyodide.asm.js` na één run bij elk volgend bezoek mee. Elke versie
heeft een eigen cache, en bij het activeren gaan die van eerdere versies van
de cursus weg. `pyodide.js` vraagt hij altijd aan het netwerk (`no-cache`);
heeft de server al een andere dan de service worker kent, dan krijgt die
pagina alles van het netwerk, zodat hij nooit twee versies mengt. Een lader
moet dus altijd eerst `pyodide.js` laden. `pyodide-cache.test.ts` speelt dat
na; de rooktest controleert in Chromium dat een derde bezoek alleen
`pyodide.js` nog van de server haalt, en dat een vervalste `pyodide.asm.js` in
de cache niet draait. Weghalen kan alleen met een `sw.js` die zichzelf
afmeldt; een site zonder het bestand laat de oude service worker gewoon staan.

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

## Les-tabbladen

De opdrachtgever wil dat een leerling in een les niet meer hoeft te scrollen.
Elke `##`-sectie van een les is daarom een tabblad bovenaan de pagina, en de
inhoudsopgave rechts is weg. Dat is sinds november 2026 de standaard
(schrijfgids §2 en §15). De web-cursus, de python-cursus, robotica en
fullstack zijn omgezet, de andere nog niet. Een site zet het aan met `lesTabs: true` in `createConfig`; een
pagina zet het uit met `les_tabs: false` in de front matter.

Een cursus omzetten is werk per cursus, niet één schakelaar:

1. `lesTabs: true`, en de onderdelen in `MDXComponents` van de site.
2. Het oefenveld van de cursus leren zich aan het scherm aan te passen
   (`useInLesTab`, zoals de web-`CodeEditor` en de `CodeExercise` van
   python-runner, met `components/LesTabs/pasHoogte.ts`).
3. Bouwen en meten met `node scripts/meet-les-tabs.mjs <site>`. Wat niet op
   1280×720 past: eerst splitsen (een `###` erbij), dan inkorten.
4. Elk scherm nalopen op verwijzingen naar iets dat er niet meer staat, en
   daar een test van maken (bij web en python
   `src/docs-tests/schermen.test.ts`, bij robotica
   `src/lego-tests/schermen.test.ts`, bij fullstack
   `src/data/schermen.test.ts`, met `plugins/les-schermen.js`).
5. De docentenhandleiding herschrijven (zie Werkvormen hieronder).

Tot een cursus is omgezet, houdt hij de inhoudsopgave rechts en zijn oude
docentenhandleiding. Zet `lesTabs` dus niet aan zonder de stappen erna.

De remark-stap `packages/shared/plugins/les-tabs.js` wikkelt bij het bouwen
elke `##`-sectie in een `<LesTab>` binnen één `<LesTabs>`, en in een sectie
met `###`-koppen elke `###` in een `<LesStap>` binnen `<LesStappen>`
(`packages/shared/components/LesTabs`; de site registreert ze in
`MDXComponents`, met `LesLeerdoel`, `LesVoorbeeld`, `LesVeld` en `LesDoel`). De bron van een les verandert niet. De titel en de startcode
blijven boven de tabbladen; uitleg vóór de eerste `##` wordt het eerste
tabblad, "Uitleg"; een kop met een dubbele punt krijgt als label het stuk
ervoor. Twee dingen krijgen geen eigen tabblad, want dat was een scherm met
één zin en een knop Volgende: het leerdoel van de les ("Wat ga je leren?",
hooguit twee alinea's) staat in een `<LesLeerdoel>` bovenaan het tabblad
erna, met de kop erin voor een link en een schermlezer; en uitleg vóór de
eerste `##` van één alinea opent het eerste tabblad. Heeft dat tabblad
stappen, dan staat het leerdoel boven de rij stappen en alleen bij de eerste
(een kind van `<LesStappen>` dat geen stap is): onder de rij las het als een
deel van stap 1.

**De uitleg waar een les mee begint, is één tabblad.** Een les over
JavaScript begint met drie of vier secties uitleg, elk naar zijn onderwerp
genoemd. Als losse tabbladen stond de rij in acht van de zestien lessen op
1280 pixels op twee regels. `voegUitlegSamen` maakt er één tabblad Uitleg
van, met elke sectie als stap (en de stappen van zo'n sectie op hetzelfde
niveau); zo heeft die les dezelfde vorm als een les over HTML met zijn
Theorie. Alleen de uitleg vooraan, en alleen als er daarna nog een ander
tabblad komt. De kop van een sectie gaat mee in zijn stap, dus een link
ernaartoe blijft werken. De stap staat achteraan in de docs, na de begrippen: Docusaurus heeft
dan de id's van de koppen gezet.

Een tabblad Theorie met vijf koppen was zelf nog tot 1330 pixels te lang.
Daarom de stappen: een rij genummerde knoppen in het tabblad, één stap
tegelijk in beeld. Wat in een sectie vóór de eerste `###` staat, is de eerste
stap, "De basis" (id `<sectie>-basis`); één losse alinea hoort bij de eerste
`###` en staat daar vóór de kop (boven de stappen stond hij bij elke stap
opnieuw). Staat er in die eerste stap alleen een blok als "Deze stap
gebruikt …", dan heet hij Vooraf; opent hij met de voorspelvraag, dan heet
hij Voorspel (`basisLabel`). Een sectie die zo maar één stap zou krijgen, heeft geen stappen.
Omdat er iets vóór de kop kan staan, verbergt de opmaak de kop van een
tabblad of stap met `> h2` en `> h3`, niet met `:first-child`. De knop Volgende onderaan een tabblad loopt eerst de stappen door en
gaat dan naar het volgende tabblad. Ook de uitleg vóór de eerste `##` krijgt
stappen van zijn `###`-koppen (`uitlegMetStappen`). Uitleg vóór de eerste
`##` van één info-blok met hooguit twee alinea's is geen tabblad: hij opent
het tabblad erna, net als één losse alinea (18 projectstappen hadden een
tabblad Uitleg met alleen "Deze stap gebruikt …").

**Er gaat iets mis staat na de opdrachten**, ook als de bron hem ervoor
heeft (`foutenNaOpdrachten`). In de lessen van de python-cursus stond hij
tussen de uitleg en de eerste opdracht, en bracht de knop Volgende een
leerling langs fouten die hij nog niet had kunnen maken. Alleen in die vorm:
staat er vóór de fouten al een tabblad waarin de leerling iets doet (de
stappen en Test het van de Lego-auto), dan gaan de fouten over dat werk en
blijven ze staan. En het tabblad komt direct na de rij opdrachten: een
afsluiter als Maak het je eigen of Verder bouwen blijft het laatste.

**Wat de stap naast elkaar zet, of weglaat.** Bij het omzetten van de
python-cursus paste van de 595 schermen 250 op 1280×720. Deze regels in
`les-tabs.js`, met een `###` boven elke voorspelvraag en elke fout, brachten
dat naar 590 van de 665; de rest was splitsen en inkorten (724 van de 724):

- Een codeblok met "Uitvoer:" en zijn uitvoerblok komt in een
  `<LesVoorbeeld>`: de code links, de uitvoer rechts. Is de code twaalf
  regels of langer en de uitvoer kort, dan staan de alinea's toelichting
  erna ook rechts. Een codeblok met `<Voorspel>` eronder staat ook naast
  elkaar. Bestanden met hun naam erboven (**`rekenen.py`**, **`main.py`**)
  staan naast elkaar, met een voorspelvraag als laatste kolom.
- Het doel van een opdracht staat in het oefenveld: "Verwachte uitvoer
  (bij …):" met zijn blok, of het doelplaatje van een turtle-opdracht, vlak
  voor het veld. De stap zet ze in een `<LesDoel>` binnen `<LesVeld>`, en de
  `CodeExercise` toont ze met `useLesDoel` in zijn uitvoerkolom, onder wat de
  leerling zelf krijgt (op een smal scherm boven de code). Een blok zonder
  die kop blijft staan: gegevens om te kopiëren zijn geen uitvoer. Schrijf
  de kop dus als eigen regel, niet aan het eind van een zin.
- Een codeblok met daaronder een oefenveld met dezelfde code vervalt (er
  mag één alinea tussen staan; het veld komt dan op de plek van het blok).
- In een paneel vervalt een scheidingslijn (`---`), is een plaatje hooguit
  een derde van het scherm hoog, is een info-blok lager, en schuift een
  codeblok van meer dan zestien regels in zijn eigen vak (vier voorbeelden
  in het hoofdstuk Klassen; niet in een uitklapblok). Zo'n vak heeft een
  schaduw aan de rand waar nog code buiten beeld staat.
- Stap voor stap staat in een tabblad op de plek van de editor en de
  uitvoer, op de hoogte van het veld (`Stapper` met `hoogte`): de code
  schuift in zijn vak met de regel die aan de beurt is in beeld, en een
  tekening heeft een eigen kolom. Onder het veld was het scherm tot 1634
  pixels te lang. Heeft een turtle-opdracht een doelplaatje, dan zijn de
  eigen tekening en het doel samen niet hoger dan het veld.

Wat een auteur zelf doet: de voorspelvraag van een les staat onder
`### Voorspel` (met het voorbeeld erboven was dat scherm tot zeshonderd
pixels te lang; zet de kop boven de zin die de code inleidt), elke fout
onder Er gaat iets mis heeft een eigen `###`, en een lange projectopdracht
heeft twee stappen, `### De opdracht` (de beschrijving) en `### Aan de slag`
(de zin over het programma van de vorige stap, het doelplaatje of de
verwachte uitvoer, het veld, tip en oplossing). Gegevens die de leerling
moet kopiëren, staan bij het veld, na "Plak je programma …", in een
uitklapblok: hij heeft één klembord, en stonden ze op het scherm ervoor,
dan was zijn programma weg op het moment dat hij het wilde plakken. "Kopieer
je programma voordat je verdergaat" staat aan het eind van de opdracht, op
het scherm met het veld, niet op het laatste tabblad. Onder een
voorspelvraag staat geen code die het antwoord laat zien: wat erna komt,
staat in zijn `<Uitleg>` of in een volgende stap. De python-cursus bewaakt
dit in `src/docs-tests/schermen.test.ts`.

**Werkvormen: de schakel naar vakdidactiek.** Elk tabblad heeft een werkvorm:
wat de leerling daar doet (leerdoel, uitleg, stap voor stap, bouwen en
aansluiten, voorspellen, onderzoeken, aanpassen, zelf maken, controleren,
fouten herkennen; bouwen en controleren kwamen met robotica, voor Materiaal,
Aansluiten en de Controlevraag). De lijst staat in
`packages/shared/werkvormen/werkvormen.json`: per werkvorm de koppen waaraan
je hem herkent, een icoon (paden van een lijntekening, geen emoji) en
minstens één tip van vakdidactiek. Een kop die bij geen werkvorm hoort, is
uitleg; van een rij genummerde opdrachten is de laatste zelf maken
(`laatsteVan`), tenzij de startcode van het oefenveld te lezen is: dan is
een opdracht op code die er al staat aanpassen en een opdracht met een leeg
veld (alleen commentaar) zelf maken (`vormNaarStartcode`; in de
python-cursus begint de helft van de opdrachten leeg). De remark-stap geeft elk `<LesTab>` zijn werkvorm mee en het
tabblad toont het icoon; voor een leerling is het alleen een herkenningsteken.
De betekenis staat in de docentenhandleiding, en dat is ook waar die
handleiding over gaat: `<Werkvormen />` toont de onderdelen van een les in de
volgorde van de les, elk met zijn tip bij vakdidactiek en de paper erbij
(`bron` in `werkvormen.json`, "Auteurs (jaar)"; een tip uit de praktijk heeft
er geen). Alleen de werkvormen die in meer dan één les van de cursus
voorkomen staan erin (python heeft alleen in zijn introductie een leerdoel),
en een `<Voorspel>` in de uitleg telt als voorspellen: de python-cursus heeft
geen tabblad Predict. `<LesWerkvormen les="html-css/koppen-lijsten" />` toont de iconen van
één les (`components/Werkvorm`); de web-handleiding gebruikt hem niet meer,
want elke les heeft daar dezelfde rij. De
gegevens per les komen uit `plugins/werkvormen.js`, die `createConfig` aanzet
bij `lesTabs`: hij leest elke les met de MDX-parser van Docusaurus zelf en
dezelfde stap die de tabbladen maakt, dus de handleiding toont wat de
leerling ziet. `werkvormen.test.ts` eist dat elke tip bij vakdidactiek
bestaat onder dezelfde naam en met dezelfde paper; hernoem je daar een tip of
verander je de bron, pas dan `werkvormen.json` mee aan.

**De docentenhandleiding schrijft niet voor hoe iemand lesgeeft.** Dat is
de standaard (schrijfgids §15); web, python, robotica en fullstack hebben hem zo. Hij is een halve pagina: waar de lessen op steunen
(de tabel hierboven, met de literatuur), wat je vooraf wilt weten in drie
regels, en links naar leerdoelen, eindopdracht en nakijker. Wat een leerling
of docent nodig heeft om het materiaal te gebruiken, hoort in het materiaal
zelf: het oefenveld legt zijn knoppen en zijn opslag uit, de nakijker zijn
eigen stappen, de les zijn opbouw. Lesadvies ("bespreek Predict plenair"),
een beschrijving van elke knop en een tabel met alle lessen stonden er wel
in, en zijn weg. De andere cursussen hebben nog de oude handleiding; die
gaat om op het moment dat de cursus tabbladen krijgt, want de tabel
`<Werkvormen />` komt met `lesTabs`.

Wat vastligt, en waarom:

- **Elk paneel blijft gemount en staat in de HTML van de build**; een paneel
  dat niet aan de beurt is, is `hidden`. Een oefenveld dat opnieuw mount raakt
  zijn werk kwijt (de opslag van de web-`CodeEditor` hangt aan de volgorde van
  alle velden op de pagina), en `cross-links` zoekt het doel van een link in
  de HTML. Geen `@theme/Tabs`: dat mount na het laden opnieuw.
- **Geen `transform`, `filter`, `contain`, `overflow`, `z-index` of animatie
  op de wortel en de panelen.** Elk daarvan maakt een eigen laag, en dan valt
  een oefenveld op Groter (`position: fixed`) onder de navbar.
- **Het onderdeel volgt zelf het adres** (`useLocation`): Docusaurus scrolt
  niet naar een kop in een verborgen paneel. Een link naar een kop opent het
  tabblad en de stap waarin hij staat en scrolt er dan naartoe; een klik op
  een tabblad of een stap zet de hash met `history.replaceState`, buiten de
  router om. Het doel van een adres is een kop óf een paneel: het tabblad
  Uitleg en de stap De basis hebben geen kop.
- **Boven de tabbladen staat zo weinig mogelijk.** Op een breed scherm
  (vanaf 997px, waar de lessenlijst links staat) vervalt het kruimelpad en is
  de titel 1,75rem; dat scheelt honderd pixels per tabblad. In een paneel is
  de `##` zo groot als een tussenkop, is een uitklapblok lager, en staan een
  tip en een antwoord die dicht zijn naast elkaar.
- **Een oefenveld in een tabblad past zich aan het scherm aan.** Het veld
  vraagt met `useInLesTab()` of het in een tabblad staat. De web-`CodeEditor`
  zet code en voorbeeld daar vanaf 769px naast elkaar, ook in een veld dat
  `stacked` is, en neemt de hoogte die op het scherm overblijft na wat er in
  het paneel boven en onder staat (`pasHoogte.ts`: nooit hoger dan de
  `height`-prop, nooit lager dan 240 pixels). Staat er in het paneel een tip
  of antwoord open, dan meet het veld niet opnieuw: de editor kromp anders
  onder het typen. Buiten een tabblad en op een telefoon verandert er niets.
  De `CodeExercise` van python-runner doet hetzelfde vanaf 997px: code links,
  uitvoer rechts, met het vak voor de uitvoer er al voordat er iets gedraaid
  is (anders schoof de knop Volgende weg bij de eerste klik op Uitvoeren).
- **De les krijgt de breedte van de inhoudsopgave** met een regel in
  `@layer docusaurus.infima`. Docusaurus zet de kolom op 75% met `!important`
  in een latere layer, en bij `!important` wint de eerste layer; een losse
  regel verliest, hoe specifiek ook.
- Op papier staan alle panelen onder elkaar.

**Elk scherm staat op zichzelf.** Een tabblad of stap is alles wat de
leerling op dat moment ziet. Een zin als "de startcode in de editor
hieronder" klopte op de lange pagina en wijst nu naar een ander tabblad: in
14 van de 33 web-lessen vroeg Predict zo naar code die er niet stond. Wijs
dus alleen naar wat in hetzelfde scherm staat, en zet de code waar een vraag
over gaat erbij. Wat op een ander scherm staat, noem je bij zijn naam ("uit
de uitleg", "in de volgende stap"). De cursus bewaakt dat zelf
(`src/docs-tests/schermen.test.ts` van web en van python,
`src/lego-tests/schermen.test.ts` van robotica; ze lezen een les met
`packages/shared/plugins/les-schermen.js`, dezelfde stap als de build; een
plaatje telt daar als iets dat te zien is, `opTab` is wat er op het tabblad
staat).

Een kop die op zijn tabblad of stap al voluit staat, is verborgen voor het
oog en blijft voor een schermlezer en een link. Bij die verborgen kop hoort
`overflow: hidden`: `clip-path` verbergt de tekst, maar hij telt dan nog mee
voor de breedte van de pagina, en op een telefoon schoven 18 schermen
daardoor zijwaarts. Op een telefoon schuift de rij stappen, net als de rij
tabbladen; zes stappen onder elkaar waren 240 pixels knoppen.

`les-tabs.test.ts` en `components/LesTabs/LesTabs.test.tsx` bewaken dit.
Tabbladen garanderen niet dat een onderdeel op één scherm past:
`node scripts/meet-les-tabs.mjs <site>` (na een build, met Playwright) meet
per les, per tabblad en per stap op 1280×720 en 1366×768 hoeveel pixels het
te lang is, op hoeveel regels de rij tabbladen staat, en (ook op 390×800)
of een scherm zijwaarts schuift. Het opent vier lessen tegelijk; met
`--les=klassen/15f` meet het alleen de lessen met dat stuk in hun pad, en
met `--klik` klikt het in elk scherm met een Python-veld ook op Uitvoeren en
op Stap voor stap en meet het na elke klik opnieuw: een scherm dat past tot
je iets aanklikt, past niet. Wat
dan nog te lang is, is tekst: een stap of een Er gaat iets mis met meer
inhoud dan op een scherm past. Dat lost een auteur op, niet de opmaak.
**Wat robotica erbij bracht** (november 2026; alle 398 schermen passen op 1280×720 en 1366×768). De cursus heeft drie
docs-plugins (`docs/`, `lego_auto/`, `golfbot/`), delen die twee pagina's
importeren, blokprogramma's, aansluitschema's en bouwstappen. Daarvoor is dit
in de gedeelde stap en de onderdelen gekomen, elk met een test:

- **Elke docs-plugin krijgt de stap** (`metLesTabsInPlugins` in de config),
  niet alleen die van het preset.
- **Een deel** (een bestand of map met `_` vooraan, bij robotica
  `docs/onderdelen/_delen/`) krijgt geen tabbladen: het staat in een tabblad
  van de pagina die het importeert. Het krijgt wel stappen van zijn
  `###`-koppen (`deelMetStappen`) en dezelfde naast-elkaar-regels.
- **Een les zonder tabbladen** (één sectie, of alleen een deel) krijgt de
  marker `data-les-zonder-tabs` en daarmee dezelfde kop en breedte als de
  lessen eromheen: geen kruimelpad, een kleine titel, geen lege kolom rechts.
- **Een les die met een inleiding én een leerdoel begint**, heeft die twee
  samen als eerste tabblad (`opening`).
- **Een plaatje met de tekst erna staat naast elkaar** (`plaatjesNaastTekst`,
  `<LesVoorbeeld beeld>`): het aansluitschema met de pinnen, een
  blokprogramma met zijn uitleg, de sensorsimulator met zijn vragen. Een kort
  codeblok na die tekst gaat mee.
- **Drie of meer plaatjes achter elkaar zijn een reeks** (`<LesReeks>`): één
  tegelijk, met Vorige en Volgende, zoals in een bouwboekje. Elk plaatje staat
  in de HTML van de build.
- **Code met wat hem toelicht staat naast elkaar** (`toelichtingNa`): een
  lijst of een waarschuwing, met hooguit een alinea ertussen; een tabel
  alleen naast code van zes regels of meer (naast een fragment brak elke
  cel); een programma van meer dan zestien regels ook met alleen een alinea. Code met
  alleen een alinea eronder blijft lopende uitleg. Code met `**Vraag:** …` en
  de tip en oplossing eronder staat naast de vraag; `**Code A:**` en
  `**Code B:**` staan naast elkaar als bestanden. De code krijgt de breedte
  van zijn langste regel, tussen veertig en zeventig procent (ook in
  `<CodeUitleg>`); past een regel daar niet in (meer dan 66 tekens,
  `pastNaast`), dan blijft de code over de volle breedte. Op een vaste
  helft was de importregel van leaphymicropython afgesneden, en in
  `inline-onclick` van web de helft van een regel. En alleen als het scherm
  er korter van wordt (`naastIsKorter`, een schatting uit de lengte van de
  code en de toelichting): één regel code naast een lijst, een alinea en een
  info-blok in een kolom van dertig procent was in `events` van web 214
  pixels langer dan onder elkaar. Twee bestanden met een
  regel van meer dan 46 tekens staan iets kleiner (`bestanden="smal"`).
- **Een lange rij opdrachten** (negen tabbladen of meer, vier opdrachten
  achter elkaar) toont na de eerste alleen het nummer (`kort` op `<LesTab>`,
  `korteOpdrachten`); het label blijft voor de knop Volgende en een
  schermlezer.
- **Uitleg die samen meer dan acht stappen heeft**, blijft losse tabbladen
  (`voegUitlegSamen`), zolang de rij tabbladen kort is.
- **Een stap die "Stap 2: Kies een pin" heet**, heeft "Kies een pin" als
  label (`stapLabel`): de stappen hebben al een nummer. Een tabblad houdt
  "Stap 2": de lestekst van de Lego-auto verwijst ernaar ("zie stap 1"), en
  met de titels past de rij niet op één regel. De eerste stap van een sectie met een dubbele punt in de kop heet
  naar het stuk erna (`basisLabel`).
- **`<CodeUitleg>` zet in een tabblad de uitleg naast de code**, en schuift
  het codevak naar de regel die oplicht.
- **Iets onder een codeblok** (de link Open in de editor van robotica) zet
  `--les-codevak-af` op zijn hoogte: het vak van een lang programma is dan
  zoveel lager. Het codeblok met zijn link is één element, geen fragment:
  in een `<LesVoorbeeld>` is elk kind een kolom.
- Een onderdeel van een site past zich zelf aan met `useInLesTab()`: de
  kaart `<Probleem>` is in een tabblad dicht tot je hem aanklikt, een
  blokprogramma (`Blokken`) schaalt ook op de hoogte van het scherm.

Het meetscript loopt de hele build af, niet alleen `build/docs`. Een rij
stappen mag op twee regels staan (in web en python gebeurt dat ook); de rij
tabbladen niet.

**Passen is niet genoeg.** Een review van robotica als leerling vond wat
"past op het scherm" niet ziet: een aansluitschema op 128 bij 240 pixels,
code die zijwaarts was afgesneden, een script van 46 regels in een vak van
twaalf, en een vraag in een dicht blok. Sindsdien:

- **Wat er op het scherm over is, gaat naar het codevak of het plaatje**
  (`components/LesTabs/speling.ts`, aangeroepen na elke wissel van tabblad of
  stap, een plaatje dat laadt en een andere maat van het venster): eerst een
  codevak dat schuift, anders het plaatje naast zijn tekst. Niet op een
  telefoon, niet met een tip of antwoord open, en niet in een paneel met een
  oefenveld: dat neemt de ruimte zelf, en `meetRuimte` zet daarvoor
  `data-heeft-veld` op het paneel.
- **Een klik op een plaatje dat kleiner staat dan het is, toont het groot**
  in een `<dialog>` (`components/LesTabs/Vergroot.tsx`); Enter werkt ook.
  Niet voor een plaatje in een knop of een link.
- **Op een telefoon heeft een plaatje in de lestekst geen plafond**: daar
  scrolt de leerling toch. Het doelplaatje in een oefenveld houdt het wel.
- **Het tabblad Uitleg heet `les-uitleg`** als een kop verderop op de pagina
  al het id `uitleg` heeft, ook een `###`: een stap is ook een adres.
- **Een link naar een doel dat al in beeld is, scrolt niet.**
- **Een opdracht met code en `**Vraag:**`, zonder veld, heeft de werkvorm
  voorspellen**; "Probeer het zelf" is aanpassen.
- **Het meetscript meldt ook** code die zijwaarts is afgesneden, een
  programma in een vak dat schuift (met hoeveel regels er te zien zijn),
  plaatjes onder een derde van hun grootte zonder vergroting, en dubbele
  id's op een pagina.

**Wat een tweede doorloop als leerling vond.** De eerste doorloop keek of
elk scherm te gebruiken was; de tweede las de lessen van voor naar achter en
klikte op elke knop Volgende. Sindsdien:

- **De knop Volgende kijkt naar wat in beeld is.** Stappen in een
  uitklapblok doen niet mee (een deel dat een les in een `<details>`
  importeert, heeft eigen stappen: in Deel 5 van de Lego-auto deden twee
  klikken niets). Een reeks plaatjes die nog niet uit is, gaat voor: de knop
  zegt "Volgende: plaatje 2 van 10" en gaat pas na het laatste plaatje naar
  de volgende stap (`ReeksContext`, en `OpenContext` in `paneel.ts`: een
  reeks in een stap die dicht is, doet niet mee).
- **Een stap heeft geen nummer in zijn kop.** De knop nummert al, en een
  stap Vooraf of De basis schuift de telling op: "Stap 1: kies de juiste
  interpreter" stond onder knop 2. Een tabblad dat "Stap 2" heet en zelf
  stappen heeft, maakt "zie stap 2" dubbelzinnig; alleen de Lego-auto houdt
  zulke tabbladen, omdat `## Stap N` daar het lesformat is.
- **Het label Klik om te vergroten** staat op de hoek van het plaatje zelf
  (`data-vergroot-vak` op het element eromheen, met `--vergroot-x` en
  `--vergroot-y`), ook bij een `<figure>` of in een reeks, en niet waar het
  venster het plaatje niet groter kan tonen (een telefoon). Het venster
  opent op de plek waar geklikt is: een staand schema is vergroot drie keer
  zo hoog als het scherm.
- **`<CodeUitleg>` opent een lang programma op de eerste regel met uitleg**
  (`useInBeeld`), één keer: "twee wijzigingen in je loop" met regel 1 tot 15
  van 35 in beeld liet de nieuwe regels niet zien.
- **Tussen 997 en 1200 pixels** (een iPad liggend) is de les 690 pixels
  breed. Code met iets ernaast staat daar in een flex-rij die breekt als de
  langste regel niet past, en het codevak begint lager. Op 1024×768 is geen
  code meer afgesneden (dat was op 22 schermen van robotica zo) en passen
  374 van de 398 schermen; de maat waarop elk scherm moet passen blijft
  1280×720.
- **Het meetscript wacht op het lettertype** (`document.fonts.ready`): met
  het reservelettertype telde het één regel tabbladen waar er twee stonden.
- **Lezen vindt wat meten niet ziet**: een lampje met de verkeerde kleur,
  een sensor zonder aansluitschema, een controlevraag over pinnen die nog
  niet genoemd waren. Een doorloop leest dus ook.

Bekende nadelen: Ctrl+F vindt geen tekst in een tabblad dat niet open staat,
bij een link naar een kop is heel kort het eerste tabblad te zien, Matomo telt
een tabblad niet als bezoek, en de begrippen-stap markeert het eerste
voorkomen op de pagina, ook als dat in een later tabblad staat. Een lang
programma schuift in zijn vak, ook met de vrije ruimte erbij: van een script
van 46 regels zijn er vijftien te zien.

**Wat fullstack erbij bracht** (november 2026; alle 1330 schermen passen op
1280×720 en 1366×768). De cursus heeft 148 lessen zonder oefenveld: uitleg,
code met een bestandsnaam erboven (`<Bestand pad>`), een blok `<Gelukt>` en
meerkeuzevragen. Bij de eerste meting pasten 801 van de 1054 schermen.
Daarvoor is dit in de gedeelde stap en de onderdelen gekomen, elk met een
test:

- **Een controlevraag is een eigen stap** (`vragenAlsStap`): een
  `<Voorspel soort="Controlevraag">` aan het eind van een stap met code en
  een succesmoment is zelf driehonderd pixels hoog. De stap heet
  Controlevraag (de tweede in een tabblad Controlevraag 2), met een eigen
  adres. Alleen als er iets vóór staat dat een scherm vult, en erna alleen
  nog wat bij de vraag hoort.
- **De bestanden waar een voorspelvraag over gaat, staan samen links van de
  vraag** (`heeftLabel`), en twee korte bestanden met een `<Bestand>`-label
  zonder vraag staan naast elkaar (alleen als elke regel in de halve breedte
  past, 58 tekens).
- **Code naast een vraag of naast zijn uitvoer krijgt de breedte van zijn
  langste regel** (`.metVraag`: veertig tot zesenzestig procent;
  `.voorbeeld`: veertig tot zeventig, de uitvoer krijgt de rest). Op een
  vaste helft was bij twaalf voorspelvragen het eind van een regel
  afgesneden.
- **Een regel code staat heel op één regel.** De opdrachtgever wil geen
  regel die afbreekt of zijwaarts buiten zijn vak valt. Past de langste regel
  van een blok niet, dan maakt `components/LesTabs/pasCode.ts` de letters van
  dat blok kleiner, tot 80% (11,8 pixels). Het draait na elke wissel van
  tabblad of stap, een klik (een uitklapblok), een andere maat van het
  venster, en als het lettertype van de code geladen is: dat laadt pas als
  er code in beeld komt en is breder dan wat er tot dan staat. Op een pagina
  zonder tabbladen doet de clientmodule `codeOpElkePagina.ts` het
  (`createConfig` zet hem aan bij `lesTabs`). Code naast de uitleg van een
  `<CodeUitleg>` krijgt pas een bredere kolom (74%, `data-code-breed`) als
  kleinere letters niet genoeg zijn: met een altijd bredere kolom was de
  uitleg zo smal dat het scherm langer werd. Past een regel ook dan niet
  (`data-code-breekt`), dan breekt alleen een blok zonder taal af (een
  foutmelding, uitvoer van de terminal: die breekt in een terminal ook af),
  en in `<CodeUitleg>` een regel met zijn nummer ervoor (het vervolg springt
  vier tekens verder in, `--inspringing`); dat laatste komt op 1280 pixels
  niet meer voor. Wat met de kleinste letters niet past, hoort korter in de
  les: op 1280 pixels passen er 84 tekens naast de uitleg en 123 over de
  volle breedte. In fullstack zijn 55 regels herschreven (een functiekop met
  elke parameter op een eigen regel, een dictionary over meer regels), overal
  dezelfde regel op dezelfde manier, en `schermen.test.ts` houdt de lengte
  vast. Kleinere letters maken een blok ook lager: een programma dat eerst
  in zijn vak schoof en mocht krimpen, is dan heel te zien en krimpt niet
  meer, dus meet na zo'n wijziging opnieuw. Het meetscript meldt afgesneden
  code, afgebroken regels en de kleinste letters per scherm.
- **Een codeblok dat heel te zien is, levert hooguit een paar regels in**
  als het scherm anders net niet past (`NOODGREEP` in `speling.ts`, tachtig
  pixels, en nooit onder acht regels); een vak dat al schuift, geeft toe tot
  acht regels. `<CodeUitleg>` krimpt als één rij.
- **Uitleg met meer dan acht stappen blijft alleen losse tabbladen als de
  rij past** (`rijPast`: 32 pixels per tabblad plus 7 per letter).
- **In een paneel** heeft een tabel lagere rijen, staat het label van een
  voorspelvraag vóór de vraag op dezelfde regel, en breekt de knop Volgende
  af (een stap heet in Er gaat iets mis naar de foutmelding; op een telefoon
  schoven acht schermen daardoor zijwaarts).
- Een onderdeel van de site past zich zelf aan met `useInLesTab()`:
  `<Gelukt>` zet het vinkje en "Lukt het niet?" op één regel.
- **De tabel `<Werkvormen />` telt ook wat in een stap zit**
  (`plugins/werkvormen.js`): een `<Voorspel soort="Controlevraag">` is
  controleren en geen voorspellen, en een opdracht met zijn werkvorm in de
  kop ("Opdracht 3: Investigate - …") telt als die werkvorm. In fullstack
  is Opdrachten één tabblad met de vijf stappen van PRIMM erin; zonder deze
  regel ontbraken controleren, onderzoeken en zelf maken in de handleiding.

En in de lessen: zo'n tweehonderd `###`-koppen erbij (Het script draaien, De
uitkomst, Test jezelf), de tip boven `## Opdrachten` eronder (dan is hij de
stap Vooraf en niet het eind van de uitleg), kortere koppen voor de rij
tabbladen met het oude adres als vast id, en `les_tabs: false` op de
pagina's waar je zoekt, print of afvinkt. Wat een auteur hieruit meeneemt:
een rij stappen op twee regels kost elk scherm van dat tabblad veertig
pixels, dus houd de koppen kort; en een lange foutmelding of een FOUT/GOED
van tien regels maakt een fout in Er gaat iets mis te lang, dus toon alleen
de regel die verandert.

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

## Leerdoelen

Een cursus met leerdoelen heeft één bestand, `src/leerdoelen.json`: de tabel
van de docent uit het beoordelingsblad, per concept één rij met per niveau
basis, gevorderd of expert naast elkaar. De niveaus zijn voor elke cursus
dezelfde vier (`packages/shared/leerdoelen/niveaus.json`), Niveau 1 tot en met
Niveau 4; een cursus zet in `niveaus` welke hij heeft (`["1", "2"]`), en de
nakijker maakt er de leerroutes van. Een concept dat niet bij een niveau hoort,
krijgt daar `null`: dan staat het niet op de pagina van dat niveau en telt de
nakijker het in die leerroute niet mee (`inTrack` in `packages/checker`). Noem op de sites alleen de niveaus, geen
schoolsoort; `leerdoelen.test.ts` weert die woorden uit de leerdoelen en de
pagina's. Een rij blijft op één regel, zodat je
de niveaus met het oog vergelijkt en een wijziging één regel in de diff is: `biome.json`
formatteert het bestand niet (een rij met een toelichting en drie niveaus
werd langer dan de 320 tekens die biome hoogstens toestaat), en
`leerdoelen.test.ts` eist het.
Elk concept wijst met `les` naar de les waar je het leert (een doc-id, met de
docs-plugin ervoor als twee plugins hetzelfde id hebben: `lego_auto:intro`); de
plugin zoekt titel en adres op en stopt de build bij een les die niet bestaat of
die in twee plugins staat. Een kop met een id op de leerdoelenpagina is een
`@theme/Heading`, anders kent Docusaurus het anker niet (`leerdoelen.test.ts`).
`createConfig` ziet het bestand en zet `packages/shared/plugins/leerdoelen.js`
aan: het overzicht `/leerdoelen` (links naar de niveaus en, bij meer dan één,
naar de vergelijking, en onderaan de uitleg van Bloom, voor elke cursus
gelijk), een pagina `/leerdoelen/niveau-<n>` per niveau, bij meer niveaus
`/leerdoelen/vergelijken` met bovenaan per overgang wat er verandert (`verschillen`: erbij, nu basis, nu gevorderd, nu expert, valt af; geen "makkelijker", want wat op een hoger niveau basis wordt, verwacht je van iedereen) en daaronder de niveaus naast elkaar, standaard alleen de rijen die verschillen, met in een veranderde cel wat hij was (`overgang`); de pagina van een niveau zet "was …" of "nieuw" bij een concept dat anders is dan het niveau ervoor, en het overzicht telt per niveau de verschillen (`Vergelijking.test.tsx`), een link in de footer, en na de build `leerdoelen.json` in de
root van de cursus voor coderius.nl. Een fout in het bestand stopt de build.
De denkvaardigheden, de cijfertabel, het sjabloon en de vuistregels staan in
`packages/shared/leerdoelen/bloom.json`. Elke denkvaardigheid heeft een
`omschrijving` (wat je doet, en bij analyseren, evalueren en creëren wat je
oplevert: een uitleg, een keuze met een reden, iets nieuws), en elk werkwoord
hoort bij één denkvaardigheid; evalueren heeft alleen beoordelen
(`leerdoelen.test.ts`); `leerdoelen/index.js` leest en
rekent (`leesLeerdoelen`, `cijferVoor`, `sjabloonZin`, `moeilijkheidVoorstel`),
zodat pagina en nakijker hetzelfde zeggen. De nakijker van een cursus maakt
zijn concepten met `leerdoelenNaarConfig` (`packages/checker`); een rij zonder
herkenning, of een herkenning zonder rij, is een fout. Met de leerdoelen in
de config stelt de docentweergave een cijfer voor: de docent kiest de
denkvaardigheid, de nakijker stelt de moeilijkheid voor (gevorderd alleen bij
een gevorderd concept in élk onderwerp dat gevorderde concepten heeft; een
onderwerp zonder telt daar niet mee, en de reden noemt dan welke wel), en
cijfer en zin komen in de PDF. Met `gevorderdInGroepen` (`{ "2": { "play": 2 } }`)
vraagt gevorderd op dat niveau gevorderde concepten in minstens zoveel groepen
van het onderwerp, zodat één startmenu op play niveau 2 nog geen gevorderd is.
Expert telt voor het cijfer als gevorderd en heeft geen kolom in de cijfertabel; de pagina van een niveau met expert (`heeftExpert`) zegt dat expert vooral dient om te laten zien dat je meer kunt dan het lesmateriaal. Een niveau kan ook met een tentamen worden afgesloten (`tentamen` in het bestand, bij Algoritmiek niveau 2): dan heeft een rij op dat niveau een lijst manieren om het te kennen in plaats van een moeilijkheid, en zet de plugin bij elke manier de les uit de map van het concept waar je hem oefent; de pagina van dat niveau legt het tentamen uit, met de bron bij vakdidactiek. Een rij met `null` op het tentamenniveau staat daar niet op (`onderwerpenOpNiveau`), zoals de projecten van niveau 1 bij Algoritmiek.
Een bron noemen we alleen als vakdidactiek hem uitlegt: elke bron in
`bloom.json` wijst naar een pagina onder `/bronnen/` van de didactiek-site, met
dezelfde paper (`leerdoelen.test.ts`). Bij Bloom is dat de kernpaper van
Krathwohl (2002).
Hoe je een rij of een niveau toevoegt: `packages/shared/leerdoelen/README.md`.
Het voorstel kijkt naar de onderwerpen, en als een leerroute er maar één
heeft naar de groepen daarin (`voorstelOnderdelen` in `packages/checker`;
fullstack niveau 1 en 2). Voor basis telt een onderdeel met
basisconcepten, voor gevorderd en expert een onderdeel met concepten op die
moeilijkheid of hoger. Is een moeilijkheid ergens alleen met een vinkje te
halen, dan zegt het voorstel dat. Een gekozen moeilijkheid geldt alleen op de
leerroute waarvoor de docent hem koos (`moeilijkheidRoute`), en de PDF noemt
niveau, voorstel en reden.
Wat niet van de leerling is, telt niet mee: een venv (ook als hij `env`
heet), een reservekopie (`… - kopie`, `backup`), een bibliotheek
(`bibliotheek` in de config: addons van Godot, `lib/` van robotica,
`controleer.py` van fullstack) en commentaar (`commentaar`: per
bestandssoort de taal, `packages/checker/src/commentaar.ts`). Verder kent de
config `perBestand` (een drempel in één bestand), `metCommentaar` (een concept
over commentaar) en `detectieVoor` (een herkenning die van het project
afhangt, zoals de namen van de autoloads).

## Begrippen

Een cursus met moeilijke woorden heeft `src/begrippen.json`: per begrip een
`id`, de `term`, de `vormen` waarop hij in de tekst staat (meervoud erbij), een
`kort` van één zin (tussen backticks is code) en de `les` die het uitlegt, met
eventueel een `anker`. `createConfig` ziet het bestand en zet
`packages/shared/plugins/begrippen.js` aan. Een remark-stap zet bij het bouwen
het eerste voorkomen van elk begrip op een pagina in `<Begrip id="…">`: alleen
in lopende tekst (`.md` en `.mdx`), niet in code, koppen, links, tabellen,
cursief, een `<summary>` of een andere component, en niet op de les die het
begrip zelf uitlegt. Een tabel niet, omdat Infima hem zelf laat schuiven en het
kadertje daarin half wegviel; cursief niet, omdat daar de Engelse voluit-vorm
van een afkorting staat (*secure shell*). Een klik of
tik opent een kadertje met de uitleg en links naar die les en naar de
woordenlijst; het woord is zelf geen link, want een les met een oefenterminal
verliest zijn werk als je de pagina verlaat. `woordenlijst` in het bestand is
het doc-id van de pagina met `<Woordenlijst />` (alle begrippen op alfabet, met
een zoekveld); `overslaan` noemt pagina's zonder tooltips (de cheatsheet: zijn
zoeker leest de tekst van een item, ook die van een kadertje). Beide
componenten staan in `MDXComponents` van de site. `begrippen.test.ts` eist per
cursus dat elke les bestaat, het begrip noemt en het anker heeft, en dat elk
begrip ergens in lopende tekst staat; een woord dat alleen als code voorkomt
(`localhost`) hoort er dus niet in. Een `les` is een les die het begrip echt
uitlegt, niet een die het alleen gebruikt; legt geen les het uit (een poort),
dan krijgt het begrip geen les. Schrijf de uitleg zo dat hij klopt op elke
plek waar het woord staat: "vingerafdruk" is in 2.1 de hash van een wachtwoord
en in 7.2 die van een computer. Het gedrag van het kadertje pint
`components/Begrip/Begrip.test.tsx` vast; of het binnen beeld blijft, meet
alleen een browser. Linux heeft de eerste
(`sites/informatica/linux/src/begrippen.json`).

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
