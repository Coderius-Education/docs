# Huisstijl

Eén bron voor het merk van Coderius en van elke cursus: `index.js` (kleuren,
letters, cursussen), `merk.js` (de logo's), `kleur.js` (het rekenwerk). Alles
wat de sites gebruiken wordt daaruit gegenereerd:

```sh
node scripts/genereer-huisstijl.mjs
```

`packages/shared/huisstijl.test.ts` valt om zolang de uitvoer niet bij de bron
past, en controleert het contrast van elke cursuskleur in beide thema's.

## Waar het vandaan komt

Coderius begon op het Corderius College in Amersfoort. De school is genoemd
naar Maturinus Corderius (Mathurin Cordier, 1479–1564), een humanistische
schoolmeester. Zijn *Colloquia* leerden kinderen Latijn door het te gebruiken:
korte gesprekken in plaats van rijtjes regels. Coderius is dezelfde naam met
*code* waar *cor* stond.

Die afkomst geeft de huisstijl twee kanten. De serif komt uit het schoolboek,
de monospace uit de editor, en het woordmerk zet ze naast elkaar: `code` in
de mono, `rius` in de serif. Het merk is dat schoolboek, in code geschreven.

De huisstijl leunt bewust niet op die van het Corderius College. Coderius is
open lesmateriaal voor elke school.

## Het merk

Een opengeslagen boek dat in code is geschreven: het schoolboek van Corderius,
maar dan voor programmeurs.

- De **linkerbladzijde** is bij elke cursus gelijk: vijf regels code,
  ingesprongen zoals Python, met één regel onder de markeerstift.
- Op de **rechterbladzijde** staat wat je in de cursus doet.
- De **kaft** heeft de kleur van de cursus.
- Het **leeslint** is markeergeel, bij elke cursus: je bent ergens gebleven.

Papier, inkt en lint zijn in beide thema's gelijk; alleen de kaft volgt het
thema. Zo leest de rechterbladzijde overal even goed.

| Cursus | Rechterbladzijde | Waarom |
|:---:|:---:|:---|
| Coderius | `>` en een cursor | jij bent aan de beurt |
| VS Code & Git | vertakking | een branch in Git |
| Python | `>>>` | de prompt van de Python-shell |
| Webontwikkeling | `</>` | een HTML-tag |
| Play | driehoek | de startknop van een spel |
| Algoritmes | oplopende staven | sorteren |
| Fullstack | drie lagen met lampjes | een serverrek |
| Robotica | robotkopje | sensoren en motoren |
| Embedded | chip | een microcontroller |
| Godot | kruistoets | een gamecontroller |
| Capture The Flag | vlag | de vlag die je verovert |
| DVWA | hangslot | websecurity |
| Online Editor | terminalvenster | code draaien in de browser |
| Didactiek | tekstballon | het gesprek, zoals in de *Colloquia* |

Per cursus zijn er vijf bestanden in `static/img/merk/`:

- `<id>.svg` en `<id>-donker.svg`: het merk, voor de navbar (licht en donker thema).
- `<id>-tegel.svg`: het boek op een tegel in de cursuskleur (kaft donkerder), voor favicons.
- `woordmerk-<id>.svg` en `woordmerk-<id>-donker.svg`: merk, `coderius` en de cursusnaam.

`createConfig` zet merk, naam en favicon van de cursus zelf; een site hoeft
niets in te stellen. Teken een merk nooit na en zet het niet op een andere
kleur dan zijn eigen tegel.

## Kleur

- Elke cursus heeft één tint in OKLCH. De lichtheid rekent het script uit:
  in licht thema zo licht als kan met 5:1 tegen wit, in donker thema zo donker
  als kan met 7:1 tegen de grond. Zo hebben alle veertien kleuren hetzelfde
  contrast.
- Die kleur wordt de `--ifm-color-primary` van de cursussite. Tekst óp de
  kleur is `--coderius-on-primary`: wit in licht thema, de donkere grond in
  donker thema. Nooit hard `#fff`.
- De neutralen hebben een zweem bordgroen (tint 165).
- `--coderius-markeer` is de markeerstift: gemarkeerde coderegels en
  selecties. Alleen als vlak achter tekst, nooit als tekstkleur.

## Letters

Alle drie zelf gehost via fontsource, zonder verzoek naar Google.

- **Atkinson Hyperlegible Next** voor lopende tekst. Ontworpen door het Braille
  Institute voor lezers met een visuele beperking; letters die op elkaar lijken
  (`l`, `1`, `I`) zijn duidelijk verschillend.
- **Atkinson Hyperlegible Mono** voor code: dezelfde familie, dus code en tekst
  lopen door elkaar zonder te botsen, en `0`/`O` en `1`/`l` zijn te onderscheiden.
- **Literata** voor koppen en de sitenaam: een boekletter, het schoolboek.

## Iets aanpassen

- Nieuwe cursus: voeg hem toe aan `packages/shared/sites.js` én aan
  `CURSUSSEN` in `index.js` (tint en glyph), en draai het script. De test eist
  dat elke site in de registry een merk heeft.
- Nieuwe glyph: teken hem in `merk.js` rond (0,0), binnen x -7..7 en y -8..8,
  met lijn 2.4; `gat` spaart papier uit in een vlak.
- Verander nooit de gegenereerde bestanden met de hand.

## Specificiteit

Met `future.v4` zet Docusaurus Infima in een cascade layer en bootst die na door
Infima's selectors op te hogen tot `:root:not(#\#):not(#\#)`. Een kale `:root`
verliest daarvan: het oude groen `#2e8555` heeft daardoor nooit op een site
gestaan, alle sites toonden Infima's blauw. De huisstijl-CSS gebruikt daarom
dezelfde opgehoogde selector; de test bewaakt dat.
