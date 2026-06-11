# Skills voor goed schrijven (Coderius docs)

Deze gids is geen format-gids (dat is `WRITING_STYLE_GUIDE.md`), maar een verzameling **vuistregels voor het schrijven zelf**: stem, ritme, valkuilen, en een korte review-checklist. Gebruik 'm als je een lespagina schrijft of redigeert.

---

## 1. Stem en ritme

- **Korte zinnen voor concepten, langere voor verhaal.** Een definitie verdient een puntige zin; een uitleg-met-voorbeeld mag adem hebben.
- **Eén idee per alinea.** Als je "en daarnaast" of "ook" begint, splits.
- **Spreek de lezer aan met "je".** Nooit "u", nooit "men", nooit "de leerling" (behalve in docentteksten).
- **Energie zonder uitroeptekens.** "Wat leuk dat je hier bent" werkt beter dan "Wat leuk dat je hier bent!".
- **Schrijf eerlijk over moeilijkheid.** "Dit is even puzzelen" is beter dan "Dit is super makkelijk" (waar de leerling 20 minuten op vastloopt).

## 2. Vermijd

- **Vulwoorden:** *eigenlijk, gewoon, eenvoudigweg, simpelweg, even, toch, juist.*
- **Passieve constructies.** "De waarde wordt opgeslagen" → "Python slaat de waarde op".
- **Inleidingen die niets toevoegen.** "In dit hoofdstuk gaan we kijken naar variabelen" → begin meteen met het eerste voorbeeld.
- **Samenvattingen aan het einde.** De leerling heeft het net gelezen; herhaling vertraagt.
- **Disclaimer-stapeling.** "Let op: dit is een voorbeeld. Het is niet de enige manier. In de praktijk gebruik je …" → kies één punt en zeg dat.
- **Engels als opvulling.** Geen "let's" of "we're gonna" — gewoon Nederlands.

## 3. Voorbeelden vóór abstractie

Toon **eerst** een concreet, klein, werkend snippet. **Dan** pas de definitie of theorie.

```markdown
<!-- Niet -->
Een variabele is een naam waaraan je een waarde toekent zodat je …

<!-- Wel -->
```python
naam = "Sam"
print(naam)
```

`naam` is een variabele: een label dat verwijst naar een waarde.
```

Reden: een leerling die de code ziet werken, leest de definitie met betekenis. Andersom is het abstract Latijn.

## 4. Cognitieve scaffolding

Wanneer welk hulpmiddel:

| Situatie | Hulpmiddel |
|---|---|
| Voorkennis uit een andere sectie nodig | `:::info` met link bovenaan |
| Optionele diepgang / "voor wie meer wil" | `<details>` met `## Achtergrond: …` |
| Stappen waar de leerling iets moet doen | genummerde lijst |
| Verschillende manieren om hetzelfde te bereiken | `:::tip` met de alternatieve manier |
| Iets dat fout kán gaan en verwart | `:::caution` of `**Let op:**` |

**Eén concept per pagina.** Als je merkt dat je tweede H2 een nieuw concept introduceert, splits de pagina.

## 5. Veelgemaakte schrijffouten — concreet herschreven

| Verleidelijk | Beter |
|---|---|
| "Het is mogelijk om een lijst te sorteren." | "Je kunt een lijst sorteren met `sort()`." |
| "Er bestaat een functie genaamd `range()` die …" | "**`range()`** maakt een reeks getallen." |
| "Zoals je waarschijnlijk al weet, …" | (weglaten — of als het echt nodig is: `:::info` met link) |
| "Dit is een hele belangrijke regel die je goed moet onthouden!" | (laat de regel zelf het werk doen) |
| "In deze opdracht ga je leren hoe je …" | "## Opdracht 3.2.a: Sorteren met `sort()`" + 1 zin wat te doen |
| "We zullen nu een voorbeeld bekijken." | (toon het voorbeeld) |
| "Met behulp van de functie `len()` kunnen we …" | "`len()` geeft de lengte van een lijst." |

## 6. Opdrachten schrijven

- **Eén ding tegelijk.** Een opdracht test maximaal één nieuw concept.
- **Concreet eindresultaat.** "Maak een lijst met 5 namen en print de derde" beats "experimenteer met lijsten".
- **Tip ≠ oplossing.** De tip wijst richting, geeft niet weg. Test: kan een leerling met alleen de tip nog steeds vastlopen? Dan is 'ie goed.
- **Oplossing volledig en draaiend.** Niet een snippet, het hele werkende stukje code.

## 7. Cheatsheet-stijl

- **Eén `<details>` per concept.** Vraag-georiënteerde summary: "Hoe maak ik een cirkel? (`new_circle`)" — niet "Cirkels".
- **Minimaal voorbeeld** binnenin (3–6 regels Python). Geen volledige game.
- **Geen uitleg over wanneer/waarom** — daar is de lespagina voor. De cheatsheet is referentie.

## 8. Review-checklist (kort, vóór publicatie)

- [ ] **Toon:** geen "u", geen vulwoorden, geen onnodige uitroeptekens.
- [ ] **Eén concept-check:** introduceert deze pagina maximaal één nieuw idee?
- [ ] **Voorbeeld vóór definitie:** zie ik eerst werkende code, dan uitleg?
- [ ] **Opdrachten:** elke opdracht heeft tip én oplossing in `<details>`?
- [ ] **Links bestaan:** open elke `[…](…)` en controleer.
- [ ] **Geen samenvatting** aan het eind (tenzij het echt een capstone-overzicht is).
- [ ] **Code draait** zoals 'ie in de pagina staat, kopieer-plak-test.

---

Zie `WRITING_STYLE_GUIDE.md` voor de exacte formaten (frontmatter, opdracht-template, cheatsheet-template).
Zie `CLAUDE.md` (org-handbook) voor de didactische principes erachter (PRIMM, error-driven learning, cognitive load).
