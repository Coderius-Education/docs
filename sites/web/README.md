# Webontwikkeling Leren — HTML, CSS & JavaScript

Een interactief curriculum voor beginnende web-developers. Geen passieve documentatie, maar lessen waarin studenten via de **PRIMM-methode** (Predict, Run, Investigate, Modify, Make) zelf leren door te doen.

## Curriculum

- **12 lessen HTML & CSS** — van basisstructuur tot Flexbox, pseudo-klassen, semantische HTML en formulieren
- **9 lessen JavaScript Basics** — van inline `onclick` tot event-listeners, variabelen, operatoren en beslissingen
- **Cheatsheet** — alle behandelde syntax met live voorbeelden
- **Interactieve CodeEditor** in elke les — HTML / CSS / JavaScript tabs met live preview en console

Volledige curriculum-planning en verbeterpunten: zie [`leerlijn.md`](leerlijn.md).

## Didactische principes

Beschreven in [`CLAUDE.md`](CLAUDE.md). Kort samengevat:

1. **PRIMM-methode** — elke les leidt de student door Predict → Run → Investigate → Modify → Make
2. **Fout-gestuurd leren** — elke les heeft een "Er gaat iets mis" sectie met veelvoorkomende fouten
3. **Cognitive load beperken** — maximaal 1–2 nieuwe concepten per les, progressive disclosure via `<details>`-blokken
4. **Scaffolding** — opdrachten met zowel verborgen tips als verborgen antwoorden

## Projectstructuur

```
docs/
  html-css/          # 12 HTML & CSS lessen (genummerd 01–12)
  js-basics/         # 9 JavaScript lessen (genummerd 00–08)
src/
  pages/
    index.tsx        # Homepage met start-knop en cursus-kaartjes
    cheatsheet.mdx   # Snelle-naslag pagina
    jouw-website.mdx # Eindproject-pagina
  components/
    CodeEditor/      # Interactieve editor met live preview
    HomepageFeatures/# Cursus-kaartjes op homepage
docusaurus.config.ts # Site-configuratie
sidebars.ts          # Sidebar-structuur (auto-generated per folder)
leerlijn.md          # Curriculum-overzicht en verbeterpunten
```

## Lokaal draaien

```bash
yarn          # dependencies installeren
yarn start    # dev-server op http://localhost:3000
yarn build    # productie-build naar build/
```

## Deployen

Via GitHub Pages:

```bash
GIT_USER=<jouw-github-username> yarn deploy
```

## Bijdragen

Lees `CLAUDE.md` voor de auteurs-checklist (leerdoel, fout, interactie, scaffolding, cheatsheet) voordat je een nieuwe les schrijft of een bestaande aanpast. Nieuwe lessen volgen het patroon `NN-onderwerp.mdx` in `docs/html-css/` of `docs/js-basics/`.

## Gebouwd met

[Docusaurus](https://docusaurus.io/) — modern static-site framework voor documentatie.
