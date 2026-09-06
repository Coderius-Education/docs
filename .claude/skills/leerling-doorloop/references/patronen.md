# Patronen uit eerdere doorlopen

Elk patroon hieronder is minstens twee keer gevonden in de zoek- en
sorteerhoofdstukken van de algoritmes-cursus (PR #64). Ze staan hier omdat
een redacteur ze systematisch mist: de tekst klopt, en toch klopt de les
niet. Per patroon: hoe je hem herkent als leerling, een voorbeeld, en welke
test hem sindsdien vastpint (of zou kunnen).

## Beloofde uitvoer wijkt af van echte uitvoer

**Herkennen.** Draai het blok, leg de uitvoer naast het antwoord. Let op
inspringing van geprinte regels, spaties na een dubbele punt, een lege regel
vooraan, een getal dat na een latere aanpassing van de code niet is
bijgewerkt.

**Voorbeelden.** `i=0: swap` met twee spaties waar de code er vier print.
`W = 15 -> 51` waar de code 56 geeft. "Pas bij ronde 4" waar de uitvoer
ronde 0 tot en met 3 toont. `# verwacht: 2` achter een print die iets anders
geeft na een wijziging elders.

**Test.** `scripts/draai-python-blokken.py` vergelijkt uitvoerblokken en
print-commentaren, sinds PR #64 ook in het `<details>` onder een speeltuin.
Getallen in prose en tabellen vallen erbuiten: die reken je na.

## De oplossing staat al in de startcode

**Herkennen.** Draai de startcode van een opdracht zoals hij er staat. Geeft
hij het goede antwoord, dan hoeft de leerling niets. Lees ook het
antwoord-blok: "de code hierboven werkt al" is het signaal.

**Voorbeeld.** Bubble sort, bouw zelf: beide functies compleet in de
startcode, met `# vul aan`-commentaren erboven die niets vroegen.

**Test.** Geen automatische; de opdracht-test eist wel een antwoord-blok.
Een script zou de startcode kunnen draaien en eisen dat de "verwacht"-
waarden er níét uitkomen, maar dat vraagt een marker per opdracht.

## Een opdracht of uitdaging zonder antwoord

**Herkennen.** Elke kop "Opdracht", "Uitdaging", "Bouw zelf" zonder een
`<details>` met het antwoord eronder. "(optioneel)" is geen vrijstelling: de
schrijfgids eist bij elke opdracht een oplossing.

**Test.** `sites/algorithms/src/docs-tests/opdrachten.test.ts`: elke zo'n H2
heeft een `<summary>Antwoord</summary>`, met de nog niet doorgelopen
hoofdstukken als exacte achterstand in de test.

## De fix staat vóór "Probeer het zelf"

**Herkennen.** Lees de pagina van boven naar beneden en let op het moment
waarop je zelf iets moet doen. Staat de oplossing (in tekst, tip of code)
daar al boven, dan is het proberen toneel. Variant: dezelfde code staat twee
keer op de pagina, één keer als "kijk eens" en één keer als "voorspel".

**Voorbeeld.** Lineair zoeken, bouwsteen 4: "De fix: `return -1` moet
buiten de lus", daarna "Probeer het zelf: verplaats `return -1`".

**Test.** Geen; dit is volgorde binnen een pagina en vraagt lezen.

## Een stelling loopt vooruit of verklapt

**Herkennen.** Beantwoord de stelling met alleen wat de vorige pagina's je
gaven. Lukt dat niet (O-notatie, log₂, `elif`, tuples, een ander algoritme),
dan toetst hij het idee niet. Kijk ook vooruit: laat een latere bouwstap de
leerling iets ontdekken dat deze stelling al vertelt (de startwaarde 0 bij
vind het maximum)? En is het antwoord "bijna juist" of "juist, als je …",
dan heeft de stelling geen antwoord.

**Test.** Geen automatische; een regel in `sites/algorithms/CLAUDE.md`.

## "Komt later" zonder plek

**Herkennen.** Elke "komt later", "daar leer je later over", "bij Maken":
zoek de plek. Bestaat die niet, of is het een uitdaging zonder oplossing,
dan is het een losse belofte.

**Test.** Een linktekst-test kan eisen dat een vooruitwijzing een link is;
`nummering.test.ts` vangt al oude stapnummers in linkteksten (`[stap 5]`).

## Een experiment dat niets laat zien

**Herkennen.** Vraag je bij elk "Onderzoek" af: kan de uitkomst anders zijn
dan de tekst zegt, en laat de opzet dat zien? Draai het met een variant.

**Voorbeeld.** De stabiliteitstest met tuples `(2, 'a'), (1, 'b')`: Python
vergelijkt de hele tuple, dus de letter bepaalt de volgorde en selection
sort en bubble sort geven precies hetzelfde rijtje. De ene pagina beweerde
instabiliteit die niet optrad, de andere bewees stabiliteit met een test
die niets bewees.

**Test.** Geen; dit is begrip van het experiment.

## Een belofte over het gereedschap die niet klopt

**Herkennen.** "Druk op Reset", "de knop X doet Y", "dat werkt ook op …":
zoek de component op. Wat de leerling niet kan controleren, veroudert het
stilst.

**Voorbeeld.** "Bij een oneindige lus druk je gewoon op Reset": Pyodide
draait op de hoofdthread en de knop staat uit zolang er iets draait. De tab
bevriest en de leerling is zijn code kwijt, precies op de pagina die hem
aanmoedigde te experimenteren.

**Test.** `sites/algorithms/src/docs-tests/speeltuin.test.ts` verbiedt de
zin en eist bij elke oneindige lus de waarschuwing dat de tab bevriest.

## Twee pagina's spreken elkaar tegen

**Herkennen.** Houd per hoofdstuk een lijstje getallen en versies bij
(aantal vergelijkingen, aantal swaps, welke variant van de code, "de helft
van het werk"). Vergelijk concept, stelling, bouwstap, compleet en
onderzoek.

**Voorbeelden.** Swaps-tabel `n` tegen stelling `n − 1`. Bouwstap leert
`lijst[1:]`, compleet loopt de hele lijst door. Concept "de helft van het
werk", stelling "evenveel vergelijkingen".

**Test.** Alleen de uitvoercontrole vangt de getallen die in code staan.

## Iets nieuws zonder uitleg, of drie nieuwe dingen tegelijk

**Herkennen.** Onderstreep per bouwstap elk stukje syntax dat je nog niet
had gezien. Meer dan één: te veel. Nul uitleg en nul link: een bevinding.
Controleer of de voorkennis-cursus het wel behandelt; `enumerate` stond in
drie hoofdstukken en in geen enkele python-les.

**Test.** De conceptenkaart-test (`voorkennis.test.ts`) bewaakt dat elke
`<Voorkennis>`-link bestaat en terugwijst, niet dat de link er is.

## Fouten-pagina met de verkeerde fouten

**Herkennen.** Voor elke fout op de pagina: waar in dit hoofdstuk maak je
hem? Staat hij twee keer (dezelfde oorzaak met een andere kop)? En de fout
die jij zelf maakte tijdens het doorlopen, staat die erbij?

**Voorbeelden.** `range(len(lijst) + 1)` in lineair zoeken, nergens
geschreven. Selection sort: fout 1 en fout 3 waren allebei "zoeken vanaf
0".

## Scaffolding die de opdracht verdringt

**Herkennen.** Tel de regels van de startcode en de regels die de leerling
schrijft. Twintig tot veertig regels matplotlib rond drie regels opdracht,
een grafiek van "aantal matches per test": de opdracht is niet meer de
opdracht. Let ook op variabelen die de scaffolding overschrijft (`for n in
namen` na `n = 100`).

## Samenvatting aan het eind

**Herkennen.** Elke kop na de laatste opdracht die niets nieuws zegt: "Een
korte reflectie", "Kortom", "Wat je nu kunt".

**Test.** De stijlregel `samenvatting` in `packages/shared/stijl.js`,
sinds PR #64 ook voor "reflectie".

## Kleine wringers die opvallen omdat de rest consequent is

Pijl in één "Door naar" en een punt in de andere; "[stellingen]" tegenover
"[de stellingen]"; "gesorteerd!" in een tekstblok; "trivially",
"bijna sorted"; "de groene elementen" in een blok zonder kleur; een woord
dat net verkeerd is ("achterstand" voor de staart van een lijst). Elk
apart onbelangrijk; samen het verschil tussen een les die af voelt en een
die dat niet doet. Meld ze als één groep.
