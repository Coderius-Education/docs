---
name: leerling-doorloop
description: Loop een tutorial, les, hoofdstuk of cursus kritisch door alsof een leerling hem voor het eerst doet, en lever een bevindingenlijst op ernst (blokkeert, verwart, wringt) met per patroon een voorstel voor een test. Gebruik deze skill zodra iemand vraagt om een les of hoofdstuk te reviewen, door te lopen, na te lopen, te "doorlijken", te controleren op fouten, of te bekijken "als leerling", "vanuit de leerling", "met frisse ogen" of "alsof je het voor het eerst doet", ook als het woord review niet valt. Ook bij "klopt dit hoofdstuk?", "waar lopen leerlingen vast?", "is deze uitleg te volgen?" en bij de vraag om een nieuw geschreven les te checken voordat hij live gaat. Niet voor code-review van componenten of scripts; daar is de gewone review voor.
---

# Doorloop als leerling

Een les reviewen als redacteur en een les doorlopen als leerling zijn twee
verschillende dingen. De redacteur leest de tekst en beoordeelt of hij
klopt. De leerling zit met de pagina open, probeert te doen wat er staat,
drukt op de knop, vergelijkt zijn uitvoer met het antwoord en denkt bij elk
verschil dat híj iets fout doet. Deze skill doet het tweede. Het levert
andere bevindingen op dan een tekstreview: een verwachte uitvoer die twee
spaties afwijkt, een oplossing die al in de startcode staat, een "druk op
Reset" die de tab bevriest, een stelling die de bug verklapt die de
volgende pagina de leerling zelf laat ontdekken.

## Hoe je te werk gaat

**Lees in de volgorde van de sidebar, elke pagina helemaal.** Ook de code in
de speeltuinen, ook de antwoorden in de uitklapblokken, ook de tips. Een
leerling slaat niets over en ziet dus ook wat de auteur in een `<details>`
verstopte. Lees per hoofdstuk alles vóór je iets opschrijft: de meeste
fouten zijn tegenstrijdigheden tussen pagina's, en die zie je alleen als je
de vorige nog vers hebt.

**Doe wat de leerling doet: druk op elke knop.** Vertrouw geen enkele
beloofde uitvoer op het oog. Draai elk runbaar blok (in dit repo met de
bestaande controle, zie hieronder, of los met `python3`) en leg de uitvoer
naast wat het antwoord belooft, tot op de spatie. Een leerling die `    i=0`
ziet waar de les `  i=0` beloofde, denkt dat zijn code anders is. Draai
ook de startcode van een opdracht óngewijzigd, want dat is wat een leerling
als eerste doet: hoort hij dan een falende test te zien, of krijgt hij een
`TypeError` over een `ellipsis` die nergens wordt uitgelegd? Staat de
oplossing al in de startcode, dan is er niets te bouwen. Voer de
oplossingen uit de uitklapblokken uit. En heeft de speeltuin meer knoppen
dan Voer uit (Stap voor stap, Reset, een spel), gebruik die dan ook, met
dezelfde grenzen als in de browser: de opnemer van Stap voor stap stopt na
1000 stappen en vraagt dan of de code eindeloos loopt, ook bij een goede
oplossing met een grote test erin. Meet dat met `sys.settrace` als je niet
in een browser kunt.

**Controleer elke bewering over het gereedschap in de bron.** "Druk op Reset
als het hangt", "de knop Stap voor stap toont de variabelen", "dit werkt ook
op je telefoon": zoek de component op en kijk of het klopt. De leerling kan
dat niet, en juist die beloftes verouderen stil.

**Voer elke stelling en elke voorspelvraag zelf uit** voordat je het antwoord
openklapt. Kun je hem niet beantwoorden met wat de vorige pagina's je gaven,
dan is dat een bevinding: de stelling toetst iets dat nog niet is geleerd,
of het antwoord is "bijna juist" of "juist, als je …" en dus geen antwoord.

**Stel per pagina vijf vragen**, en per hoofdstuk drie. Ze staan hieronder;
loop ze letterlijk af, want de vragen die je "wel ongeveer weet" zijn de
vragen die je overslaat.

**IJk eerst op één hoofdstuk.** Doe het eerste hoofdstuk helemaal, rapporteer
de lijst, en vraag of de strengheid klopt. Pas daarna de rest. Zonder ijkpunt
weet de opdrachtgever niet of "wringt" bij jou hetzelfde betekent als bij
hem, en dan is de hele lijst niet te lezen.

**Verander niets aan de lessen voordat de lijst is besproken.** De lijst is
het product van deze skill. Welke punten worden opgepakt is een redactionele
keuze, en een fix zonder afspraak wist het bewijs waar de lezer over
oordeelt. Rapporteer, wacht, en pak daarna op wat is afgesproken, in de
volgorde: blokkeert, dan verwart, dan per patroon één commit, dan de
wringers als veegronde.

## De vijf vragen per pagina

1. **Kan ik dit hier?** Welke kennis, syntax of functie gebruikt de pagina,
   en waar heb ik die geleerd? Alles wat nieuw is zonder uitleg en zonder
   link (een `enumerate`, een `break`, een `elif`, een tuple-return, een
   `+=` op een lijst, een `assert`) is een bevinding. Volg ook elke
   voorkennis-link: staat op de doelpagina wat het label belooft? Een label
   "Functies en return-waarden" dat landt op een les zonder `return` laat
   het gat precies waar het was. Tel ook hoeveel nieuwe dingen de pagina
   tegelijk introduceert: meer dan één is te veel voor een bouwstap.
2. **Klopt wat de pagina belooft?** Uitvoer, getallen in tabellen, "verwacht:
   …"-commentaren, linkteksten, verwijzingen naar "stap 5" of "hoofdstuk 3",
   beweringen over het gereedschap. Draai, reken na, klik door.
3. **Mag ik het zelf proberen voordat het antwoord komt?** Een fix die vóór
   "Probeer het zelf" staat, een stelling die de ontdekking van de volgende
   pagina verklapt, een startcode die de oplossing al bevat, een "Onderzoek"
   waarvan de uitkomst in de tekst erboven staat: de leerling hoeft dan niet
   te denken, en dat is het hele doel van de pagina.
4. **Kan ik controleren of ik het goed heb?** Heeft elke opdracht, uitdaging
   en voorspelvraag een antwoord, en is dat antwoord volledig en draaiend?
   "Uitdaging (optioneel)" zonder oplossing leest als "hier hoeft niets
   bij".
5. **Waar haak ik af?** Tekst die ik twee keer moet lezen, een blok van
   veertig regels scaffolding waarin ik drie regels invul, een grafiek die
   niets toevoegt, een samenvatting van wat ik net las, Engelse woorden
   tussen het Nederlands, een pijl of uitroepteken die de rest van het
   hoofdstuk niet heeft.

## De drie vragen per hoofdstuk

1. **Is de volgorde de volgorde?** Gebruikt een pagina iets dat pas later
   wordt geïntroduceerd? Introduceert pagina 3 als nieuw wat pagina 2 al
   gebruikte? Wijst "komt later" ergens naartoe, en bestaat die plek?
2. **Zeggen de pagina's hetzelfde?** Dezelfde versie van de code in de
   bouwstap en op de compleet-pagina; dezelfde getallen in het concept, de
   stelling en het onderzoek (n of n − 1 swaps; "de helft van het werk"
   tegenover "evenveel vergelijkingen"); dezelfde toon in de "Door
   naar"-regels.
3. **Zijn de fouten op de fouten-pagina de fouten van dit hoofdstuk?** Een
   fout die nergens in het hoofdstuk te maken valt (een `range(len + 1)` die
   niemand schreef) helpt de leerling niet; een fout die twee keer op de
   lijst staat ook niet. En omgekeerd: welke fout maakte jij tijdens het
   doorlopen, en staat die erbij?

## Ernst

Deel elke bevinding in bij één van drie klassen, en zet de klasse voorop.

- **Blokkeert.** De leerling kan niet verder, raakt werk kwijt, of leert iets
  dat niet waar is en er niet meer uit gaat. Een advies dat de browser
  bevriest. Een opdracht zonder iets te doen. Een uitvoer die niet klopt op
  de pagina waar hij zijn eerste eigen code vergelijkt.
- **Verwart.** De leerling komt er wel doorheen, maar met een verkeerd beeld
  of een omweg. Een experiment dat niets laat zien (twee sorteringen die
  hetzelfde geven omdat de test verkeerd is opgezet). Een stelling die
  vooruitloopt. Een fout die twee keer op de lijst staat. Een "komt later"
  zonder plek.
- **Wringt.** Het klopt, maar het leest niet. Een pijl waar de rest een punt
  heeft, "trivially" in een Nederlandse zin, "de groene elementen" in een
  tekstblok zonder kleur, een grafiek die de opdracht niet nodig heeft.

Twijfel je tussen twee klassen, kies de lichtste en zeg waarom. Een lijst
waarin alles "blokkeert" is niet te prioriteren.

## Het rapport

Eén lijst per doorloop, ook bij meerdere hoofdstukken. Per bevinding: de
klasse, het bestand (of de pagina), wat de leerling ziet, wat er had moeten
staan, en hoe je het hebt vastgesteld (gedraaid, nagerekend, in de bron
opgezocht). Groepeer op klasse, nummer door, en houd elke bevinding op twee
tot vier zinnen.

Sluit af met twee korte secties:

- **Patronen over de hoofdstukken heen.** Alles wat drie keer of vaker
  voorkomt is geen bevinding meer maar een gewoonte van de auteur, en die
  pak je als geheel op.
- **Wat een test kan worden.** Voor elk patroon: kan een script het
  vastpinnen? Een uitvoerblok dat niet klopt, een opdracht zonder antwoord,
  een linktekst met een oud nummer, een belofte over het gereedschap: dat
  zijn regels die een test kan afdwingen, zodat de klasse niet terugkomt.
  Kijk eerst welke tests er al zijn (`ls sites/<site>/src/docs-tests/`,
  `packages/shared/*.test.ts`, de markers van het blokken-script) en zeg
  dan welke bestaande controle uitgebreid kan worden en wat nieuw moet.

Eindig met een voorstel voor de volgorde van oppakken en de vraag welke
punten de opdrachtgever wil. Niet met een fix.

## In dit repo

- `scripts/draai-python-blokken.py <site>` draait elk codeblok en vergelijkt
  de beloofde uitvoer (commentaar achter een print, uitvoerblok eronder, ook
  in een `<details>` onder een speeltuin). Draai hem eerst; wat hij groen
  laat, hoef je niet met de hand na te rekenen, maar wat buiten zijn bereik
  valt (tekst in bullets, getallen in prose en tabellen) wel.
- `pnpm tekst --streng <bestanden>` en `pnpm spel` vangen toon en spelling;
  meld die niet als bevinding, verwijs ernaar.
- Beloftes over de speeltuin controleer je in `packages/python-runner/src/`
  en de `PyRunner`- of `CodeExercise`-component van de site.
- De schrijfgids (`org-handbook/WRITING_STYLE_GUIDE.md`, §6 en §16) en het
  didactisch kader (`org-handbook/CLAUDE.md`, PRIMM en cognitive load) zijn
  de maat: één concept per pagina, tip én antwoord bij elke opdracht, geen
  samenvatting aan het eind.
- Een fix gaat samen met een test die de fout vastpint, in dezelfde commit
  (root-`CLAUDE.md`). Een patroon uit het rapport wordt dus één commit met
  de fixes én de test.

De catalogus van patronen die eerdere doorlopen vonden, met per patroon
hoe je hem herkent en wat de test werd, staat in
`references/patronen.md`. Lees die vóór je begint; het zijn de dingen die
een redacteur systematisch mist.
