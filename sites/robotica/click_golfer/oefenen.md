---
sidebar_position: 6.5
---
import Blokken from '@site/src/components/Blokken';
import andereSensor from './blokken/oefenen-andere-sensor.json';
import tweeSensoren from './blokken/oefenen-twee-sensoren.json';
import welkeSensor from './blokken/oefenen-welke-sensor.json';
import andereServo from './blokken/oefenen-andere-servo.json';
import omDeBeurt from './blokken/oefenen-om-de-beurt.json';
import gespiegeld from './blokken/oefenen-gespiegeld.json';
import eigenServo from './blokken/oefenen-eigen-servo.json';
import gekruist from './blokken/oefenen-gekruist.json';
import allebei from './blokken/oefenen-allebei.json';
import standPerSensor from './blokken/oefenen-stand-per-sensor.json';

# Oefenen met twee sensoren en twee servo's

Met één sensor en één servo ziet je robot een bal en slaat hij hem weg. Met twee van elk kan hij meer: hij ziet wáár de bal ligt, en hij kiest welke servo slaat. Zo leer je de sensor en de servo goed kennen, voordat je de Lego eromheen bouwt.

Je docent zegt of er voor jou een tweede sensor en een tweede servo klaarliggen. Je sluit ze niet allebei tegelijk aan. Eerst komt er een sensor bij, dan een servo, en pas aan het eind gebruik je ze samen. Heb je alleen een tweede sensor? Doe dan alleen het deel [Een tweede sensor](#een-tweede-sensor). Heb je alleen een tweede servo? Doe dan alleen het deel [Een tweede servo](#een-tweede-servo).

Elk deel begint met een kleine stap. Oefening 8, de laatste, is een puzzel.

## Een tweede sensor

De servo blijft er één, op **D9**. Er komt alleen een sensor bij.

### Aansluiten

Zet je robot uit met de knop **ON/OFF**. De eerste sensor blijft op **A0** en de servo op **D9**, zoals bij [de IR-sensor](ir-sensor) en [de servo](servo). De tweede sensor komt op de rij van A1 van het [shield](microcontroller):

| Pin van de tweede sensor | Komt op |
|---|---|
| **VCC** (rode draad) | 5V |
| **GND** (zwarte draad) | GND |
| **A0** (oranje draad) | het signaal van **A1**: het pinnetje het dichtst bij de naam A1/D15 |

Let op: op de sensor zelf heet de pin nog steeds **A0**. Dat is de naam van het pootje op de sensor. De draad gaat op het shield naar **A1**.

Zit alles vast? Zet je robot dan weer aan met **ON/OFF**.

In het blok **Lees anapin** kies je zelf welke sensor je robot leest. Klik op A0, en kies **A1** in het lijstje.

### Oefening 1: een andere sensor

Pak je programma van [Zie de bal, sla de bal](bal-slaan). Je verandert maar één ding: klik in **Lees anapin** op A0 en kies **A1**.

<Blokken programma={andereSensor} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: als Lees anapin A1 kleiner is dan 300, dan Servo 9 op 0, duurt 500 ms, Servo 9 op 90, duurt 2000 ms." />

<Voorspel vraag="Welke sensor laat de servo nu slaan?">
  <Keuze uitleg="Je robot leest alleen de pin die in Lees anapin staat. Daar staat nu A1, dus naar de sensor op A0 kijkt hij niet meer.">De sensor op A0, net als eerst</Keuze>
  <Keuze goed uitleg="In Lees anapin staat A1. Daar zit de draad van de tweede sensor.">De tweede sensor, op A1</Keuze>
  <Keuze uitleg="Er staat maar één blok Lees anapin in je programma, en daarin staat A1. Een sensor die je robot niet leest, telt niet mee.">Allebei, want er zitten nu twee sensoren op je robot</Keuze>
  <Uitleg>

De tweede sensor, op **A1**. Je robot leest alleen de pin die in **Lees anapin** staat. Een bal voor de eerste sensor doet nu niets.

  </Uitleg>
</Voorspel>

Klik op **Upload naar robot**. Leg de bal eerst voor de ene sensor, en dan voor de andere. Klopt je voorspelling? Slaat de servo niet, of slaat hij steeds? Dan past de grens uit je programma niet bij deze sensor. In de volgende oefening meet je dat.

### Oefening 2: twee sensoren tegelijk

Om te zien wat twee sensoren meten, zet je allebei hun getallen op het scherm. Daarvoor pak je nu het andere blok **Toon op scherm** uit **Actuatoren**: het blok met een `=` erin. In het eerste vakje typ je de naam van de sensor. In het tweede vakje komt **Lees anapin**.

<Blokken programma={tweeSensoren} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: Toon op scherm 'A0' = Lees anapin A0, Toon op scherm 'A1' = Lees anapin A1, en duurt 500 ms." />

<Voorspel vraag="Wat zie je op het scherm als je een bal voor de tweede sensor houdt?">
  <Keuze goed uitleg="Het tweede blok Toon op scherm leest A1, en daar zit de tweede sensor. De eerste sensor ziet de bal niet.">Alleen het getal achter `A1 =` gaat omlaag</Keuze>
  <Keuze uitleg="Elk blok Lees anapin leest zijn eigen pin. De sensor op A0 ziet de bal niet, dus zijn getal blijft ongeveer gelijk.">Allebei de getallen gaan omlaag</Keuze>
  <Keuze uitleg="Een bal voor de sensor maakt het getal lager, net als bij de IR-sensor.">Het getal achter `A1 =` gaat omhoog</Keuze>
  <Uitleg>

Er komen steeds twee regels bij, bijvoorbeeld `A0 = 600` en `A1 = 580`. Houd je de bal voor de tweede sensor, dan gaat alleen het getal achter `A1 =` omlaag. Het getal van A0 blijft ongeveer gelijk.

  </Uitleg>
</Voorspel>

Klik op **Upload naar robot** en open het scherm met de knop **Toon output op scherm**. Klopt je voorspelling?

Onderzoek nu hoe ver elke sensor kijkt. Schuif de bal langzaam naar een sensor toe. Bij welke afstand gaat het getal omlaag? Schrijf voor elke sensor drie dingen op: het getal zonder bal, het getal met bal, en de afstand waarop hij de bal ziet.

Twee sensoren van dezelfde soort geven vaak niet precies hetzelfde getal. Kies daarom voor elke sensor een eigen grens. In de voorbeelden hieronder is de grens van **A0** 300 en die van **A1** 350. Gebruik jouw eigen getallen.

#### Zelf maken

Laat het scherm `bal bij A0` tonen als de sensor op A0 de bal ziet, en `bal bij A1` als de sensor op A1 hem ziet.

<details>
<summary>Tip</summary>

Je hebt twee keer **als … dan** nodig, onder elkaar in **herhaal voor altijd**. Het werkt net als bij [stap 2 van de IR-sensor](ir-sensor#stap-2-reageren-op-de-bal). In het ene blok staat **Lees anapin A0**, in het andere **Lees anapin A1**. Voor deze zinnen neem je weer het blok **Toon op scherm** met één vakje.

</details>

<details>
<summary>Antwoord</summary>

<Blokken programma={welkeSensor} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: als Lees anapin A0 kleiner is dan 300, dan Toon op scherm 'bal bij A0'. Als Lees anapin A1 kleiner is dan 350, dan Toon op scherm 'bal bij A1'. Daarna duurt 500 ms." />

Houd je een bal voor allebei de sensoren, dan zie je allebei de zinnen.

</details>

### Oefening 3: alleen als ze hem allebei zien

Zet de twee sensoren vlak naast elkaar, zodat één bal voor allebei kan liggen. Begin met je programma van oefening 1. De servo op **D9** slaat nu alleen als de sensor op **A0** én de sensor op **A1** de bal zien. Ziet maar één sensor de bal, dan gebeurt er niets.

Daarvoor heb je een nieuw blok nodig: **en**, uit de groep **Getal blokken**. Het heeft twee gaten. In elk gat past een vergelijking, en het blok klopt alleen als ze allebei kloppen.

<details>
<summary>Tip</summary>

In het gat achter **als** staat nog de vergelijking met **Lees anapin A1**. Sleep die eerst uit het gat en leg hem even opzij. Sleep dan het blok **en** in het lege gat. Pak nog een vergelijkblok uit **Getal blokken**. Het staat eerst op `1 = 1`: klik op het **`=`** en kies **`<`**. Zet daarin **Lees anapin A0** en je grens voor A0. Zet in het linkergat van **en** de vergelijking met **Lees anapin A0**, en in het rechtergat die met **Lees anapin A1**.

</details>

<details>
<summary>Antwoord</summary>

<Blokken programma={allebei} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: als Lees anapin A0 kleiner is dan 300 en Lees anapin A1 kleiner is dan 350, dan Servo 9 op 0, duurt 500 ms, Servo 9 op 90, duurt 2000 ms." />

</details>

<details>
<summary>Onderzoek: klik in het blok op en, en kies of. Wat doet je robot nu?</summary>

Hij slaat al als één van de twee sensoren de bal ziet. Zien ze hem allebei, dan slaat hij ook.

</details>

### Oefening 4: een stand per sensor

Je hebt nog één nieuw blok nodig. In de groep **Denk stappen** staan twee blokken **als**. Het tweede heeft onderaan nog een gat, met **anders** ervoor: dat is **als … dan … anders**. Klopt de vergelijking, dan doet je robot wat achter **dan** staat. Klopt hij niet, dan doet hij wat achter **anders** staat.

Begin met een leeg programma: het Leaphy-blok met alleen **herhaal voor altijd** erin. Laat de servo op **D9** aanwijzen waar de bal ligt:

- ligt de bal bij de sensor op **A0**, dan draait de servo naar 45°;
- ligt hij bij **A1**, dan gaat de servo naar 135°;
- zonder bal staat de servo op 90°.

<details>
<summary>Tip</summary>

Je hebt twee blokken **als … dan … anders** nodig. Het eerste kijkt naar A0. Zet het tweede in het gat achter **anders** van het eerste: dat kijkt naar A1.

</details>

<details>
<summary>Antwoord</summary>

<Blokken programma={standPerSensor} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: als Lees anapin A0 kleiner is dan 300, dan Servo 9 op 45, anders: als Lees anapin A1 kleiner is dan 350, dan Servo 9 op 135, anders Servo 9 op 90." />

Ziet A0 geen bal, dan gaat je robot naar **anders**. Daar kijkt hij naar A1. Ziet A1 ook geen bal, dan komt hij bij het laatste **anders**, en dat is 90°.

Hier staat geen **duurt** in. Dat hoeft niet: zolang de bal blijft liggen, krijgt de servo steeds dezelfde stand.

</details>

<Voorspel soort="Onderzoek" vraag="Je legt een bal voor allebei de sensoren. Waar wijst de servo?">
  <Keuze goed uitleg="A0 staat in het eerste als. Ziet die sensor de bal, dan komt je robot niet bij anders.">Naar 45°</Keuze>
  <Keuze uitleg="Naar A1 kijkt je robot alleen in de anders-tak. Ziet A0 de bal, dan komt hij daar niet.">Naar 135°, want A1 komt als laatste</Keuze>
  <Keuze uitleg="90° is de stand voor als geen van de twee sensoren de bal ziet. Hier zien ze hem allebei.">Naar 90°, want hij kan niet kiezen</Keuze>
  <Uitleg>

Naar 45°. Je robot kijkt eerst naar A0. Klopt dat, dan doet hij wat achter **dan** staat en slaat hij **anders** over. Naar A1 kijkt hij dan niet meer.

  </Uitleg>
</Voorspel>

## Een tweede servo

Nu komt er een servo bij. De sensoren mogen blijven zitten.

### Aansluiten

Zet je robot uit met de knop **ON/OFF**. De eerste servo blijft op **D9**. De tweede servo komt op de rij van D10:

| Draad van de tweede servo | Komt op |
|---|---|
| bruin | GND |
| rood | 5V |
| oranje | het signaal van **D10**: het pinnetje het dichtst bij de naam D10 |

Zit alles vast? Zet je robot dan weer aan met **ON/OFF**.

Een nieuw blok **Servo** staat in Easybloqs eerst op **Servo 2 op 90**. Voor de tweede servo klik je op de 2 en kies je **10**.

### Oefening 5: een andere servo

Pak het programma Heen en weer van [de servo](servo). Je verandert alleen het pinnummer: klik in allebei de blokken **Servo** op de 9 en kies **10**.

<Blokken programma={andereServo} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: Servo 10 op 0, duurt 1000 ms, Servo 10 op 90, duurt 1000 ms." />

<Voorspel vraag="Welk asje draait nu heen en weer?">
  <Keuze uitleg="Je robot stuurt alleen de servo aan waarvan het nummer in het blok staat. In dit programma staat nergens meer Servo 9.">Het asje op D9, want die servo zat er eerst</Keuze>
  <Keuze goed uitleg="In allebei de blokken Servo staat 10. Daar zit de oranje draad van de tweede servo.">Het asje op D10</Keuze>
  <Keuze uitleg="Er staat alleen Servo 10 in het programma. De servo op D9 krijgt geen bericht.">Allebei de asjes, om de beurt</Keuze>
  <Uitleg>

Het asje op **D10**. Het draait naar 0°, wacht een seconde, en gaat terug naar 90°. De servo op D9 krijgt geen bericht en blijft staan.

  </Uitleg>
</Voorspel>

Klik op **Upload naar robot** en kijk of je voorspelling klopt.

### Oefening 6: twee servo's om de beurt

Dit programma laat eerst de servo op **D9** draaien, en daarna die op **D10**.

<Blokken programma={omDeBeurt} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: Servo 9 op 0, duurt 1000 ms, Servo 9 op 90, duurt 1000 ms, Servo 10 op 0, duurt 1000 ms, Servo 10 op 90, duurt 1000 ms." />

<Voorspel vraag="Bewegen de twee asjes ooit tegelijk?">
  <Keuze uitleg="Twee servo's kunnen wel tegelijk bewegen, maar hier staat tussen elke twee blokken Servo een duurt. Je robot wacht dus steeds voordat het volgende blok aan de beurt is.">Ja, het zijn twee servo's, dus ze draaien samen</Keuze>
  <Keuze goed uitleg="Na elk blok Servo wacht je robot eerst. De servo op D10 is pas aan de beurt als die op D9 klaar is.">Nee, ze bewegen om de beurt</Keuze>
  <Keuze uitleg="Na de blokken Servo 9 komen ook twee blokken Servo 10. Als D9 klaar is, is D10 aan de beurt.">Alleen het asje op D9 beweegt</Keuze>
  <Uitleg>

Nee. Eerst draait het asje op D9 naar 0° en terug naar 90°. Daarna doet het asje op D10 hetzelfde. Tussen elke twee blokken **Servo** staat een **duurt**, dus ze zijn om de beurt.

  </Uitleg>
</Voorspel>

Klik op **Upload naar robot** en kijk of je voorspelling klopt.

#### Zelf maken: gespiegeld

Leg de twee servo's naast elkaar, op dezelfde manier. Laat ze nu tegelijk bewegen, als in een spiegel: gaat de servo op D9 naar 45°, dan gaat die op D10 naar 135°. Na een seconde draaien ze om: D9 naar 135° en D10 naar 45°.

<details>
<summary>Tip</summary>

Zet de twee blokken **Servo** direct onder elkaar, zonder **duurt** ertussen. Dan bewegen ze tegelijk. Pas daarna wacht je robot een seconde.

</details>

<details>
<summary>Antwoord</summary>

<Blokken programma={gespiegeld} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: Servo 9 op 45, Servo 10 op 135, duurt 1000 ms, Servo 9 op 135, Servo 10 op 45, duurt 1000 ms." />

Tussen **Servo 9** en **Servo 10** staat geen **duurt**. Het zijn twee verschillende servo's, dus ze zitten elkaar niet in de weg. Tussen twee standen van dezelfde servo staat wel een **duurt**.

</details>

## Twee sensoren en twee servo's

Hiervoor heb je de tweede sensor én de tweede servo nodig. Nu gebruik je ze samen.

### Oefening 7: elke sensor zijn eigen servo

Ziet de sensor op **A0** een bal, dan slaat de servo op **D9**. Ziet de sensor op **A1** een bal, dan slaat de servo op **D10**. Slaan gaat zoals bij [Zie de bal, sla de bal](bal-slaan): uithalen naar 0°, 500 ms wachten, terugslaan naar 90°, en 2000 ms wachten. Gebruikte je bij de servo 10° in plaats van 0°? Doe dat hier ook.

<details>
<summary>Tip</summary>

Begin met het programma van [Zie de bal, sla de bal](bal-slaan). Daar staat één **als … dan** in, en je hebt er twee nodig. Klik met de rechtermuisknop op het woord **als** en kies **Dupliceren**. Dan krijg je een kopie met alle blokken erin. Zet die kopie onder de eerste. Kies daarin bij **Lees anapin** de pin **A1**, typ je grens voor A1, en klik in de blokken **Servo** op de 9 en kies **10**.

</details>

<details>
<summary>Antwoord</summary>

<Blokken programma={eigenServo} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: als Lees anapin A0 kleiner is dan 300, dan Servo 9 op 0, duurt 500 ms, Servo 9 op 90, duurt 2000 ms. Daarna: als Lees anapin A1 kleiner is dan 350, dan Servo 10 op 0, duurt 500 ms, Servo 10 op 90, duurt 2000 ms." />

</details>

<Voorspel soort="Onderzoek" vraag="Je legt een bal voor A0, en meteen daarna een voor A1. Slaat de servo op D10 meteen?">
  <Keuze uitleg="Twee servo's kunnen wel tegelijk bewegen, maar je robot doet de blokken een voor een. Hij is nog bezig met het eerste als … dan.">Ja, elke servo heeft zijn eigen sensor</Keuze>
  <Keuze goed uitleg="Eerst slaat de servo op D9, met daarna duurt 2000 ms. Pas dan kijkt je robot naar A1.">Nee, pas na ruim twee seconden</Keuze>
  <Keuze uitleg="Je robot kijkt wel naar A1, alleen later. Ligt de bal er dan nog, dan slaat de servo op D10.">Nee, de servo op D10 slaat helemaal niet</Keuze>
  <Uitleg>

Nee. Je robot doet de blokken in **herhaal voor altijd** een voor een. Hij slaat eerst met de servo op D9, en wacht dan 2000 ms. Pas daarna kijkt hij naar A1. De servo op D10 slaat dus pas na ruim twee seconden.

  </Uitleg>
</Voorspel>

### Oefening 8: gekruist

Nu ruil je de servo's om. Ziet de sensor op **A0** een bal, dan slaat de servo op **D10**. Ziet de sensor op **A1** een bal, dan slaat de servo op **D9**.

<details>
<summary>Tip</summary>

Begin met je programma van oefening 7. Er hoeft geen blok bij en geen blok af. In elk **als … dan** staan twee blokken **Servo**: kijk welk pinnummer erin staat.

</details>

<details>
<summary>Antwoord</summary>

<Blokken programma={gekruist} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: als Lees anapin A0 kleiner is dan 300, dan Servo 10 op 0, duurt 500 ms, Servo 10 op 90, duurt 2000 ms. Daarna: als Lees anapin A1 kleiner is dan 350, dan Servo 9 op 0, duurt 500 ms, Servo 9 op 90, duurt 2000 ms." />

Je verandert vier pinnummers: twee keer 9 in 10, en twee keer 10 in 9.

</details>

<Voorspel soort="Onderzoek" vraag="De sensor op A0 en de servo op D9 liggen links, A1 en D10 rechts. Je legt de bal links. Welk asje draait?">
  <Keuze uitleg="De servo naast de bal hoort nu bij de andere sensor. In het als-blok van A0 staat Servo 10.">Het linker asje, op D9</Keuze>
  <Keuze goed uitleg="De linker sensor op A0 ziet de bal, en in zijn als-blok staat Servo 10.">Het rechter asje, op D10</Keuze>
  <Keuze uitleg="Er ligt alleen links een bal, dus alleen het als-blok van A0 klopt.">Allebei</Keuze>
  <Uitleg>

Het asje rechts, op D10. De linker sensor ziet de bal, en de rechter servo slaat.

  </Uitleg>
</Voorspel>

## Er gaat iets mis

<Probleem titel="Er beweegt maar één servo, terwijl je er twee aanstuurt.">

**Oorzaak:** in alle blokken **Servo** staat hetzelfde pinnummer. Je programma stuurt dan steeds dezelfde servo aan, en de servo op D10 krijgt nooit een bericht.

**Oplossing:** klik in het blok op het pinnummer en kies 10. Kijk ook of de oranje draad van de tweede servo op het signaal van **D10** zit.

**Zelf vinden:** tel in je programma hoe vaak er **Servo 9** staat en hoe vaak **Servo 10**.

</Probleem>

<Probleem titel="Met een bal voor de eerste sensor gaan allebei de getallen omlaag.">

**Oorzaak:** in het tweede blok **Lees anapin** staat nog A0. Dan lees je twee keer de eerste sensor, ook al heb je er `A1` voor getypt. Een bal voor de tweede sensor verandert dan niets.

**Oplossing:** klik in het tweede blok **Lees anapin** op A0 en kies A1.

</Probleem>

<Probleem titel="Het getal achter A1 = verandert niet als je een bal voor de tweede sensor houdt.">

**Oorzaak:** de oranje draad van de tweede sensor zit niet op het signaal van A1, maar op een andere rij of op een ander pinnetje van de rij van A1. Op de sensor heet die pin A0, en daardoor zoek je de goede plek op het shield makkelijk op de verkeerde rij.

**Oplossing:** zet je robot uit, en zet de oranje draad op het signaal van **A1**: het pinnetje het dichtst bij de naam A1/D15.

**Zelf vinden:** houd de bal voor de eerste sensor. Gaat het getal achter `A1 =` dan ook omlaag? Dan zit de fout in je programma, zoals bij de kaart hierboven.

</Probleem>

<Probleem titel="De ene sensor ziet de bal wel, de andere niet.">

**Oorzaak:** twee sensoren geven niet precies hetzelfde getal. Een grens die bij de ene sensor past, kan bij de andere te laag zijn.

**Oplossing:** geef elke sensor zijn eigen grens. Zet het programma van oefening 2 terug en schrijf voor elke sensor het getal met en zonder bal op. Kies voor elke sensor een grens die daar netjes tussenin ligt.

</Probleem>

<Probleem titel="Als de twee servo's tegelijk bewegen, trillen ze of begint je robot opnieuw.">

**Oorzaak:** twee servo's samen vragen meer stroom dan de usb-kabel kan geven.

**Oplossing:** geef je robot stroom via de aansluiting op het shield, met de knop **ON/OFF** aan. Vraag je docent welke adapter of batterij erbij hoort.

**Zelf vinden:** laat de servo's om de beurt bewegen, zoals in oefening 6. Gaat het dan wel goed, dan lag het aan de stroom.

</Probleem>

<Voorspel soort="Controlevraag" vraag="Bij de oranje draad van de tweede sensor staat op de sensor A0. Welke pin kies je in het blok Lees anapin voor die sensor?">
  <Keuze uitleg="A0 is de naam van het pootje op de sensor. Je robot leest niet de sensor, maar de pin van het shield waar de draad op zit.">**A0**, want dat staat op de sensor</Keuze>
  <Keuze goed uitleg="De draad zit op het shield op het signaal van A1, en die pin leest je robot.">**A1**</Keuze>
  <Keuze uitleg="Je robot zoekt de sensor niet zelf. Hij leest alleen de pin die jij in Lees anapin kiest. Kies je A0, dan leest hij de eerste sensor.">Dat maakt niet uit, de robot vindt de sensor zelf</Keuze>
  <Uitleg>

**A1**. De naam op de sensor is de naam van het pootje. Je robot leest de pin van het shield waar de draad op zit, en dat is het signaal van A1.

  </Uitleg>
</Voorspel>

Klaar met oefenen? Zet je robot uit met **ON/OFF** en haal de tweede sensor en de tweede servo weer los. Je Golfer gebruikt alleen de sensor op **A0** en de servo op **D9**.

Ken je de sensor en de servo nu goed? Dan [bouw je de Golfer van Lego](bouwen).
