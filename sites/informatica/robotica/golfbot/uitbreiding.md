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
- de **RGB-led trio** van Leaphy: een bordje met een lampje dat rood, groen en blauw kan branden, met vier pinnetjes;
- drie losse draadjes, en je docent, die zegt waar de tweede sensor op de baan vast komt.

### Waarom niet het blok Led?

In **Actuatoren** staat een blok **Led**, met Rood, Groen en Blauw. Dat blok hoort bij de RGB-led trio, maar je kunt het hier niet gebruiken. Het stuurt de pinnen **D11** (rood), **D10** (groen) en **D9** (blauw) aan, met de min op **D8**. Op D9 zit je servo al. Daarom sluit je het lampje met draadjes aan, en laat je blauw weg.

### Aansluiten

Zet je robot uit met **ON/OFF**.

1. Sluit de tweede sensor aan op de rij van **A1**, net als de eerste bij [de IR-sensor](site:robotica/golfbot/ir-sensor): VCC op 5V, GND op GND, en de oranje draad op het signaal van **A1**. De eerste sensor blijft op A0.
2. Kijk welk pinnetje van het lampje rood is, welk groen en welk de min. Meestal staat het op het bordje; zie je het niet, vraag het dan je docent.
3. Sluit rood aan op het signaal van **D11**, groen op het signaal van **D10**, en de min op GND. Het blauwe pinnetje sluit je niet aan.
4. Zet de tweede sensor vast op de plek waar de bal na een hole in one blijft liggen. Die plek verschilt per baan: je docent zegt waar hij komt.

Zet je robot daarna weer aan met **ON/OFF**.

### Een grens voor de tweede sensor

De tweede sensor heeft een eigen grens nodig, want hij kijkt naar een andere plek. Neem het programma uit stap 1 van [de IR-sensor](site:robotica/golfbot/ir-sensor), dat het getal op je scherm toont. Klik in **Lees anapin** op **A0** en kies **A1**. Schrijf het getal op met de bal op zijn plek bij het gat, en zonder bal. Je grens ligt ertussenin.

### Het programma

Je bouwt verder op het programma uit [Zie de bal, sla de bal](site:robotica/golfbot/bal-slaan), met de eerste sensor op **A0** en de servo op **D9**.

1. Sleep uit **Denk stappen** het tweede blok **als**, dat met **anders**, in herhaal voor altijd, onder je eerste als … dan.
2. Zet in het gat achter **als** een vergelijkblok met **Lees anapin A1** `<` je nieuwe grens, net als bij de eerste sensor.
3. Sleep uit **Actuatoren** het blok **Zet PWM** in het gat bij **dan**. Een nieuw blok staat eerst op **Zet PWM 3 op 0**. Klik op de 3 en kies **10**, en typ **255** in plaats van 0: dan gaat groen aan.
4. Sleep nog een **Zet PWM** in het gat bij **anders**. Kies ook hier **10**, en laat de 0 staan: dan gaat groen uit.

<Blokken programma={holeInOne} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: als Lees anapin A0 kleiner is dan 300, dan Servo 9 op 0, duurt 500 ms, Servo 9 op 90, duurt 2000 ms. Daaronder: als Lees anapin A1 kleiner is dan 300, dan Zet PWM 10 op 255, anders Zet PWM 10 op 0." />

**Zet PWM 10 op 255** zet groen aan, **Zet PWM 10 op 0** zet het weer uit. Gebruik voor groen alleen 0 en 255. Een getal ertussen, zoals 100, werkt op D10 niet zolang de servo op D9 zit: die twee pinnen delen in de Arduino een klokje, en dat gebruikt de servo al.

Upload je programma en laat je Golfbot slaan. Gaat de bal in het gat, dan wordt het lampje groen.

<Voorspel soort="Controlevraag" vraag="De bal gaat in het gat en het lampje wordt groen. Dan haal je de bal eruit. Wat doet het lampje?">
  <Keuze uitleg="Het lampje volgt wat de tweede sensor nu ziet. Denk na over wat er in de anders-tak staat.">Het blijft groen, want er was een hole in one</Keuze>
  <Keuze goed uitleg="Zonder bal is het getal op A1 niet meer kleiner dan je grens. Dan doet je robot de anders-tak, en die zet groen op 0.">Het gaat uit</Keuze>
  <Keuze uitleg="Er staat nergens een duurt tussen aan en uit, dus het lampje knippert niet vanzelf.">Eerst knippert het een paar keer, dan gaat het uit</Keuze>
  <Uitleg>

Het lampje gaat uit. Je robot kijkt in herhaal voor altijd steeds opnieuw naar de tweede sensor. Ligt er geen bal meer, dan zet de anders-tak groen uit.

  </Uitleg>
</Voorspel>

<details>
<summary>Wil je meer?</summary>

Laat het lampje rood branden zolang er geen bal in het gat ligt: zet in de anders-tak ook **Zet PWM 11 op 255**, en in de dan-tak **Zet PWM 11 op 0**. Voor rood mag je elk getal van 0 tot 255 kiezen, want D11 deelt zijn klokje niet met de servo. Hoe groter het getal, hoe feller.

</details>

## Er gaat iets mis

<Probleem titel="Het lampje gaat nooit aan.">

**Oorzaak:** groen krijgt geen stroom. In **Zet PWM** staat een andere pin dan 10, of het groene pinnetje zit niet op het signaal van D10, of de min zit niet op GND.

**Zelf vinden:** zet in het Leaphy-blok, boven herhaal voor altijd, een **Zet PWM 10 op 255**, en upload. Blijft het lampje nu ook uit, dan ligt het aan de draadjes, en niet aan de sensor.

**Oplossing:** kies in **Zet PWM** pin **10**, en kijk of groen op het signaal van **D10** zit en de min op GND.

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

<Probleem titel="De arm trilt of doet raar sinds het lampje erbij is.">

**Oorzaak:** je gebruikt het blok **Led**. Dat stuurt ook D9 aan, en daar zit je servo.

**Oplossing:** haal het blok Led weg en gebruik **Zet PWM** op pin 10, zoals hierboven.

</Probleem>

Klaar? Laat je docent zien wat je Golfbot kan.
