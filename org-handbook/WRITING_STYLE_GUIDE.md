# Schrijfgids voor *-docs (gebaseerd op play-docs)

Dit document beschrijft de schrijfstijl die binnen `play-docs` consequent wordt gehanteerd en die alle overige `*-docs` projecten (`coderius-docs`, `ctf-docs`, `editor-docs`, `fullstack-docs`, `Godot-docs`, `linux-docs`, `python-docs`, `robotica-docs`, `web-docs`) moeten volgen.

> **Doel:** één herkenbare, leerlingvriendelijke stem over alle Coderius-documentatie heen, gebaseerd op het didactische **PRIMM**-model (Predict, Run, Investigate, Modify, Make).

---

## 1. Doelgroep en toon

- **Doelgroep:** middelbare scholieren die net beginnen met programmeren / een nieuw onderwerp.
- **Taal:** Nederlands. Engelse termen alleen waar het technisch nodig is (functienamen, keywords, foutmeldingen).
- **Stem:** vriendelijk, direct, aanmoedigend. Spreek de lezer aan met **"je"** en **"jouw"** (nooit "u").
- **Energie:** warm en uitnodigend, maar zónder uitroeptekens of superlatieven. Schrijf "Tijd voor je eerste programma." en "Leuk dat je er bent.", niet "Het is tijd voor je eerste programma!".
- **Lengte:** kort en concreet. Eén concept per paragraaf. Geen lange inleidingen, geen samenvatting aan het einde van een hoofdstuk.
- **Geen jargon zonder uitleg.** Introduceer een term, leg uit, gebruik daarna consequent.
- **Geen emoji's, nergens:** niet in lopende tekst, niet in koppen, niet in opsommingen, niet in admonitions, niet in code-voorbeelden — en ook niet in UI (homepage-kaarten, navbar, footer). Geen uitzonderingen, ook niet als versiemarker of cursus-icoon. Functionele symbolen als `✓`, `⚠` en pijlen (`→`) zijn geen emoji en mogen blijven.

## 2. Bestandsstructuur en frontmatter

Elke pagina begint met YAML-frontmatter:

```yaml
---
sidebar_position: <getal>
---
```

- `sidebar_position` bepaalt de volgorde in de sidebar.
- **Een les is verdeeld in tabbladen.** Dat is sinds november 2026 de standaard; web, python, robotica, fullstack, linux, ctf, de editor-cursus en algoritmes zijn omgezet. Elke `##`-sectie is een tabblad bovenaan de pagina, elke `###` in een lange sectie een stap binnen dat tabblad, en de inhoudsopgave rechts vervalt: een leerling hoeft in een les niet te scrollen. Structureer een les dus met `##` en `###`, en schrijf elk scherm volgens "Tabbladen: elk scherm staat op zichzelf" hieronder. Een cursus zet het aan met `lesTabs: true` in `createConfig` (zie de root-`CLAUDE.md`, Les-tabbladen, voor de stappen).
- **Een cursus die nog niet is omgezet**, houdt de rechter inhoudsopgave (TOC) met **alleen H2-koppen** (centraal ingesteld in `packages/shared/config`). Voeg daar géén `hide_table_of_contents` toe; structureer je pagina met `##`-secties zodat ze in de TOC verschijnen. Heeft een oefenveld meer breedte nodig, kies dan een gestapelde veldvorm in plaats van de TOC te verbergen.
- Cheatsheets en losse referentiepagina's mogen `displayed_sidebar: null` en `hide_pagination: true` gebruiken.
- Gebruik `sidebar_label` alleen als de paginatitel te lang is voor de sidebar.

### Tabbladen: elk scherm staat op zichzelf

In een cursus met tabbladen is een tabblad of een stap alles wat de leerling op dat moment ziet. Daar volgt dit uit:

- **Een sectie van één regel is geen scherm.** Een challenge van ctf had vier secties van een of twee regels en werd vijf bijna lege tabbladen; hij heeft er nu twee, De challenge en Hints. Zet bij elkaar wat de leerling samen nodig heeft, en gebruik een `##` alleen voor wat een scherm vult.
- **In een cursus van korte stappen heeft een pagina die op één scherm past geen tabbladen** (de editor-cursus, `lesTabs: { eenScherm: true }`). Schrijf een stap dan zo dat hij op 1280×720 past, met `## Wat je nu ziet` onder de tekst. Een korte `## Wat je nu ziet`, `## Aan de slag` of `## Volgende tutorial` op een langere pagina zet de build onder het scherm ervoor.
- **Een oefenveld dat bij de hele les hoort, staat naast de les** (de oefenterminal van Linux): bij elk tabblad, op een breed scherm naast de tekst en op een telefoon eronder. Noem het bij zijn naam ("de oefenterminal"), niet "de terminal hieronder", en houd de schermen kort: de tekst staat daar in een kolom van de halve breedte.
- **Een scherm past op 1280×720**, zonder scrollen. Meet het na een build met `node scripts/meet-les-tabs.mjs <site>`. Past het niet, splits dan eerst (een `###` erbij maakt een stap en kost geen inhoud) en kort daarna pas in.
- **Wijs alleen naar wat in hetzelfde scherm staat.** "Hieronder", "hierboven" en "de startcode" kloppen op een lange pagina en wijzen in tabbladen naar een ander scherm.
- **Predict gaat over de startcode van het oefenveld**, en toont die code. De leerling voorspelt, en draait daarna in Probeer en onderzoek dezelfde code om te zien of het klopte.
- **De uitleg verklapt het antwoord van Predict niet.** Staat het er letterlijk, haal de zin dan weg of vraag iets waarvoor de leerling moet redeneren.
- **Het leerdoel** (`## Wat ga je leren?`, hooguit twee alinea's) krijgt geen eigen tabblad: het staat bovenaan het tabblad erna.
- **De uitleg waar een les mee begint, wordt één tabblad met stappen.** Noem een sectie naar zijn onderwerp ("Een item ophalen"), niet "Stap 1": de stappen hebben al een nummer.
- **Een opdracht bouwt niet voort op het veld van de vorige.** Elk veld begint met zijn eigen startcode.
- **Noem het oefenveld en zijn onderdelen zoals ze in het veld heten** (bij web: oefenveld, voorbeeld, console), en schrijf geen "rechts" of "rechtsonder": op een telefoon staat het voorbeeld onder de code.
- **De rij tabbladen staat op één regel.** Dat lukt met hooguit zeven of acht tabbladen.
- **Wat op een ander scherm staat, noem je bij zijn naam**: "uit de uitleg", "in de volgende stap", "bij Er gaat iets mis".
- **In een cursus zonder tabblad Predict** (python) staat de voorspelvraag in de uitleg, onder `### Voorspel`: de code met de vraag ernaast. Zet de kop boven de zin die de code inleidt.
- **De verwachte uitvoer van een opdracht** staat vlak voor het oefenveld, onder een eigen regel "Verwachte uitvoer:" (of "Verwachte uitvoer (bij `cijfer = 4.0`):"). Het veld toont hem dan naast de uitvoer van de leerling. Een doelplaatje vlak voor het veld komt daar ook.
- **Een lange opdracht heeft twee stappen**: `### De opdracht` met de beschrijving, en `### Aan de slag` met het veld, de tip en de oplossing.
- **Wat de leerling moet kopiëren, staat bij het veld**, na de zin over het plakken van zijn eigen programma, in een uitklapblok. Hij heeft één klembord.
- **Onder een voorspelvraag staat geen code die het antwoord laat zien.** Wat erna komt, staat in de `<Uitleg>` van de vraag of in een volgende stap.
- **Er gaat iets mis komt na de opdrachten.** De build zet het tabblad daar ook neer als de bron het ervoor heeft.
- **Een plaatje staat vóór de tekst die het uitlegt** (het aansluitschema, dan de pinnen): de build zet ze naast elkaar. Drie of meer plaatjes achter elkaar worden een reeks met Vorige en Volgende.
- **Onder code staat wat hem toelicht als lijst of tabel**, direct eronder of na één alinea: de build zet het ernaast. Voor uitleg per regel gebruik je `<CodeUitleg>`.
- **Een les begint met een kop naar zijn inhoud.** Wat vóór de eerste `###` van een sectie staat, wordt een stap die De basis heet; in Linux waren dat er twintig. Begin dus met een `##` of `###` die zegt waar het over gaat ("Lezen met cat").
- **Alternatieven per systeem zijn geen tabbladen.** Windows, macOS en Linux als `##` liet de knop Volgende een leerling langs systemen leiden die niet de zijne zijn. Zet de hoofdroute zichtbaar en de andere systemen elk in een `<details>`, op het scherm met de stappen en niet onder Wat je nu ziet.
- **Een stap heeft geen nummer in zijn kop.** Schrijf `### Kies de juiste interpreter`, niet `### Stap 1: kies de juiste interpreter`: de knop van de stap nummert al, en een stap ervoor schuift de telling op. Verwijs naar een stap met zijn naam.
- **Een stap heet naar zijn inhoud**: `### Stap 2: Kies een pin` krijgt in de rij het label "Kies een pin". Geef een `###` dus een titel na de dubbele punt.
- **Een opdracht is een eigen sectie** (`## Opdracht: <naam>`), niet een uitklapblok onder de code: weggeklapt ziet een leerling hem niet. Tip en oplossing blijven uitklapblokken.
- **Een vraag staat open; alleen het antwoord is een uitklapblok.** Schrijf `**Controlevraag:** …` met `<details><summary>Antwoord</summary>` eronder, of gebruik `<Voorspel>`. In de uitleg van een voorspelvraag staat niets dat de leerling moet doen: die verschijnt pas bij het goede antwoord.
- **Een regel code naast zijn toelichting is hooguit 66 tekens.** Langer, en de build zet de code weer over de volle breedte.
- **Een regel code staat heel op één regel.** Past hij niet, dan maakt de les de letters van dat blok kleiner (tot 80%); hij breekt niet af en valt niet buiten zijn vak. Wat dan nog niet past, schrijf je korter: in een `<CodeUitleg>` hooguit 84 tekens, verder hooguit 122. Zet bij een lange functiekop elke parameter op een eigen regel, en een lange dictionary over meer regels. Alleen een foutmelding of uitvoer van de terminal mag afbreken.
- **Geen twee koppen met dezelfde naam op een pagina**, ook niet in een deel dat de pagina importeert: een kop is ook een adres. Geef een kop in een deel een vast id (`### Controlevraag \{#i2c-controlevraag}`).
- **Een pagina waar je met Ctrl+F zoekt** (een overzicht van foutmeldingen) krijgt `les_tabs: false`: zoeken vindt geen tekst in een tabblad dat dicht staat.
- **Een controlelijst of een hand-out** krijgt ook `les_tabs: false`: die loop je in één keer af, of je print hem.
- **Houd een kop kort**: een tabblad of stap heet naar zijn kop. De rij tabbladen moet op één regel passen, en in een volle rij stappen wordt een lange naam ingekort tot de stap open staat. Meer dan acht stappen in een tabblad staan op twee regels, en dat kost elk scherm veertig pixels. Linken andere lessen naar de kop, geef hem dan een vast id voordat je hem inkort.
- **Een scherm begint niet met een zin die op het vorige doorgaat.** "Daarom maakt de Dockerfile …", "Daaronder legt de tekst uit …" en "Klik op de regel." lezen op de lange pagina goed, en zijn in tabbladen een scherm te laat. Noem waar het over gaat: "Onder `Hello from Docker!` legt de tekst uit …".
- **De reden bij een fout antwoord is kort** (`uitleg="…"` van een `<Keuze>`, hooguit een regel of twee, zo'n 75 tekens): hij staat in de rij van dat antwoord, en naast code is die rij smal.
- **Een controlevraag vraagt niet terug wat er net stond.** Hij is een eigen scherm, direct na de uitleg: vraag naar een nieuw geval waarvoor de leerling de uitleg moet toepassen. Ook de `uitleg="…"` van een keuze wijst niet naar "hierboven".
- **Een adres in een keuze staat tussen backticks**: MDX maakt van een kaal adres een link, en die staat dan in de knop.
- **Wat de leerling na een opdracht moet opruimen** (een endpoint weghalen, de server weer starten), staat in de opdracht, niet in het antwoord: wie het antwoord niet openklapt, leest het niet.
- **Het hele bestand na de les** schrijf je als `<details><summary>Zo ziet je `main.py` er nu uit</summary>`: de build maakt er het laatste tabblad van, met de naam van het bestand. Verwijs ernaar als "het tabblad `main.py`".
- **Een pagina die net zo heet als een tabblad, noem je een pagina**: "op de pagina [Er gaat iets mis](…)". Zonder link is "bij Er gaat iets mis" het tabblad van de les.
- **Een fout onder Er gaat iets mis toont alleen wat verandert**: de melding (een lange rij uitvoer ingekort met `...`), de oorzaak, de oplossing en hooguit de paar regels code die anders moeten. Wijs daar niet naar "hierboven": de uitleg staat op een ander tabblad.

Voor MDX-pagina's met runnable code, importeer bovenaan:

```mdx
import TryButton from '@site/src/components/CodeRunner/TryButton';
```

(Of het equivalente component van het betreffende docs-project.)

## 3. Hoofdstuk- en sectienummering

- **Hoofdtitel (H1):** `# <hoofdstuknummer>.<sectienummer> <Titel>`, bijvoorbeeld `# 3.1 Acties`.
- **Subtitels (H2):** `## <Beschrijvende kop>` — geen nummering.
- **Opdrachten (H2 of H3):** `## Opdracht <H>.<S>.<letter>: <Titel>`, bijvoorbeeld `## Opdracht 3.4.a: Kloonleger`.
  - Opdrachten binnen sectie 3.4 zijn 3.4.a, 3.4.b, 3.4.c, …
  - Tellen door over de hele sectie, ook als ze onder verschillende H2's vallen.
- **Stappen in tutorials:** `## Stap 1: <Korte beschrijving>`.

## 4. Het PRIMM-stramien

Iedere uitleg volgt impliciet PRIMM:

1. **Concept introduceren** — één korte alinea waarom we dit nodig hebben of wat het is.
2. **Voorbeeldcode tonen** — minimaal, compleet, runnable. Inclusief `import`.
3. **Code uitlichten** — herhaal het kernfragment en leg in één alinea uit wat er gebeurt.
4. **Opdracht(en) geven** — leerling past het zelf toe (zie §6).

Voorbeeld:

```markdown
## Een vorm kopiëren met clone

Met `clone()` kun je een exacte kopie maken van een vorm. De kopie heeft dezelfde kleur, grootte en positie als het origineel.

```python
import play

cirkel = play.new_circle(color='red', x=-100, radius=30)

kopie = cirkel.clone()
kopie.x = 100
```

Je hebt nu twee rode cirkels: het origineel links en de kopie rechts.
```

## 5. Code-conventies in voorbeelden

- **Altijd compleet en runnable** — beginnen met `import` (`import play`, `import pygame`, …).
- **Voorbeelden zo kort mogelijk**, maar nooit pseudo-code.
- **Variabelnamen in het Nederlands** waar dat natuurlijk leest: `cirkel`, `blok`, `tekst`, `kopie`, `teller`, `score`.
- **Methodenamen, keywords, parameters in het Engels** (zoals de bibliotheek het biedt): `clone()`, `x_speed`, `obeys_gravity`.
- **Strings die de gebruiker ziet in het Nederlands**: `play.new_text(words="Score: " + str(score))`.
- **MDX-pagina's** voorzien runnable code van een `<TryButton code={`…`} />` direct ná het Markdown-codeblok (zelfde code, niet een variant).
- **Geen overbodige comments in code.** Liever een korte zin in lopend Nederlands ónder het blok dan inline `# uitleg`.
- **Code regel voor regel uitleggen** doe je met `<CodeUitleg>` (globaal beschikbaar in elke site die het registreert, geen import nodig). Het codeblok blijft een gewoon ```python-blok mét `showLineNumbers` als kind, zodat het zijn highlighting en de compileercheck in CI houdt; de uitleg staat eronder als `<Regel n={3}>`-blokken, of `<Regel n={5} tot={7}>` voor een groepje. Wie een uitleg aanwijst ziet de bijbehorende regel oplichten. Dit vervangt de rij losse fragment-codeblokken die elk één regel herhalen. `packages/shared/codeuitleg.test.ts` controleert monorepo-breed dat elk nummer bestaat, geen lege regel aanwijst en dat `showLineNumbers` erop staat.

## 6. Opdrachten

Format per opdracht:

````markdown
## Opdracht <H>.<S>.<letter>: <Korte titel>

<1–2 zinnen wat de leerling moet maken, eventueel met genummerde lijst van eisen.>

<details>
<summary>Klik hier voor een tip!</summary>

<Concrete hint die richting geeft maar de oplossing niet weggeeft.>

</details>

<details>
<summary>Klik hier voor de oplossing!</summary>

```python
<volledige werkende oplossing>
```

<Optioneel: 1 zin uitleg waarom het werkt.>

</details>
````

Regels:

- **Altijd één oplossing** in `<details>` zodat leerlingen kunnen controleren.
- **Tip is optioneel** maar gebruikelijk; sla 'm over bij heel triviale opdrachten.
- **In MDX** wordt onder het oplossingscodeblok ook een `<TryButton>` met identieke code geplaatst.
- Voor opdrachten die kennis uit andere secties nodig hebben, zet een `:::info`-blok bovenaan met een verwijzing:

  ```markdown
  :::info
  In deze opdracht gebruik je `@play.when_key_pressed` (zie [4.1 Toetsenbord](/docs/gebeurtenissen/toetsenbord)).
  :::
  ```

## 7. Cheatsheet-pagina

Elk docs-project heeft één centrale `cheatsheet.md`. Format per item:

````markdown
<details>
  <summary>Korte vraag of beschrijving (functie_naam)</summary>

<1–3 zinnen uitleg.>

```python
import play

<minimaal voorbeeld>
```

<Eventueel: lijst van attributen met bullet points, of een tabel.>

</details>
````

Conventies:

- Groepeer items onder H2's per thema (`## Vormen`, `## Fysica`, `## Acties`, `## Gebeurtenissen`, …).
- Markeer nieuw gedrag per versie met `(nieuw in <versie>)` als tekst in de summary.
- Begin nieuwe-versie-overzichten met `<details><summary>Nieuw of verbeterd in <project> versie X.Y</summary>`.

## 8. "Er gaat iets mis" / veelgemaakte fouten

Voor veelvoorkomende foutmeldingen geldt een vast format:

```markdown
## <Foutmelding-naam>

```
<exacte foutmelding>
```

**Oorzaak:** <één zin>

**Oplossing:** <concrete stap, met code-voorbeeld waar nuttig>

```python
# FOUT
<voorbeeld>

# GOED
<voorbeeld>
```

Meer uitleg: [<sectienaam>](<relatieve link>)
```

## 9. Opmaak en typografie

- **`code-fences`** voor zowel inline (`` `clone()` ``) als blok (` ```python `).
- **Vet spaarzaam.** Alleen de eerste keer dat je een kernterm of methodenaam noemt: **`distance_to()`**, **dynamic**, **kinematic**. Geen hele zinnen vet — als alles vet is, valt niets meer op.
- **Cursief** alleen voor woordklemtoon (`*easy*`, `*medium*`).
- **Em-dash (—) spaarzaam.** Meestal is een punt of komma beter. Rijg niet elke zin aan elkaar met een gedachtestreepje.
- **Lijsten:**
  - Gebruik bullet points (`-`) voor opsommingen zonder volgorde.
  - Gebruik genummerde lijsten (`1.`, `2.`, …) voor stappen of vereisten.
  - Niet elke alinea hoeft een lijst te worden; lopende tekst mag.
- **Tabellen** voor attribuut-vergelijkingen of fysica-types. Gecenterde headers (`|:---:|`).
- **Geen ALL CAPS** en liefst geen uitroeptekens in lestekst (zeker niet gestapeld).

## 10. Admonitions

Docusaurus admonitions worden gebruikt voor signalen aan de lezer:

- `:::info` — voorkennis nodig / verwijzing naar andere sectie.
- `:::tip` — handige extra die de oefening makkelijker maakt.
- `:::caution` of "**Let op:**" — gedrag dat verrast of fout kan gaan.
- `:::note` — terzijde, achtergrondinformatie.

In de lopende tekst is `**Let op:** …` of `**Tip:** …` ook gangbaar en korter.

## 11. Afbeeldingen

- Plaats afbeeldingen in dezelfde map als de pagina, of in `static/img/`.
- Verwijs met `![alt](path)` of `![alt](@site/static/img/bestand.png)`.
- Alt-tekst is verplicht en beschrijvend (niet "afbeelding").
- Screenshots tonen wat de leerling moet zien, niet de hele desktop.

## 12. Links naar pagina's

Elke link naar een pagina schrijf je als **site:-link**, ook binnen je eigen
cursus:

```mdx
Zie [7.1 Gegevens opslaan](site:fullstack/docs/database/basis).
Herhaal eerst [de for-lus](site:python/docs/herhalen/for-lus#de-for-lus).
```

- `site:<cursus>` is het id uit de registry `packages/shared/sites.js`
  (`python`, `algorithms`, `editor`, …), niet het pad in de URL
  (`algoritmes`).
- Daarna volgt het **pad op die cursus**, zonder de cursusnaam ervoor: wat in de
  adresbalk na `…/python` staat. De meeste cursussen serveren onder `/docs/…`,
  de editor-cursus op de root (`site:editor/git/vscode`) en didactiek onder
  `/bronnen/…`.
- `#anker` wijst naar een kop op die pagina. Linken andere pagina's naar een
  kop, geef die kop dan een vast ID (`## Lussen \{#lussen}`, in docs-management
  "Kop met vast ID"); dan breekt de link niet als de koptekst verandert.
- Bij het bouwen maakt de plugin `packages/shared/plugins/site-links.js` er een
  echte link van: binnen de cursus een gewone link, naar een andere cursus een
  link die in een nieuw tabblad opent.
- In docs-management selecteer je de tekst en kies je **Link naar pagina**; daar
  zoek je over alle cursussen en kies je eventueel een kop.
- Wel gewoon laten: ankers op dezelfde pagina (`[zie hieronder](#stap-2)`),
  afbeeldingen en downloads (`![alt](./img/a.png)`, `[pdf](/files/a.pdf)`), en
  externe sites.
- Hardcode **nooit** een `https://*.coderius.nl`-URL; de registry is de enige
  bron van waarheid.
- Cross-link gul: aan het begin van een opdracht naar de behandelde secties, en
  aan het einde van een foutmelding naar de uitleg.

### Voorkennis uit een andere cursus

Gebruik de globale `<Voorkennis>`-component (inklapbaar, standaard dicht),
zonder import beschikbaar in elke `.md`/`.mdx`:

```mdx
<Voorkennis items={[{site: 'python', to: '/docs/basis/jij-als-variabele', label: 'Variabelen in Python'}]} />
```

Laat `site` weg voor voorkennis bínnen dezelfde cursus. Dit vervangt het oude
handmatige `:::info Wat moet je al weten`-blok.

### Wie controleert wat

- `packages/shared/links-in-lestekst.test.ts` (bij `pnpm test`) bewaakt de
  vorm: geen `<SiteLink>` in lestekst, geen pagina-link als pad of `.md`-bestand,
  elke site:-link geldig en naar een bekende cursus, geen hardcoded cursus-URL.
- Docusaurus (`onBrokenLinks: 'throw'`) controleert bij het bouwen links binnen
  de eigen cursus.
- De CI-job `cross-links` legt na de builds elke link in de gebouwde HTML tegen
  de build van de doelsite: bestaat de pagina, en staat het anker erop. Dat is
  de waarheid.
- `<SiteLink>` bestaat nog, maar alleen voor TSX-componenten.
- **Footer "Andere cursussen"** en de **navbar-dropdown "Cursussen"** worden
  automatisch uit de registry gegenereerd door `createConfig`; niets per site
  toevoegen. Het volledige overzicht staat op `/cursussen`.
- Nieuwe cursus of gewijzigde URL? Pas alleen `packages/shared/sites.js` aan.

## 13. Verbeteringen, versies en changelog

- Per docs-project één plek voor versie-overzichten (in `cheatsheet.md` of een aparte `verbeteringen.md`).
- Schrijf changelog-items in dezelfde toon als de rest: korte zinnen, voorbeeld waar nuttig, geen marketing.
- Format: `Bij **<onderwerp>**: <wat is er veranderd>.`

## 14. Projecten / capstone-pagina's

Voor pagina's onder `jouw_project/` (of vergelijkbaar):

- Korte intro waarom dit project leuk/leerzaam is.
- Verwijs naar de cheatsheet voor voorbeelden i.p.v. ze volledig te herhalen.
- Geef per stap een korte tekst + een `<details>`-tip, geen volledige oplossing.
- Sluit af met **"Mogelijke uitbreidingen"** als bullet list.

## 15. Voor de docent

- **Elke site heeft een Docentenhandleiding** op `/docenten` (`src/pages/docenten.mdx`). De "Docenten"-link in de navbar wordt centraal toegevoegd door `createConfig` — niets per site instellen.
- **De handleiding schrijft niet voor hoe iemand lesgeeft.** Hij laat zien waar de opbouw van de lessen op steunt, en is verder kort: een halve pagina. Lesadvies ("bespreek Predict plenair"), een beschrijving van elke knop en een tabel met alle lessen horen er niet in.
- **Wat nodig is om het materiaal te gebruiken, staat in het materiaal zelf.** Het oefenveld legt zijn knoppen en zijn opslag uit, een nakijker zijn eigen stappen, de les zijn opbouw. Mis je zoiets, zet het dan daar, niet in de handleiding.
- Standaardstructuur: twee of drie zinnen over wat de cursus is; `## Waar de lessen op steunen` met `<Werkvormen />` (per onderdeel van een les de tip van vakdidactiek en de paper); `## Wat je vooraf wilt weten` (hooguit drie regels: installatie, waar werk blijft, de volgorde van de lessen); `## Beoordelen` (links naar leerdoelen, eindopdracht en nakijker); `## Feedback`. Zie [web/src/pages/docenten.mdx](../sites/informatica/web/src/pages/docenten.mdx) als referentie.
- Een bron noem je alleen als vakdidactiek hem uitlegt: de tabel haalt de tips en de papers uit `packages/shared/werkvormen/werkvormen.json`.
- Naslag die bij het omzetten uit de handleiding verdwijnt en geen lesadvies is (bij fullstack: één server voor de klas), verhuist naar `voor-de-docent/`.
- Een cursus die nog geen tabbladen heeft, houdt zijn bestaande handleiding tot hij wordt omgezet: `<Werkvormen />` komt met `lesTabs`.
- Naslag voor de docent die niet over lesgeven gaat (een installatie, een beoordelingsmodel) mag in een aparte `voor-de-docent/`-docsmap; laat `/docenten` daar dan naartoe linken (zoals play en embedded).
- Andere toon: collegiaal, korter, geen "je leert" — wel "je leerlingen".
- Voor docent-pagina's mag `hide_table_of_contents` weggelaten worden.

## 16. Checklist vóór publicatie

- [ ] Frontmatter aanwezig en `sidebar_position` klopt.
- [ ] Titel begint met sectienummer (lesmateriaal) of is een duidelijke noun phrase (referentie).
- [ ] Code-voorbeelden zijn compleet en draaien zonder aanpassing.
- [ ] Bij opdrachten staan tip én oplossing in `<details>`-blokken.
- [ ] Bij MDX is `<TryButton>` toegevoegd voor elk runnable codeblok.
- [ ] Interne links bestaan en wijzen naar de juiste pagina.
- [ ] Methodenamen consequent in `**vet**` of `` `code` `` (kies één stijl per project en houd 'm vol).
- [ ] Geen "u", geen uitroeptekens.
- [ ] Geen emoji — nergens (lestekst, koppen, opsommingen, code, UI). Wel toegestaan: `✓`, `⚠`, pijlen.
- [ ] Geen holle superlatieven of formulaire openers ("In dit hoofdstuk…", "Laten we…").
- [ ] Niet alles vet; varieer de openingswoorden van zinnen en bullets.
- [ ] Voor elk gebruikt concept dat elders is uitgelegd: een `:::info`-verwijzing.
- [ ] In een cursus met tabbladen: elk scherm past op 1280×720 en wijst alleen naar wat erop staat (§2).
- [ ] `pnpm tekst` gedraaid en de meldingen over jouw pagina opgelost of gemarkeerd (zie §17).

---

## 17. De geautomatiseerde controle

Een deel van deze gids controleert CI zelf, in de job `tekst`. Lokaal draai je
hem met `pnpm tekst`, of los met `pnpm spel` en `pnpm stijl`.

**`pnpm spel`** is cspell met de nl_NL-dictionary. Code, frontmatter, JSX en
linkdoelen slaat hij over. Kent hij een woord niet dat wél goed is (een
merknaam, een vakterm, een samenstelling), zet het dan in `cspell-woorden.txt`
in de juiste groep.

**`pnpm stijl`** draait de regels uit `packages/shared/stijl.js` over elke
pagina onder `sites/*/*/docs/` en `sites/*/*/src/pages/`. Alles wat geen proza is
gaat er eerst uit, dus een uitroepteken in `print("Klaar!")` telt niet mee.
Twee niveaus:

- **fout** — `emoji`, `u-vorm`, `uitroepteken`, `all-caps`, `alt-tekst`.
- **waarschuwing** — `vulwoord`, `superlatief`, `formulaire-opener`,
  `lege-overgang`, `engels-opvulling`, `passief`, `em-dash`, `vet-overdaad`,
  `lange-zin`, `herhaalde-opening`, `samenvatting` en `leerling-vorm`.

`leerling-vorm` slaat docentmateriaal over (`voor-de-docent/` en `docenten.mdx`):
daar schrijft §15 juist "je leerlingen" voor.

Structuur controleert `pnpm stijl` niet. Of de frontmatter klopt, of de
opdrachtnummers doorlopen en of elke opdracht een oplossing heeft, hangt aan
de nummering van één cursus; dat staat daarom per site in een test —
`sites/informatica/play/src/docs-tests/opdrachten.test.ts` is het voorbeeld, en die draait
blokkerend mee.

De achterstand uit de migratie is weggewerkt: elke site staat op nul fouten,
en de job draait met `--streng`. Een spel- of stijlfout op een gewijzigde regel
maakt hem dus rood, en de melding staat als annotatie in de diff van je pull
request. De job telt bewust niet mee voor de verplichte check `build`: een
spel- of stijlfout houdt een merge niet tegen. Los hem wel op, of markeer een
terechte uitzondering (zie hieronder).

### Een terechte uitzondering markeren

Soms slaat een regel terecht niet op jouw geval, bijvoorbeeld een uitroepteken
in een geciteerde foutmelding. Markeer dat in de bron met een MDX-commentaar,
in dezelfde vorm als de bestaande `{/* niet-compileren: */}`-marker:

```mdx
{/* stijl-uitzondering: uitroepteken citaat uit de foutmelding van Python */}

Traceback zegt letterlijk: Klaar!
```

De marker geldt voor de eerstvolgende alinea. Voor een hele pagina:

```mdx
{/* stijl-uitzondering-bestand: opdracht-nummering losse referentiepagina */}
```

Meerdere regels tegelijk scheid je met een komma. Zet er altijd een reden bij:
zonder reden is het geen uitzondering maar een snelkoppeling.

---

*Bron: deze gids destilleert de stijl van `play-docs/` (zie `play-docs/CLAUDE.md` voor de projectspecifieke conventies).*
