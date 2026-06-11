# Schrijfgids voor *-docs (gebaseerd op play-docs)

Dit document beschrijft de schrijfstijl die binnen `play-docs` consequent wordt gehanteerd en die alle overige `*-docs` projecten (`coderius-docs`, `ctf-docs`, `DVWA-docs`, `editor-docs`, `fullstack-docs`, `Godot-docs`, `python-docs`, `robotica-docs`, `web-docs`) moeten volgen.

> **Doel:** één herkenbare, leerlingvriendelijke stem over alle Coderius-College documentatie heen, gebaseerd op het didactische **PRIMM**-model (Predict, Run, Investigate, Modify, Make).

---

## 1. Doelgroep en toon

- **Doelgroep:** middelbare scholieren die net beginnen met programmeren / een nieuw onderwerp.
- **Taal:** Nederlands. Engelse termen alleen waar het technisch nodig is (functienamen, keywords, foutmeldingen).
- **Stem:** vriendelijk, direct, aanmoedigend. Spreek de lezer aan met **"je"** en **"jouw"** (nooit "u").
- **Energie:** warm en uitnodigend ("Het is tijd voor je eerste programma!", "Wat leuk dat je…").
- **Lengte:** kort en concreet. Eén concept per paragraaf. Geen lange inleidingen, geen samenvatting aan het einde van een hoofdstuk.
- **Geen jargon zonder uitleg.** Introduceer een term, leg uit, gebruik daarna consequent.
- **Geen emoji's** in lesmateriaal (behalve op cheatsheet als markering voor "nieuw in versie X" zoals ⭐).

## 2. Bestandsstructuur en frontmatter

Elke pagina begint met YAML-frontmatter:

```yaml
---
sidebar_position: <getal>
hide_table_of_contents: true
---
```

- `sidebar_position` bepaalt de volgorde in de sidebar.
- `hide_table_of_contents: true` is de standaard voor lespagina's (de structuur is al duidelijk via H2's en opdrachten).
- Cheatsheets en losse referentiepagina's mogen `displayed_sidebar: null` en `hide_pagination: true` gebruiken.
- Gebruik `sidebar_label` alleen als de paginatitel te lang is voor de sidebar.

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
- Markeer nieuw gedrag per versie met `⭐ nieuw in <versie>` in de summary.
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
- **Vet** voor benadrukking van termen en methodenamen in lopende tekst: **`distance_to()`**, **dynamic**, **kinematic**.
- **Cursief** alleen voor woordklemtoon (`*easy*`, `*medium*`).
- **Lijsten:**
  - Gebruik bullet points (`-`) voor opsommingen zonder volgorde.
  - Gebruik genummerde lijsten (`1.`, `2.`, …) voor stappen of vereisten.
- **Tabellen** voor attribuut-vergelijkingen of fysica-types. Gecenterde headers (`|:---:|`).
- **Geen ALL CAPS**, geen uitroeptekens stapelen.

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

## 12. Interne links

- Gebruik altijd relatieve links: `[7.1 Gegevens opslaan](/docs/database/basis)` of `[Thonny](Thonny.md)`.
- **Controleer dat de links bestaan** (zie ook `play-docs/CLAUDE.md`).
- Cross-link gul: aan het begin van een opdracht naar de behandelde secties, en aan het einde van een foutmelding naar de uitleg.

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

- Aparte sectie / map: `voor-de-docent/`.
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
- [ ] Geen "u", geen emoji's in lopende tekst, geen onnodige uitroeptekens.
- [ ] Voor elk gebruikt concept dat elders is uitgelegd: een `:::info`-verwijzing.

---

*Bron: deze gids destilleert de stijl van `play-docs/` (zie `play-docs/CLAUDE.md` voor de projectspecifieke conventies).*
