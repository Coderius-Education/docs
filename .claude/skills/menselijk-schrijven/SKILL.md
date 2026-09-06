---
name: menselijk-schrijven
description: Herschrijf lestekst zodat hij klinkt als een docent die naast de leerling zit en niet als een brochure of een taalmodel, met behoud van inhoud, code, links en structuur. Gebruik deze skill zodra iemand vraagt om tekst "menselijker", "natuurlijker", "minder AI", "minder robotachtig", "minder gegenereerd", "warmer", "vlotter" of "leesbaarder" te maken, om "de AI-smaak eruit te halen", om een les "te redigeren" of "na te lopen op toon", of zegt dat een pagina "niet lekker leest" of "als ChatGPT klinkt", ook als het woord AI niet valt. Ook voor een nieuw geschreven les vóór hij live gaat, en na `pnpm stijl` als de meldingen weg zijn maar de tekst nog steeds gegenereerd aanvoelt. Niet voor spelling, structuur of feitelijke fouten; daar zijn `pnpm tekst` en de leerling-doorloop voor.
---

# Menselijk schrijven

`pnpm stijl` vangt de meetbare dingen: vulwoorden, superlatieven, formulaire
openers, lege overgangen, gedachtestreepjes, vet-overdaad, lange zinnen,
herhaalde zinsopeningen, een samenvatting aan het eind. Een pagina kan daar
schoon doorheen komen en nog steeds klinken als een brochure. Dat komt door
dingen die geen regex ziet: het ritme, de drietallen, het aankondigen van
wat je gaat zeggen, bullets die allemaal dezelfde vorm hebben, een terzijde
tussen haakjes na elke alinea. Deze skill gaat over dat laatste stuk.

De maat is één vraag: **zou een docent dit zo zeggen tegen een leerling van
vijftien die naast hem zit?** Een docent zegt niet "Twee antwoorden. Twee
keuzes." en niet "Het mooie is:". Hij zegt "je neemt het mee of niet, meer
smaken zijn er niet". Lees elke zin hardop in je hoofd; wat je niet zou
zeggen, schrijf je ook niet.

## Werkwijze

1. **Draai eerst `pnpm stijl --streng <bestand>`** en los de meldingen op.
   Dat is het mechanische deel; doe het vóór het handwerk, anders doe je het
   twee keer.
2. **Lees de hele pagina** voordat je iets verandert, ook de code en de
   uitklapblokken. De toon van een pagina zit in het geheel; wie zin voor
   zin herschrijft krijgt een pagina die overal een beetje anders klinkt.
3. **Markeer elke zin die in elke les had kunnen staan.** "Het slimme idee
   is", "Klinkt eenvoudig, maar", "Daarom hebben we een slimmer algoritme
   nodig": die zinnen zeggen niets over dít onderwerp. Elke zin die je
   overhoudt gaat over de rugzak, de kaarten, de lijst van deze pagina.
4. **Herschrijf met de zetten hieronder.** Per alinea, niet per zin: soms
   worden drie zinnen er één, soms wordt een lijstje lopende tekst.
5. **Laat staan wat van de auteur is.** Het beeld van de rugzak, de grap,
   de eigen formulering die net niet standaard is: dat is precies de
   menselijke stem die je zoekt. Menselijk is niet neutraal. Een pagina die
   na jou vlak en veilig klinkt is niet beter dan een die gegenereerd
   klinkt.
6. **Draai `pnpm stijl --streng` en `pnpm spel` opnieuw**, en als je een
   codeblok hebt aangeraakt (dat hoort niet, zie onder) het blokken-script
   van de site.
7. **Rapporteer** wat je hebt gedaan (zie onderaan).

## Wat je niet aanraakt

Code, uitvoerblokken, getallen, tabellen met data, links, frontmatter,
component-props, de markers in commentaar (`{/* niet-draaien: … */}`) en de
H2-koppen (die vormen de inhoudsopgave en soms een test). Je voegt ook
geen inhoud toe: een nieuw voorbeeldgetal ("item 4 en 5 wegen samen al
13") of een extra uitleg maakt de zin misschien concreter, maar het is een
inhoudswijziging die de auteur moet beoordelen. Een feitelijke fout die je
onderweg ziet los je niet stil op; die meld je apart, want een
toonwijziging en een inhoudswijziging horen niet in dezelfde commit.
Hetzelfde geldt voor een kop die niet meer dekt wat eronder staat, of een
"wij"-kop op een "je"-pagina: melden, niet veranderen. Een geciteerde
foutmelding herschrijf je nooit, ook niet als hij een uitroepteken heeft.

## De zetten

Elke zet met de reden, want de reden is wat je nodig hebt bij een geval
dat hier niet staat.

**Drietallen en staccato.** "Twee antwoorden. Twee keuzes. Vijf items,
32 combinaties." Een taalmodel houdt van korte fragmenten in reeksen van
drie; een mens praat in zinnen met een werkwoord. Maak er één zin van, of
twee van verschillende lengte. Hetzelfde geldt voor "snel, simpel en
krachtig": drie bijvoeglijke naamwoorden op een rij zijn bijna altijd twee
te veel.

**Aankondigen in plaats van zeggen.** "Het mooie is:", "Het slimme idee:",
"Belangrijk:", "Let op:" boven elke tweede alinea, "Klinkt eenvoudig,
maar". Dit zijn trompetjes voor de zin die erna komt. Haal het trompetje
weg en laat de zin zelf het werk doen; als de zin dat niet kan, is de zin
het probleem. Let op dat je er geen ander trompetje voor terugzet: "Het
handige daaraan:" is "Het mooie:" in een andere jas, en "Daarom hebben we
een slimmer algoritme nodig" is de verteller die zijn volgende paragraaf
aankondigt.

**Vet als nadruk-machine.** Vet is voor de eerste keer dat een term valt.
Zodra elke alinea drie vette woorden heeft, leest het oog eroverheen en
blijft er niets over om op te vallen. Haal alles weg behalve de kernterm
bij zijn introductie; `pnpm stijl` telt alleen de ergste alinea's.

**Het terzijde tussen haakjes.** "(Er bestaan varianten waar dat wél mag.)"
na elke alinea is een tic. Is het belangrijk, maak er een zin van. Is het
dat niet, haal het weg. Eén terzijde per pagina is genoeg.

**Symmetrische bullets.** Vier bullets die alle vier beginnen met een
werkwoord in de gebiedende wijs, alle vier even lang, alle vier eindigend
met een dubbele punt en een cursieve vraag: dat is een sjabloon, geen
uitleg. Varieer de vorm, of schrijf het als lopende tekst als de bullets
eigenlijk een redenering zijn ("eerst dit, en daarom dat").

**De retorische vraag als motor.** "Welke set neem je mee?" is prima, één
keer. Drie retorische vragen op een pagina, elk gevolgd door het antwoord,
is een presentatie. Stel de vraag alleen als de leerling hem echt even
zelf moet beantwoorden, en zet hem dan in een uitklapblok.

**Abstract vóór concreet.** "Het accumulator-patroon houdt een tussenstand
bij" en dan pas het voorbeeld: draai het om. Eerst de drie regels code of
het rugzak-voorbeeld, dan de naam. Een leerling die het voorbeeld heeft
gezien leest de definitie met betekenis (schrijfskills §3).

**Pijlen en symbolen in prose.** "Vijf items → 32 combinaties" hoort in
een tabel of in code, niet in een zin. In lopende tekst zijn het woorden:
"vijf items geven 32 combinaties".

**Engels dat geen vakterm is.** "Na deze track", "hiken", "de tabel-truc",
"trivially". Vakwoorden blijven Engels (`return`, bubble sort); de rest
wordt Nederlands. Een woord dat een docent niet in de klas zou zeggen,
hoort niet in de les.

**Ritme.** Een alinea van alleen zinnen van acht woorden klinkt als een
handleiding; een van alleen zinnen van dertig woorden als een
beleidsstuk. Wissel af, en laat de korte zin het punt maken dat de lange
zin heeft voorbereid.

**De verteller die zichzelf uitlegt.** "Maar eerst doen we het met pen en
papier, om te begrijpen wat het algoritme doet." De tweede helft van die
zin legt uit waarom de eerste helft er staat; dat doet een docent niet, die
zegt "pak pen en papier". Zinnen die de opbouw van de les beschrijven in
plaats van de inhoud te geven, kunnen bijna altijd korter of weg.

**Hedges waar de zaak vaststaat.** "In principe", "meestal", "over het
algemeen", "vaak" bij iets dat hier gewoon zo is. Zeg wat het is. Bewaar
de slag om de arm voor waar hij klopt, dan valt hij op.

## Het rapport

Geef na afloop een korte tabel met vijf tot tien representatieve zinnen,
ervoor en erna, met per rij één woord voor de zet (drietal, trompetje,
vet, terzijde, symmetrie, vraag, abstract, pijl, Engels, ritme, verteller,
hedge). Zeg wat `pnpm stijl` ervoor en erna meldde. Noem apart wat je hebt
laten staan omdat het van de auteur is, en wat je hebt gezien maar niet
aangeraakt (een feitelijke fout, een kop die anders zou moeten). Meer
voorbeelden per zet staan in `references/voorbeelden.md`; lees die als een
geval twijfelachtig is.
