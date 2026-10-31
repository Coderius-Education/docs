# Coderius

Lesmateriaal voor informatica, wetenschapsoriëntatie en techniek in het
voortgezet onderwijs, online op [coderius.nl](https://coderius.nl). Leerlingen lezen er niet alleen: ze
voorspellen wat code doet, draaien hem in de browser, passen hem aan en bouwen
zelf iets (de PRIMM-methode). Deze repo bevat alle cursussites, de homepage en
de gedeelde onderdelen in één pnpm-monorepo.

## Cursussen

Elke cursus is een eigen Docusaurus-site en hoort bij een vak. Een vak heeft
een eigen host, en de cursus staat onder een pad daarvan.

| Cursus | Map | Online | Waarover |
|:---|:---|:---|:---|
| VS Code & Git | `sites/informatica/editor` | https://informatica.coderius.nl/editor/ | Programmeren in de editor VS Code, en je code bewaren en delen met Git en GitHub. |
| Python | `sites/informatica/python` | https://informatica.coderius.nl/python/ | Leer stap voor stap programmeren in Python. |
| Webontwikkeling | `sites/informatica/web` | https://informatica.coderius.nl/web/ | Maak je eerste website met HTML, CSS en JavaScript. |
| Coderius Play | `sites/informatica/play` | https://informatica.coderius.nl/play/ | Maak games met Python en pygame. |
| Algoritmes | `sites/informatica/algorithms` | https://informatica.coderius.nl/algoritmes/ | Leer algoritmes door ze zelf uit te voeren. |
| Fullstack (FastAPI) | `sites/informatica/fullstack` | https://informatica.coderius.nl/fullstack/ | Voeg een Python back-end toe aan je website met FastAPI. |
| Robotica | `sites/informatica/robotica` | https://informatica.coderius.nl/robotica/ | Stuur sensoren en motoren aan met MicroPython. |
| Embedded | `sites/informatica/embedded` | https://informatica.coderius.nl/embedded/ | Programmeer microcontrollers: van Arduino tot STM32. |
| Godot | `sites/informatica/godot` | https://informatica.coderius.nl/godot/ | Bouw je eerste 2D game in Godot 4. |
| Capture The Flag | `sites/informatica/ctf` | https://informatica.coderius.nl/ctf/ | Leer cybersecurity door CTF-challenges op te lossen. |
| DVWA Websecurity | `sites/informatica/dvwa` | https://informatica.coderius.nl/dvwa/ | Oefen websecurity in een veilige DVWA-omgeving. |
| Online Editor | `sites/informatica/ide` | https://informatica.coderius.nl/ide/ | Schrijf en draai code direct in je browser. |
| Onderzoek | `sites/wo/onderzoek` | https://wo.coderius.nl/onderzoek/ | Leer onderzoek doen, van een scherpe vraag tot een eerlijke conclusie. |
| Hartjespuzzel | `sites/techniek/hartjespuzzel` | https://techniek.coderius.nl/hartjespuzzel/ | Leermateriaal: Opdracht hartjespuzzel. |
| Didactiek (voor docenten) | `sites/informatica/didactiek` | https://informatica.coderius.nl/didactiek/ | Didactische tips en achtergrond voor docenten. |

De homepage `sites/home` (SvelteKit) toont alle cursussen met filters op vak,
niveau en thema, en heeft pagina's voor docenten.

Deze tabel volgt de registry `packages/shared/sites.js`: daar staan vak, map,
adres, omschrijving en voorkennis van elke cursus, en alles in de repo leest
ze daaruit (de navbar, de footer, links tussen cursussen, de scripts). Een
nieuwe cursus of een ander adres pas je dus daar aan, en daarna deze tabel;
`packages/shared/readme.test.ts` controleert dat ze overeenkomen.

## Wat waar staat

```
sites/<vak>/<cursus>/   een Docusaurus-site per cursus
  docs/                 de lessen (MDX)
  src/                  eigen componenten, pagina's (o.a. /docenten) en tests
  CLAUDE.md             afspraken die alleen voor deze cursus gelden
                        (de meeste cursussen hebben er een)
sites/home/             de homepage (SvelteKit)
packages/
  shared/               config-factory, huisstijl, gedeelde componenten,
                        de registry en de meeste repo-brede tests
  python-runner/        Python in de browser (Pyodide)
  editor/               Monaco-editors: inline in een les en als volledige IDE
  checker/              de nakijker die een ingeleverd project naast de
                        lesstof legt
scripts/                controles en hulpscripts (tekst, codeblokken, links)
org-handbook/           schrijfgids, didactisch kader en schrijfskills
.github/workflows/      CI (build.yml)
```

## Aan de slag

Je hebt nodig:

- Node 22 (zie `.nvmrc`);
- pnpm 10, via corepack (`corepack enable`), dan krijg je vanzelf de versie uit
  `package.json`;
- alleen voor de controle van codevoorbeelden: Python 3.12 en 3.13.

```sh
corepack enable
pnpm install
```

Eén cursus lokaal draaien, met herladen bij elke wijziging:

```sh
pnpm --filter @coderius/python-docs start
```

De site staat dan op `http://localhost:3000/python/`: het pad is hetzelfde als
online. De pakketnamen staan in de `package.json` van elke site (meestal
`@coderius/<cursus>-docs`). De homepage start je met
`pnpm --filter @coderius/home dev`.

Alle sites tegelijk, elk op een eigen poort vanaf 3001:

```sh
pnpm sites:start        # dev-servers
pnpm preview-all        # eerst bouwen, dan de builds serveren
```

## Controles

| Commando | Wat het doet |
|:---|:---|
| `pnpm test` | vitest over de hele repo: componenten, registry, links in lestekst, en per cursus de vorm van de lessen |
| `pnpm typecheck` | TypeScript over alle sites en packages |
| `pnpm lint` | Biome (formatteren met `pnpm format`) |
| `pnpm tekst` | spelling (`pnpm spel`, cspell met nl_NL) en schrijfstijl (`pnpm stijl`) van alle lestekst |
| `pnpm build` | alle sites bouwen |
| `pnpm cross-links` | na `pnpm build`: elke link in de gebouwde HTML naar een bestaande pagina en een bestaand anker |

De codevoorbeelden in de lessen worden in CI echt uitgevoerd of gecompileerd.
Voor python en algoritmes doet `scripts/draai-python-blokken.py` dat, voor play
`scripts/draai-play-blokken.py`; de docstring bovenin legt de markers uit
waarmee je een blok bewust overslaat. Voor algoritmes en play geeft `--pins` de
`pip install`-regel met de versies die ook in de browser draaien.

CI doet alleen wat een wijziging raakt: de job `plan` bepaalt welke sites en
controles nodig zijn. De verplichte check heet `build`. De job `tekst` telt
daar bewust niet in mee: een spel- of stijlfout houdt een merge niet tegen,
maar los hem wel op. Hoe CI precies is opgebouwd staat in `CLAUDE.md`.

## Lessen schrijven

Lees vóór je een les schrijft of aanpast:

- [`org-handbook/WRITING_STYLE_GUIDE.md`](org-handbook/WRITING_STYLE_GUIDE.md):
  de vorm, van frontmatter en nummering tot opdrachten met tip en oplossing;
- [`org-handbook/CLAUDE.md`](org-handbook/CLAUDE.md): het didactisch kader
  (PRIMM, scaffolding, cognitieve belasting);
- [`org-handbook/WRITING_SKILLS.md`](org-handbook/WRITING_SKILLS.md): hoe je
  schrijft zodat het klinkt als een docent naast de leerling;
- de `CLAUDE.md` van de cursus zelf.

Twee afspraken die je overal tegenkomt. Een link naar een pagina schrijf je als
`[tekst](site:<cursus>/<pad>#anker)`, ook binnen je eigen cursus; de build
maakt er een echte link van. En voorkennis uit een andere cursus noem je met
`<Voorkennis>`, niet met een eigen info-blok.

Docenten kunnen lessen ook bewerken in docs-management, een bewerkomgeving
buiten deze repo.

## Bijdragen

1. Maak een branch vanaf `main` en open een pull request.
2. Elke branch krijgt per site een preview op
   `https://<branch-met-streepjes>--<site-id>.preview.coderius.nl/`: de `/` in
   de branchnaam wordt een `-`. Zet de previews van de sites die je aanpast in
   de beschrijving van je pull request.
3. Een bugfix gaat samen met een test die de fout vastpint, in dezelfde
   commit. Kan dat niet in node (puur browsergedrag), beschrijf dan in de
   commit hoe je het met de hand hebt gecontroleerd.

## Licentie

Het materiaal en de code van Coderius in deze repo vallen onder
[Creative Commons Naamsvermelding-NietCommercieel 4.0 Internationaal (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/deed.nl):
je mag ze gebruiken, delen en aanpassen, niet commercieel en met
naamsvermelding. De volledige tekst staat in [`LICENSE`](LICENSE); de footer
van elke site noemt dezelfde licentie.

Twee uitzonderingen:

- De tracks `docs/minimax/` en `docs/cfg/` van algoritmes zijn bewerkingen van
  CS50 AI van Harvard en vallen daarom onder CC BY-NC-SA 4.0. Zie
  [`sites/informatica/algorithms/LICENSE.md`](sites/informatica/algorithms/LICENSE.md)
  voor de bronvermelding.
- Meegeleverde software houdt zijn eigen licentie: Monaco
  (`packages/editor/static/monaco`), Pyodide (`static/pyodide` van een site),
  htmx (`sites/informatica/fullstack/static/htmx`) en de wheels van play en
  pymunk in `sites/informatica/play/static/whl` (beide MIT).
