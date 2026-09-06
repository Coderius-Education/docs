---
name: les-opknappen
description: Knap een hoofdstuk, tutorial of les in één keer op, in de juiste volgorde, door eerst de skill `leerling-doorloop` aan te roepen (het materiaal doorlopen zoals een leerling dat doet, bevindingenlijst op ernst, fixes met tests) en daarna de skill `menselijk-schrijven` (de tekst laten klinken als een docent in plaats van een taalmodel). Gebruik deze skill zodra iemand vraagt om een hoofdstuk "op te knappen", "af te maken", "klaar te maken", "helemaal na te lopen", "te reviewen én te herschrijven", "van a tot z door te nemen", "publiceerklaar te maken" of "de hele behandeling te geven", of om beide skills achter elkaar te doen, ook als de namen van die skills niet vallen. Vraagt iemand alleen om een review of alleen om de toon, gebruik dan de losse skill.
---

# Een les opknappen

Twee skills, in deze volgorde en niet andersom:

1. **`leerling-doorloop`**: het materiaal doorlopen zoals een leerling dat
   doet, de bevindingen op ernst, en de fixes met een test per patroon.
2. **`menselijk-schrijven`**: de tekst laten klinken als een docent naast
   de leerling.

De volgorde is de kern van deze skill. De doorloop verandert inhoud:
stellingen worden vervangen, een fouten-pagina krijgt een andere derde
fout, een bouw-zelf-pagina wordt herschreven. Wie eerst de toon doet en
dan de inhoud, doet de toon twee keer, en de tweede keer vergeet hij de
helft. Andersom raakt de toonpas alleen tekst die af is.

Roep de twee skills aan met de Skill-tool; hun eigen instructies gelden
onverkort. Wat hieronder staat is alleen de lijm: de wachtmomenten, de
commitgrenzen en wat je aan het eind rapporteert.

## Stap 1: doorlopen

Roep `leerling-doorloop` aan op het hoofdstuk. Die skill levert een
bevindingenlijst en wacht daarna op de opdrachtgever; dat wachten hoort
erbij. De lijst is het moment waarop de opdrachtgever bepaalt wat er
gebeurt, en een toonpas over tekst die daarna nog verandert is verspilde
moeite.

Heeft de opdrachtgever vooraf gezegd dat alles mag ("pak alles op", "je
hoeft niet te wachten"), dan sla je het wachten over maar niet de lijst:
die komt in het eindrapport, zodat te zien is wat er is opgepakt en
waarom. Twijfel je bij een bevinding of hij een fix of een redactionele
keuze is (een kop die anders zou moeten, een stelling vervangen door een
andere), kies dan de fix die het minst aan de bedoeling van de auteur
verandert en zeg dat in het rapport.

## Stap 2: de fixes

In de volgorde die de doorloop voorschrijft: blokkeert, verwart, dan per
patroon één commit met de fixes én de test die het patroon vastpint, dan
de wringers als veegronde. Elke commit noemt de bevinding die hij oplost.
Na elke groep draai je wat het repo voorschrijft (`pnpm test`, `pnpm
tekst --streng`, het blokken-script van de site) en pas als dat groen is
ga je verder.

Verander in deze stap niets aan de toon. Een zin die je herschrijft omdat
de inhoud fout was, schrijf je zoals de rest van de pagina nu klinkt, ook
als dat gegenereerd aanvoelt. Dat komt in stap 3, over de hele pagina
tegelijk.

## Stap 3: de toon

Roep `menselijk-schrijven` aan op elke pagina van het hoofdstuk, pas nu.
Die skill raakt geen code, getallen, koppen of links aan en voegt geen
inhoud toe; alles wat inhoudelijk moest is al in stap 2 gebeurd, dus wat
de toonpas nog tegenkomt aan inhoudelijke twijfel gaat in het rapport,
niet in de tekst.

Eén commit voor de toon van het hele hoofdstuk, los van de fixes. Zo kan
een reviewer de inhoudswijzigingen (met hun tests) los beoordelen van de
stijlkeuzes, en een toonwijziging die niet bevalt terugdraaien zonder de
fixes te verliezen.

## Stap 4: het rapport

Eén rapport aan het eind, in deze volgorde:

1. De bevindingenlijst uit stap 1, met per bevinding wat ermee is gebeurd
   (opgelost in commit …, bewust gelaten omdat …, aan de auteur omdat …).
2. De tests die erbij zijn gekomen of uitgebreid, en wat ze vastpinnen.
3. De toonpas: het ervoor/erna-overzicht van `menselijk-schrijven`, één
   tabel voor het hele hoofdstuk, en wat er bewust is blijven staan.
4. Wat je hebt gezien maar niet hebt aangeraakt, met de reden.
5. De verificatie: welke controles zijn gedraaid en wat ze zeiden.

Het rapport is korter dan de som van de twee deelrapporten. Een lezer
die alleen dit rapport ziet moet kunnen beoordelen of het hoofdstuk klaar
is om te mergen.
