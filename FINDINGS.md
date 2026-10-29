# Audit van het lesmateriaal — bevindingen

Datum: 21 september 2026 · commit `cae0a30` (branch `main`, schone werkmap)

Deze lijst is het product van een doorloop van de veertien sites in `sites/`,
volgens de skill `leerling-doorloop`: niet als redacteur die de tekst leest,
maar als leerling die de pagina openslaat, op de knop drukt en zijn uitvoer
naast het antwoord legt. Elke bevinding zegt wat de leerling ziet, wat er had
moeten staan, en hoe het is vastgesteld.

**Niets in de lessen is aangepast.** De lijst is het product; welke punten
worden opgepakt is een redactionele keuze.

---

## Wat er is gedraaid

| Controle | Uitkomst |
| --- | --- |
| `pnpm test` | 117 bestanden, 1365 tests groen |
| `pnpm spel` (cspell) | 682 bestanden, 0 onbekende woorden |
| `pnpm stijl` | 0 fouten, 412 waarschuwingen |
| `pnpm build` (14 sites) | alle sites bouwen; ~90 broken-anchor-waarschuwingen in robotica |
| `pnpm cross-links` | 14 544 links, 0 kapot |
| `scripts/draai-python-blokken.py` (python) | 278 blokken, 0 fouten |
| `scripts/draai-python-blokken.py algorithms` | 185 blokken + 27 startcodes, 0 fouten |
| `compileer-blokken.py` (robotica, fullstack) | 111 + 116 blokken, 0 fouten |
| Externe links (219 unieke URL's, HTTP) | 1 echt dood, rest localhost/fictief/anti-bot |
| Afbeeldingen (alle `![]()` in de lessen) | 0 ontbrekende bestanden, 0 zwakke alt-teksten |
| Eigen scans (frontmatter, BOM, emoji, u-vorm, opdracht zonder antwoord, dubbele alinea's, AI-frases) | zie hieronder |

De geautomatiseerde bodem van deze repo is dus stevig. Wat hieronder staat is
grotendeels wat buiten het bereik van die controles valt: getallen in proza,
beloftes over gereedschap, volgorde binnen een pagina en toon.

**Dekking.** De scans hierboven lopen over alle 771 lesbestanden (≈371 000
woorden). Het handmatig doorlopen is gericht gedaan: de bestanden die uit de
scans kwamen, plus steekproeven per site (ctf volledig, en lessen uit dvwa,
godot, embedded, web, fullstack, play, algorithms, robotica). Een volledige
doorloop van alle 371 000 woorden zit hier niet in; waar een bevinding op een
steekproef berust, staat dat erbij.

---

## Blokkeert

### 1. De startcode van PageRank-bouwsteen 4 bevriest de tab

[`sites/algorithms/docs/pagerank/bouwen/06-itereren.mdx:29`](sites/algorithms/docs/pagerank/bouwen/06-itereren.mdx)

De leerling drukt als eerste op **Voer uit** zonder iets te veranderen. De
startcode is `def pagerank(...)` met `while True:` en als enige lijf `...` —
dus een oneindige lus. Pyodide draait op de hoofdthread: de tab bevriest, de
Reset-knop reageert niet, en zijn code is weg. Dat gebeurt op de pagina waar
hij zijn eerste eigen PageRank-lus moet schrijven.

De cursus wéét dit: [`binair-zoeken/bouwen/07-while.mdx:131`](sites/algorithms/docs/binair-zoeken/bouwen/07-while.mdx)
waarschuwt letterlijk dat de tab dan bevriest en dat ook Reset niet meer
reageert. Op deze pagina staat die waarschuwing niet.

Er had moeten staan: een startcode die op een `AssertionError` omvalt (de regel
die `scripts/draai-python-blokken.py` voor startcodes stelt), of anders een
teller/`for`-vorm met een bovengrens, plus de bestaande waarschuwing.

*Vastgesteld:* de uitzondering staat met reden in `STARTCODE_ACHTERSTAND` in
[`scripts/draai-python-blokken.py:203`](scripts/draai-python-blokken.py) —
"de `while True` in de startcode heeft geen return, dus hij hangt tot de
leerling de lus afmaakt; in de browser bevriest de tab". Het is dus een bekende
achterstand, niet een nieuwe ontdekking; hij staat hier omdat het de enige
bevinding is die werk van een leerling vernietigt.

---

## Verwart

### 2. De beloofde pygame-banner klopt met geen enkele versie die draait

[`sites/play/docs/vormen/info_opvragen_over_vorm.mdx:25`](sites/play/docs/vormen/info_opvragen_over_vorm.mdx)

De les belooft als uitvoer:

```
pygame-ce 2.5.3 (SDL 2.30.12, Python 3.10.11)
black
```

De gebundelde wheel in `sites/play/static/whl/coderius_play-3.4.0-py3-none-any.whl`
pint `pygame-ce==2.5.8`, en de meegeleverde pymunk-wheel is `cp313` (Python
3.13). De leerling ziet dus een andere eerste regel dan de les belooft —
precies op de pagina die hem leert zijn uitvoer naast die van de les te leggen.

*Vastgesteld:* `Requires-Dist` gelezen uit de METADATA van de wheel;
`python3 scripts/draai-play-blokken.py --pins` geeft `numpy==2.2.6
pygame-ce==2.5.8 pymunk==7.3.0`.

### 3. Dezelfde banner, derde versie, in de cheatsheet

[`sites/play/docs/cheatsheet.md:1501`](sites/play/docs/cheatsheet.md)

Hier staat `pygame-ce 2.5.5 (SDL 2.32.6, Python 3.12.10)`. Drie plekken, drie
versies (2.5.3, 2.5.5, gebundeld 2.5.8). Het eenvoudigst is de bannerregel uit
de beloofde uitvoer halen: hij zegt de leerling niets en veroudert bij elke
bump.

### 4. "Zorg ervoor dat Python 3.10 geïnstalleerd is"

[`sites/play/docs/installatie/VScode.md:18`](sites/play/docs/installatie/VScode.md)

Staat in een `:::info` als harde eis. De wheel zegt `Requires-Python: >=3.10`,
en de rest van de keten (pymunk cp313, de CI-job draait 3.12) gaat allang
verder. Een leerling die dit letterlijk leest installeert een Python die in
2026 bijna end-of-life is. Bedoeld is "3.10 of nieuwer".

*Vastgesteld:* METADATA van de wheel; `.github/workflows/build.yml`, job `play`
(`python-version: '3.12'`).

### 5. "Elke challenge heeft er drie" — één heeft er twee

[`sites/ctf/docs/intro.md:62`](sites/ctf/docs/intro.md) belooft bij de tips:
"Lees de hints als je vastloopt (elke challenge heeft er drie)".
[`sites/ctf/docs/hacking/dubbel.md`](sites/ctf/docs/hacking/dubbel.md) heeft er
twee. Juist bij de challenge die "nog nooit is opgelost" telt de leerling zijn
hints na.

*Vastgesteld:* `<summary>Hint …</summary>` geteld in alle 21 challenge-pagina's;
20× drie, 1× twee.

### 6. Challenge 14 in de aanbevolen volgorde bestaat niet

[`sites/ctf/docs/intro.md:46`](sites/ctf/docs/intro.md) nummert 22 challenges;
nummer 14 is "Code - Base64 - Base64 decodering", als enige zonder link. Er is
geen `docs/code/base64.md` en het woord base64 komt nergens in de site voor. De
leerling die de volgorde volgt loopt tegen een gat.

Ofwel de pagina schrijven, ofwel het item uit de lijst halen en doornummeren.

### 7. Dode Wikipedia-link bij Shannon

[`sites/algorithms/docs/minimax/01-concept.mdx:96`](sites/algorithms/docs/minimax/01-concept.mdx)

`[Claude Shannon](https://en.wikipedia.org/wiki/Programming_a_Computer_for_Playing_Chess)`
geeft 404; een artikel met die titel bestaat niet (meer). De drie links
eronder (Samuel, Deep Blue, Chinook) werken wel — de haakjes in die URL's zijn
geen probleem.

*Vastgesteld:* `curl` op alle 219 externe URL's; daarna de Wikipedia-zoek-API
op de titel (geen treffer).

### 8. De pop-up zegt "Hacked!", het antwoord zegt "Hacked."

[`sites/dvwa/docs/dvwa_tutorial/06-xss-reflected/low.mdx:31`](sites/dvwa/docs/dvwa_tutorial/06-xss-reflected/low.mdx)

De vraag laat de leerling `<script>alert("Hacked!");</script>` invullen; het
antwoord belooft "een pop-up (alert) met de tekst "Hacked."". Klein, maar dit
is de eerste XSS-pagina en de leerling vergelijkt letterlijk wat er in zijn
scherm staat.

### 9. Een verkeerde verklaring onder "Er gaat iets mis"

[`sites/dvwa/docs/dvwa_tutorial/06-xss-reflected/low.mdx:90`](sites/dvwa/docs/dvwa_tutorial/06-xss-reflected/low.mdx)

De pagina zegt dat je de letterlijke tekst `<script>…` op het scherm ziet
"wanneer de input wordt weergegeven in een veld dat al sterk beveiligd is, of
wanneer een moderne browser *Content Security Policy (CSP)* heeft
ingeschakeld". Dat klopt niet: CSP blokkeert het uitvoeren van het script, het
zet de tag niet als tekst op het scherm. Zie je de tag als tekst, dan escapet
de applicatie de HTML (wat de pagina er twee zinnen eerder zelf bij zegt). Zoals
het er nu staat leert de leerling een verkeerd model van CSP — en dat komt er
later, bij hoofdstuk 13 (CSP bypass), niet meer uit.

### 10. "Godot crasht zodra die regel wordt uitgevoerd"

[`sites/godot/docs/07-signals-en-score/global_variables.md:66`](sites/godot/docs/07-signals-en-score/global_variables.md)

Het antwoord op "wat als je Stap 3 overslaat?" zegt dat Godot crasht zodra
`Global.score += 1` wordt uitgevoerd. GDScript lost namen op bij het compileren
van het script, niet bij het uitvoeren van de regel: de melding
`Identifier "Global" not declared in the current scope` verschijnt al bij het
laden van het script, vóór het spel draait. De leerling zoekt daardoor op de
verkeerde plek ("het gebeurt pas als ik de munt raak").

*Vastgesteld:* geredeneerd op het compileermodel van GDScript, niet gedraaid —
in deze omgeving is geen Godot beschikbaar. Na te lopen met de `godot`-job uit
`.github/workflows/build.yml`.

### 11. Dertien Wokwi-simulators, allemaal een leeg project

[`sites/embedded/docs/`](sites/embedded/docs) — 13 keer
`<WokwiSimulator projectUrl="https://wokwi.com/projects/new/arduino-uno" … />`,
elke keer dezelfde URL.

De kaart boven de knop belooft: "Simuleer het circuit direct in je browser. Je
kunt de code aanpassen en het resultaat live zien — zonder hardware", met een
titel als "Simuleer: externe LED knipperen". Wat de leerling krijgt is een leeg
Arduino-Uno-project: geen LED, geen weerstand, geen code. Hij moet het hele
circuit zelf natekenen voor hij iets ziet — precies het werk dat de kaart
belooft weg te nemen.

Er had per les een eigen Wokwi-project (of een `diagram.json` + sketch) moeten
staan. Zolang dat er niet is, is "Open een leeg project en bouw dit zelf na"
een eerlijker tekst.

*Vastgesteld:* alle `projectUrl`-waarden geteld (13× identiek), de component
gelezen ([`sites/embedded/src/components/WokwiSimulator/index.tsx`](sites/embedded/src/components/WokwiSimulator/index.tsx)),
en de URL opgehaald: `/projects/new/arduino-uno` levert een nieuw, leeg project.

### 12. Twee stellingen zonder antwoord

[`sites/algorithms/docs/big-o/02-stellingen.mdx`](sites/algorithms/docs/big-o/02-stellingen.mdx) —
Stelling 1 en Stelling 4 hebben een antwoord van de vorm "Waar — als …". Dat is
geen antwoord maar een herformulering van de stelling: de leerling die "waar"
of "niet waar" dacht weet nog steeds niet of hij het goed had.

*Vastgesteld:* staat als exacte achterstand in
[`sites/algorithms/src/docs-tests/stellingen.test.ts:22`](sites/algorithms/src/docs-tests/stellingen.test.ts).

### 13. Twee opdrachten zonder antwoord

[`sites/algorithms/docs/pagerank/08-aanpassen.mdx:10`](sites/algorithms/docs/pagerank/08-aanpassen.mdx)
("Opdracht 1 — draai aan `d`") en `:62` ("Opdracht 2 — voeg een link toe"). De
schrijfgids eist bij elke opdracht een oplossing in `<details>`.

*Vastgesteld:* eigen scan over alle sites én de achterstandslijst in
[`sites/algorithms/src/docs-tests/opdrachten.test.ts:31`](sites/algorithms/src/docs-tests/opdrachten.test.ts).
Dit waren de enige twee echte treffers: de 22 andere hits van de scan zijn
`### Opdracht 2: Run`-koppen in fullstack (zie bevinding 22) en één godot-kop
met het antwoord in de sectie erna.

### 14. Vier python-lessen tellen niet mee in het voortgangsdiagram

`06d` (break), `09c` (scope), `09d` (modules) en `09e` (eigen module) staan niet
in `src/data/progress.js`. Een leerling die ze doet ziet zijn voortgangsbalk
niet bewegen.

*Vastgesteld:* `ZONDER_VOORTGANG` in
[`sites/python/src/data/knowledgeGraph.test.ts:39`](sites/python/src/data/knowledgeGraph.test.ts),
met als reden "later toegevoegd, niveau per concept nog niet toegekend".

### 15. Negentig broken-anchor-waarschuwingen in de robotica-build

`pnpm build` meldt voor robotica ~90 kapotte ankers, allemaal van de vorm
`/editor#code=<base64>`. Ze werken in de browser wél: `#code=` is geen anker maar
een payload die
[`sites/robotica/src/components/WebMicroEditor/codeLink.ts`](sites/robotica/src/components/WebMicroEditor/codeLink.ts)
uitleest. Het gevolg is niet kapotte navigatie maar ruis: een ánker dat echt
kapot is, verdwijnt in deze lijst en niemand ziet het.

Oplossing: `onBrokenAnchors` voor deze site bewust instellen (met reden in de
config), of de code in een query-parameter zetten in plaats van de hash.

---

## Wringt

### 16. PRIMM staat in het Engels in de koppen van de leerling

Het didactisch kader zegt dat elke uitleg PRIMM **impliciet** volgt; de
schrijfgids verbiedt Engels als opvulling. In vier cursussen staan de
fasenamen letterlijk als kop boven de leerling zijn neus, in vier verschillende
vormen:

| Site | Vorm | Aantal koppen |
| --- | --- | ---: |
| dvwa | `## 1. Predict (Voorspel)` | 197 |
| web | `## Predict` | 102 |
| algorithms | `## Run`, `## Investigate` | 47 |
| fullstack | `### Opdracht 1: Predict` | ~116 |

Een leerling van 14 leest "Investigate (Onderzoeken)" als jargon dat hij moet
onthouden. De kop mag gewoon zeggen wat er te doen is ("Wat denk je dat er
gebeurt?", "Probeer het zelf", "Verander er iets aan").

### 17. Vier van de dertien sites houden §3 van de schrijfgids aan

De gids schrijft `# <hoofdstuk>.<sectie> <Titel>` en `Opdracht <H>.<S>.<letter>`
voor. Genummerde H1's: play (48/70), robotica (54/100), embedded (36/49),
godot (0, maar wél genummerde opdrachten: 30/31). algorithms, python, web,
fullstack, dvwa, ctf en editor nummeren niets.

Bij algorithms is dat een bewuste, beargumenteerde afwijking, vastgelegd in
[`sites/algorithms/CLAUDE.md:5`](sites/algorithms/CLAUDE.md) ("De H1 draagt géén
lesnummer, anders dan §3 van de schrijfgids") en bewaakt door een test. Bij de
andere zes staat nergens iets. Of §3 versoepelen tot "nummer als de cursus
nummert", of de afwijking per site vastleggen zoals algorithms dat doet.

### 18. Zeven verouderde kopieën van de schrijfgids

`sites/{algorithms,dvwa,editor,godot,python,robotica,web}/WRITING_STYLE_GUIDE.md`
zijn onderling identiek (md5 `4e30c2c2…`) en lopen 80 regels achter op
[`org-handbook/WRITING_STYLE_GUIDE.md`](org-handbook/WRITING_STYLE_GUIDE.md):
ze missen §17 (de geautomatiseerde controle), de `<SiteLink>`-paragraaf en de
`<CodeUitleg>`-regel. Wie de gids in zijn eigen site opzoekt, leest de oude.
Weghalen en naar de org-handbook verwijzen.

### 19. Vierentwintig play-bestanden beginnen met een BOM

Een UTF-8 BOM vóór de frontmatter, allemaal in `sites/play/docs/`. Docusaurus
slikt het (gray-matter strippt de BOM — nagegaan), maar eigen scripts en greps
struikelen erover: mijn eerste scan zag 24 bestanden "zonder frontmatter".
Eén keer strippen en er een regel voor zetten.

*Bestanden:* `acties/meer_acties.mdx`, `database/{basis,highscore,settings,zelf_doen}.md`,
`fysica/{eigenschappen,physics_info}.md`, `gebeurtenissen/{controllers,muis,vormen}.mdx`,
alle tien `pygame-ce/*`, `tijd/3_animaties.mdx`,
`vormen/{info_opvragen_over_vorm,je_eerste_rechthoek,vorm_aanpassen}.mdx`.

### 20. Vier samenvattingen aan het eind

De gids verbiedt ze ("de leerling heeft het net gelezen"):
[`godot/07-signals-en-score/global_variables.md:159`](sites/godot/docs/07-signals-en-score/global_variables.md) ("## Samenvatting"),
[`editor/git/basis/stap-7-gitignore.mdx:22`](sites/editor/docs/git/basis/stap-7-gitignore.mdx) en
[`editor/git/pull-request/welke-knop.md:26`](sites/editor/docs/git/pull-request/welke-knop.md) ("## Wat je nu kunt"),
[`dvwa/dvwa_tutorial/15-word-de-developer.mdx:112`](sites/dvwa/docs/dvwa_tutorial/15-word-de-developer.mdx) ("## Reflectie").
`pnpm stijl` meldt ze al als waarschuwing.

### 21. Mappen met spaties en hoofdletters in robotica

`sites/robotica/docs/Microcontrollers/Arduino Nano RP2040 Connect/Tutorial-meten is weten/…`
wordt een URL met `%20` erin, terwijl het didactisch kader kebab-case
voorschrijft. Hernoemen breekt bestaande links en bookmarks, dus dit is een
bewuste-keuze-punt, geen quick win — maar het valt op zodra je een link deelt.

Daarbij: dezelfde lessen staan twee keer in de site, onder `/docs/Microcontrollers/…`
en onder `/lego_auto/…` (de tweede importeert de eerste, zie
`sites/robotica/lego_auto/motoren/material.md`). Dat is functioneel in orde,
maar twee routes naar dezelfde tekst betekent ook twee plekken waar een leerling
kan uitkomen.

### 22. "Opdracht 2: Run" is geen opdracht

24 fullstack-lessen hebben een `### Opdracht 2: Run` die alleen zegt "voer de
code hierboven uit". Geen tip, geen antwoord — terecht, want er valt niets na te
kijken. Maar de gids eist bij elke *opdracht* een oplossing, en de leerling die
de nummering volgt telt vijf opdrachten waarvan er één leeg is. Noem het een
stap, geen opdracht.

### 23. Geen centrale cheatsheet in ctf en editor

De gids (§7) zegt: elk docs-project heeft één centrale `cheatsheet.md`. ctf
heeft een toolbox en een woordenlijst, editor niets. Bij algorithms staat de
cheatsheet per hoofdstuk (`*/11-cheatsheet.mdx`) — ook een afwijking, maar
beargumenteerd en consequent.

### 24. Kleine wringers, als groep

- `sites/web/docs/js-basics/variabelen.mdx:106` — kop met punt erachter
  ("## Probeer het zelf."); de rest van de site heeft geen punt in koppen.
- Taalcodes op codeblokken lopen uiteen: web schrijft ```js (113×), fullstack en
  dvwa schrijven ```javascript (12×). Kies er één.
- `sites/godot/docs/02-editor-leren-kennen/interface.md:27` gebruikt `⚙` in een
  ASCII-tekening van de editor-layout. Functioneel, en `pnpm stijl` kijkt
  terecht niet in codeblokken — maar het is het enige symbool van dat type in
  771 bestanden, dus de vraag is of de tekening niet beter `Instellingen` kan
  zeggen.
- `sites/robotica/lego_auto/motoren/let_op.md` heet "Let op!" in de frontmatter;
  uitroeptekens worden in de lestekst nergens anders gebruikt (`pnpm stijl`
  kijkt niet in frontmatter).
- `sites/godot/docs/07-signals-en-score/global_variables.md` introduceert op één
  pagina autoload én return-types (`-> void`, `-> bool`). Het kader zegt: maximaal
  één, hooguit twee nieuwe concepten per pagina. De tweede helft is een eigen les.

### 25. Tekst-ruis: 412 stijlwaarschuwingen

`pnpm stijl` geeft 0 fouten en 412 waarschuwingen. Verdeling over de vijf
zwaarste regels:

| Site | vulwoord | passief | em-dash | vet-overdaad | superlatief |
| --- | ---: | ---: | ---: | ---: | ---: |
| dvwa | 42 | 35 | 4 | 1 | 2 |
| algorithms | 14 | 3 | 25 | 10 | 8 |
| play | 14 | 7 | 5 | 17 | 1 |
| python | 15 | 1 | 4 | 3 | 0 |
| godot | 11 | 5 | 11 | 7 | 2 |
| fullstack | 12 | 2 | 3 | 4 | 0 |
| embedded | 9 | 1 | 6 | 7 | 6 |
| editor | 6 | 0 | 7 | 12 | 0 |
| web | 1 | 0 | 18 | 1 | 1 |
| ctf | 5 | 2 | 0 | 4 | 0 |
| robotica | 2 | 1 | 0 | 5 | 0 |

De em-dash-dichtheid zit vooral in de referentiepagina's:
[`web/src/pages/cheatsheet.mdx`](sites/web/src/pages/cheatsheet.mdx) (90 stuks),
[`godot/src/pages/cheatsheet.md`](sites/godot/src/pages/cheatsheet.md) (48),
[`web/src/pages/docenten.mdx`](sites/web/src/pages/docenten.mdx) (39).

---

## Patronen over de hoofdstukken heen

Alles wat drie keer of vaker terugkomt is geen losse bevinding meer maar een
gewoonte, en die pak je als geheel op.

**P1. Versienummers in beloofde uitvoer verouderen stil.** (bevindingen 2, 3, 4)
Drie plekken in play, drie verschillende pygame/Python-versies, geen enkele
gelijk aan de gebundelde wheel. Niets controleert ze, want `draai-play-blokken.py`
draait de blokken wel maar vergelijkt hun uitvoer niet.

**P2. Een belofte over gereedschap die niemand nakijkt.** (1, 11, 15)
"Simuleer het circuit in je browser" bij een leeg project; een startcode die de
tab bevriest op een site die elders precies dát uitlegt; links die als anker
kapot heten te zijn maar werken. Dit is het patroon uit
`references/patronen.md` dat het stilst veroudert: de leerling kan het niet
controleren.

**P3. Het PRIMM-frame lekt naar de leerling.** (16, 22)
Vier sites, vier vormen, ~440 koppen. Het kader zegt "impliciet"; de praktijk is
een Engelse fase-naam als kop. Dit is het duidelijkste gegenereerde-sjabloon-
signaal in de repo: niet de zinnen, maar de skeletstructuur die per bestand
identiek herhaalt (dvwa: 22 lessen met exact dezelfde zes koppen; fullstack: 24
lessen met exact `Opdracht 1: Predict … Opdracht 5: Make`).

**P4. Stijltics die op herhaling AI-achtig gaan lezen.** Gemeten over alle
lesbestanden, met code eruit:

| Constructie | Totaal | Dichtst |
| --- | ---: | --- |
| "niet X, maar Y" | 78 | ctf 5,3/10k woorden · godot 4,4 · dvwa 3,7 |
| "dat is precies (wat/dat)" | 71 | embedded 5,0/10k · godot 4,1 · python 1,9 |
| "geen X, geen Y" | 14 | algorithms |
| "en dat is …" | 26 | algorithms |

Elk apart onschuldig; samen het ritme dat de schrijfskills-gids "robotachtige
symmetrie" noemt. Ter vergelijking: play en python zitten op 0,6/10k voor de
eerste constructie — daar is de tekst duidelijk een keer door een mens
geredigeerd.

**P5. Documentatie over de documentatie loopt uit de pas.** (17, 18, 23)
Zeven verouderde kopieën van de schrijfgids, en drie regels uit die gids (§3
nummering, §7 cheatsheet, §4 PRIMM impliciet) die door de helft van de sites
niet worden gevolgd zónder dat er ergens staat dat het een keuze was.

**P6. De codecontrole stopt bij de taalgrens.** Python (play, python,
algorithms, robotica, fullstack) en GDScript (godot) worden in CI gedraaid of
gecompileerd. Niet gecontroleerd: 113 JS-, 99 HTML- en 82 CSS-blokken in web;
82 C/C++-blokken in embedded; 47 PHP-blokken in dvwa. Daar is een typefout op
dit moment net zo onzichtbaar als hij in godot was vóór de godot-job bestond.

---

## Wat een test kan worden

Per patroon: wat bestaat er al, wat kan worden uitgebreid, wat moet nieuw.

| Patroon | Test |
| --- | --- |
| P1 versies in uitvoer | **Uitbreiden.** `scripts/draai-play-blokken.py` draait de blokken al; laat hem ook de uitvoerblokken eronder vergelijken, zoals `draai-python-blokken.py` dat voor python en algorithms doet. Goedkoper alternatief: een test die elke `pygame-ce X.Y.Z`-regel in de docs legt naast `Requires-Dist` in de wheel. Dat vangt 2 en 3 meteen. |
| 1 bevriezende startcode | **Bestaat.** `STARTCODE_ACHTERSTAND` in `draai-python-blokken.py` pint hem al vast; de fix is de lijst leegmaken, niet een nieuwe test. |
| 11 Wokwi-belofte | **Nieuw**, klein: een test die verbiedt dat twee `<WokwiSimulator>`-embeds dezelfde `projectUrl` hebben, en dat die URL niet op `/projects/new/` eindigt. Dezelfde vorm als `speeltuin.test.ts` in algorithms. |
| 5, 6 ctf-beloftes | **Nieuw**, klein: `sites/ctf/src/docs-tests/challenges.test.ts` — elke challenge-pagina heeft drie hints, en elk genummerd item in `intro.md` is een link naar een bestaande pagina. |
| 7 dode externe links | **Nieuw**, buiten de PR-loop: een wekelijkse job die de 219 externe URL's ophaalt (localhost en de fictieve `*.nl`-voorbeelden op een uitzonderingslijst). In een PR-job hoort hij niet: hij faalt op andermans uptime. |
| 12, 13 opdracht/stelling zonder antwoord | **Bestaat** voor algorithms (`opdrachten.test.ts`, `stellingen.test.ts`, met exacte achterstand) en play (`opdrachten.test.ts`). **Uitbreiden** naar web, fullstack, godot, embedded en robotica — die hebben samen ruim 240 opdrachten zonder zo'n bewaking. |
| 16, 22 PRIMM-koppen | **Nieuw**, als de redactie de koppen wil vernederlandsen: een stijlregel in `packages/shared/stijl.js` die `Predict/Run/Investigate/Modify/Make` als kop weert, met een achterstandslijst per site zoals de rest van de repo dat doet. |
| 18 kopieën van de gids | **Nieuw**, één regel: een test die weert dat `WRITING_STYLE_GUIDE.md` buiten `org-handbook/` bestaat. |
| 19 BOM | **Nieuw**, één regel: geen enkel `.md`/`.mdx`-bestand begint met `﻿`. |
| 15 broken anchors | **Nieuw**: de build-output van robotica op nul waarschuwingen zetten (door `onBrokenAnchors` bewust te configureren), zodat een echte kapotte anker weer opvalt. |
| P6 ongecontroleerde code | **Nieuw**, in volgorde van opbrengst: `node --check` op de JS-blokken van web (113 stuks, dezelfde extract-aanpak als robotica/fullstack), `php -l` op de 47 dvwa-blokken, `arduino-cli compile` of `gcc -fsyntax-only` op de 82 C/C++-blokken van embedded. |
| 24 taalcodes, koppen | **Uitbreiden.** `pnpm stijl` kijkt al naar proza; een regel voor ```js versus ```javascript en voor een punt achter een kop past daar precies in. |

---

## Voorstel voor de volgorde

1. **Bevinding 1** — de bevriezende startcode. Eén pagina, en het is het enige
   punt waarbij een leerling werk kwijtraakt.
2. **P1 (2, 3, 4) in één commit** met de uitgebreide uitvoercontrole erbij, zoals
   de root-`CLAUDE.md` het wil: fix plus test die hem vastpint.
3. **P2 (11, 15)** — de beloftes over gereedschap: de Wokwi-embeds en de
   ankerruis in robotica.
4. **De losse ontbrekende antwoorden en beloftes** (5, 6, 7, 12, 13, 14), elk
   klein, samen goed voor twee middagen.
5. **8, 9, 10** — de drie feitelijke correcties in dvwa en godot.
6. **P3/P5 als redactiebesluit** (16, 17, 18, 22, 23): eerst beslissen wat de
   norm is, dan één veegronde per site. Dit is de grootste post en de enige
   waarbij eerst een keuze nodig is.
7. **De veegronde wringers** (19, 20, 21, 24, 25) tot slot, per site, met
   `pnpm stijl` als maat.

Welke punten wil je opgepakt hebben, en klopt de strengheid? Als "verwart" bij
jou zwaarder of lichter weegt dan hierboven, stel ik de indeling bij vóór er
iets aan de lessen verandert.
