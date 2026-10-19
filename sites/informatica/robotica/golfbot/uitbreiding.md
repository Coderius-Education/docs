---
sidebar_position: 10
---
import Blokken from '@site/src/components/Blokken';
import holeInOne from './blokken/hole-in-one.json';

# Kies een uitbreiding

Je Golfbot slaat de bal in het gat. Kies nu één uitbreiding: een eigen hoofd voor je robot, of een lampje dat oplicht bij een hole in one. Heb je daarna nog tijd, dan doe je de andere ook.

## Een eigen hoofd

Je Golfbot krijgt een hoofd dat je zelf ontwerpt en met een 3D-printer print. Elk hoofd is goed, zolang het op je Golfbot past.

1. Ontwerp het hoofd in **TinkerCAD**. Volg de uitleg op [MakerSpace – TinkerCAD](https://maken.wikiwijs.nl/220905/MakerSpace#!page-8481694).
2. Print je ontwerp met **FlashPrint**. Volg de uitleg op [MakerSpace – FlashPrint](https://maken.wikiwijs.nl/220905/MakerSpace#!page-8702784).

<details>
<summary>Tip</summary>

Bedenk eerst waar het hoofd vast komt, en meet hoe groot het daar mag zijn. Een hoofd dat de arm raakt, houdt hem tegen. Print liever eerst een klein proefje, voordat je het hele hoofd print.

</details>

## Een lampje voor een hole in one

Gaat de bal in het gat, dan wordt een lampje groen. Daarvoor heb je nodig:

- een tweede **IR-sensor**, die ziet of de bal in het gat ging;
- het **RGB-ledje** van Leaphy: een klein bordje met één lampje dat elke kleur kan maken;
- draadjes, en je docent, die zegt waar de tweede sensor op de baan vast komt.

### Aansluiten

Zet je robot uit met **ON/OFF**.

1. Sluit de tweede sensor aan op de rij van **A1**, net als de eerste bij [de IR-sensor](site:robotica/golfbot/ir-sensor): VCC op 5V, GND op GND, en de oranje draad op het signaal van **A1**. De eerste sensor blijft op A0.
2. Het ledje heeft drie pinnetjes: een voor 5V, een voor GND en een voor het signaal. Bij het signaal staat meestal **DIN** of **IN**. Sluit het signaal aan op het signaal van **D2**, en de andere twee op 5V en GND. Zie je niet welk pinnetje welk is, vraag het dan je docent.
3. Zet de tweede sensor vast op de plek waar de bal na een hole in one blijft liggen. Die plek verschilt per baan: je docent zegt waar hij komt.

Zet je robot daarna weer aan met **ON/OFF**.

### Een grens voor de tweede sensor

De tweede sensor heeft een eigen grens nodig, want hij kijkt naar een andere plek. Neem het programma uit stap 1 van [de IR-sensor](site:robotica/golfbot/ir-sensor), dat het getal op je scherm toont. Klik in **Lees anapin** op **A0** en kies **A1**. Schrijf het getal op met de bal op zijn plek bij het gat, en zonder bal. Je grens ligt ertussenin.

### Het programma

Je bouwt verder op het programma uit [Zie de bal, sla de bal](site:robotica/golfbot/bal-slaan), met de eerste sensor op **A0** en de servo op **D9**.

1. Klik op de groep **Actuatoren**. Onderaan staat het kopje **Led strip**: klik erop, dan zie je de blokken voor het ledje.
2. Sleep **Ledstrip - Stel in** in het Leaphy-blok, helemaal bovenaan, boven herhaal voor altijd. Er staat eerst Pin 0 en Leds 0. Klik op de getallen en typ bij Pin **2** en bij Leds **1**: je ledje zit op D2, en het is er één.
3. Sleep uit **Denk stappen** het tweede blok **als**, dat met **anders**, in herhaal voor altijd, onder je eerste als … dan.
4. Zet in het gat achter **als** een vergelijkblok met **Lees anapin A1** `<` je nieuwe grens, net als bij de eerste sensor.
5. Sleep **Ledstrip - Zet aan - Led** in het gat bij **dan**. Er staat eerst overal 0. Laat Led op 0 staan, en typ bij G **255**.
6. Sleep nog een **Ledstrip - Zet aan - Led** in het gat bij **anders**, en laat daar alles op 0 staan.

<Blokken programma={holeInOne} beschrijving="Leaphy, met daarin Ledstrip - Stel in Pin 2 Leds 1, en daaronder herhaal voor altijd. Daarin: als Lees anapin A0 kleiner is dan 300, dan Servo 9 op 0, duurt 500 ms, Servo 9 op 90, duurt 2000 ms. Daaronder: als Lees anapin A1 kleiner is dan 300, dan Ledstrip - Zet aan - Led 0 R 0 G 255 B 0, anders Ledstrip - Zet aan - Led 0 R 0 G 0 B 0." />

De R, G en B staan voor rood, groen en blauw. Elk getal gaat van 0 (uit) tot 255 (zo fel mogelijk), en samen maken ze de kleur: alleen G op 255 is groen, alles op 0 is uit. Led 0 is het eerste lampje, want de telling begint bij 0. Jouw ledje heeft er maar één.

Upload je programma en laat je Golfbot slaan. Gaat de bal in het gat, dan wordt het lampje groen.

<Voorspel soort="Controlevraag" vraag="De bal gaat in het gat en het lampje wordt groen. Dan haal je de bal eruit. Wat doet het lampje?">
  <Keuze uitleg="Het lampje volgt wat de tweede sensor nu ziet. Denk na over wat er in de anders-tak staat.">Het blijft groen, want er was een hole in one</Keuze>
  <Keuze goed uitleg="Zonder bal is het getal op A1 niet meer kleiner dan je grens. Dan doet je robot de anders-tak, en die zet alles op 0.">Het gaat uit</Keuze>
  <Keuze uitleg="Er staat nergens een duurt tussen aan en uit, dus het lampje knippert niet vanzelf.">Het knippert een paar keer en gaat dan uit</Keuze>
  <Uitleg>

Het lampje gaat uit. Je robot kijkt in herhaal voor altijd steeds opnieuw naar de tweede sensor. Ligt er geen bal meer, dan zet de anders-tak het lampje uit.

  </Uitleg>
</Voorspel>

<details>
<summary>Wil je meer?</summary>

Laat het lampje een feestje vieren: wissel groen af met een andere kleur, met een **duurt** ertussen. Of laat het rood branden zolang er geen bal in het gat ligt.

</details>

## Er gaat iets mis

<Probleem titel="Het lampje gaat nooit aan.">

**Oorzaak:** het ledje krijgt geen signaal. In **Ledstrip - Stel in** staat een andere pin dan D2, of Leds staat nog op 0, of de draad van het signaal zit niet op D2.

**Zelf vinden:** zet in het Leaphy-blok, direct onder **Ledstrip - Stel in**, een **Ledstrip - Zet aan - Led** met G op 255, en upload. Blijft het lampje nu ook uit, dan ligt het aan het ledje of de draden, en niet aan de sensor.

**Oplossing:** typ bij Pin **2** en bij Leds **1**, en kijk of het signaal van het ledje op het signaal van **D2** zit.

</Probleem>

<Probleem titel="Het lampje werkt, maar blijft uit als de bal in het gat ligt.">

**Oorzaak:** de tweede sensor ziet de bal niet. Hij kijkt naar de verkeerde plek, of je grens past niet bij die plek.

**Zelf vinden:** toon het getal van **A1** op je scherm, zoals bij de grens hierboven, en leg de bal in het gat. Wordt het getal kleiner dan je grens?

**Oplossing:** zet de sensor zo dat hij de bal ziet, en kies dan een nieuwe grens tussen het getal met en zonder bal.

</Probleem>

<Probleem titel="Het lampje is groen, terwijl er geen bal in het gat ligt.">

**Oorzaak:** je grens voor de tweede sensor is te hoog: het getal zonder bal is al kleiner dan de grens. Of in je tweede als-blok staat nog **A0**, en dan kijkt het lampje naar de bal bij de arm.

**Oplossing:** kijk of er in het tweede als-blok **Lees anapin A1** staat, en kies een grens die tussen het getal met en zonder bal ligt.

</Probleem>

Klaar? Laat je docent zien wat je Golfbot kan.
