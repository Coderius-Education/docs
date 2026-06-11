# Coderius Algoritmes

Een interactief leerplatform voor algoritmes, gebouwd op
[Docusaurus](https://docusaurus.io/). Studenten leren algoritmes
stap-voor-stap volgens de **PRIMM-methode** (Predict, Run, Investigate,
Modify, Make) en draaien Python-code direct in de browser via
[Pyodide](https://pyodide.org/) — geen lokale installatie nodig.

## Inhoud

Zes algoritmes, pedagogisch geordend zodat elk volgend algoritme voortbouwt
op patronen uit het vorige:

1. **Lineair zoeken** — accumulator-patroon
2. **Vind het maximum** — accumulator-patroon, één variabele
3. **Max + min in één pass** — twee accumulators tegelijk
4. **Binair zoeken** — halveren met laag/hoog/midden
5. **Selection sort** — vind-minimum + swap
6. **Bubble sort** — paarsgewijze vergelijking + early-exit

Elk algoritme heeft 10–12 pagina's: concept → stellingen →
bouwsteen-pagina's → compleet algoritme → aanpassen → bouw zelf →
veelgemaakte fouten → cheatsheet.

## Vereisten

- Node.js **≥ 20**
- npm (komt mee met Node)

## Installatie

```bash
npm install
```

## Lokaal ontwikkelen

```bash
npm start
```

Opent een dev-server op [http://localhost:3000](http://localhost:3000).
Wijzigingen in `docs/`, `src/` en `docusaurus.config.ts` worden live
doorgeladen.

## Build

```bash
npm run build
```

Genereert statische bestanden in `build/`. Lokaal testen kan met
`npm run serve`.

## Typecheck

```bash
npm run typecheck
```

Draait `tsc` over alle TypeScript en MDX-componenten.

## Projectstructuur

```
docs/                       leerinhoud, één map per algoritme
  <algoritme-slug>/         bv. lineair-zoeken/
    _category_.json         sidebar-label en volgorde
    01-concept.mdx          idee + ASCII-visualisatie (geen code)
    02-stellingen.mdx       juist/onjuist-stellingen
    03-bouwen-*.mdx         bouwstenen (1 concept per pagina)
    ...
    NN-compleet.mdx         alle bouwstenen samen
    NN-aanpassen.mdx        Modify-opdracht
    NN-zelf-bouwen.mdx      Make-opdracht (meestal met matplotlib)
    NN-fouten.mdx           "Er gaat iets mis" — top-3 fouten
    NN-cheatsheet.mdx       snelle referentie
src/
  components/
    AlgorithmGrid/          homepage-kaartjes per algoritme
    PyRunner/               Pyodide-runner (Python in de browser)
  data/algorithms.ts        lijst van algoritmes voor de homepage
  pages/index.tsx           homepage
  theme/MDXComponents.tsx   globaal beschikbaar maken van <PyRunner>
static/                     favicon, logo, statische assets
```

## Conventies voor auteurs

Zie [CLAUDE.md](CLAUDE.md) voor de didactische principes (PRIMM, scaffolding,
foutgestuurd leren, cognitive load) en bestandsnaam-conventies.

Per pagina:

- **Eén leerdoel** (max. 1–2 nieuwe concepten).
- **`<details>`-blokken** voor predict-uitleg, tips en antwoorden — om
  spoilers te voorkomen.
- **`<PyRunner>`** is overal beschikbaar in MDX (zonder import) voor
  runnable Python-snippets met optionele matplotlib-output.

## Deployment

De site deployt automatisch naar GitHub Pages bij elke push naar `main`
via [.github/workflows/deploy-to-github-pages.yml](.github/workflows/deploy-to-github-pages.yml).

Voor handmatige deploy:

```bash
GIT_USER=<github-username> npm run deploy
```

Pas vóór deploy in [docusaurus.config.ts](docusaurus.config.ts) `url`,
`baseUrl`, `organizationName` en `projectName` aan op je eigen
GitHub-omgeving.

## Licentie

Zie [LICENSE.md](LICENSE.md) voor de volledige tekst. Kort samengevat:

- **Standaard**: alle inhoud is
  [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) —
  vrij te delen en bewerken, geen commercieel gebruik, met
  naamsvermelding.
- **Uitzondering**: de track `docs/minimax/` is een afgeleide bewerking
  van [CS50 AI Project 0: Tic-Tac-Toe](https://cs50.harvard.edu/ai/projects/0/tictactoe/)
  van Harvard University en valt daarom onder
  [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
  (share-alike).
