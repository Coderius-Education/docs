---
sidebar_position: 4
---
import Blokken from '@site/src/components/Blokken';
import uitlezen from './blokken/sensor-uitlezen.json';
import balKlaar from './blokken/bal-klaar.json';
import SensorSimulator from '@site/src/components/SensorSimulator';

# De IR-sensor

Je Click Golfer moet zien of er een bal ligt. Dat doet de **IR-sensor**. Hij stuurt onzichtbaar licht naar voren en meet hoeveel daarvan terugkomt. Ligt er een bal voor, dan komt er meer licht terug, en dan wordt het getal van de sensor **lager**.

## Aansluiten

Zet je robot uit met de knop **ON/OFF**. Sluit de sensor dan aan op de rij van **A0** op het [shield](microcontroller):

| Pin van de sensor | Komt op |
|---|---|
| **VCC** (rode draad) | 5V |
| **GND** (zwarte draad) | GND |
| **A0** (oranje draad) | het signaal van **A0**: het pinnetje het dichtst bij de naam A0/D14 |

![Uitsnede van het schema: de blauwe sensor linksboven, met de rode draad naar 5V, de zwarte naar GND en de oranje naar het signaal van A0 op het shield. De pin D0 van de sensor blijft leeg.](@site/static/fritzing/click_golfer_sensor.png)

Op het plaatje loopt de oranje draad eerst een stukje langs de rij van A4, en gaat dan omhoog naar A0. Hij hoort alleen op het signaal van **A0**: de hoekjes in de draad zijn geen aansluitingen.

De sensor heeft ook een pin **D0**. Die laat je leeg. D0 geeft alleen "wel bal" of "geen bal". Op **A0** krijg je een getal, en dan kies je zelf vanaf welk getal er een bal ligt.

Let op: op het shield staat ook een D0, bij **D0/TX1**. Daar sluit je niets op aan. Over D0 en D1 van het shield gaat je programma via de usb-kabel naar de Arduino.

Zit alles vast? Zet je robot dan weer aan met **ON/OFF**.

## Stap 1: het getal uitlezen

Sleep eerst het blok **herhaal voor altijd** uit **Denk stappen** in het Leaphy-blok. Het doet alles wat erin staat steeds opnieuw. Zonder dat blok las je robot de sensor één keer, en daarna nooit meer.

Het blok **Lees anapin A0** vind je in de groep **Sensoren**. Daarmee lees je het getal van de sensor. **Toon op scherm** uit **Actuatoren** laat het getal zien: sleep het in **herhaal voor altijd**, en sleep **Lees anapin** op de plek van het tekstvakje. Neem het blok **Toon op scherm** met één vakje, zoals bij [je eerste programma](easybloqs).

Onder **Toon op scherm** komt **duurt 500 ms**, ook uit **Denk stappen**. Het laat de robot een halve seconde wachten, zodat je het getal kunt lezen. In Easybloqs heet het blok **Duurt**, en staat er eerst 1000 in: klik op het getal en typ 500. Achter het getal staat een keuzelijstje met ms, μs en s. Laat dat op **ms** staan.

<Blokken programma={uitlezen} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: Toon op scherm Lees anapin A0, en daarna duurt 500 ms." />

Klik op **Upload naar robot** en open het scherm met de knop **Toon output op scherm**, zoals bij [je eerste programma](easybloqs). Er verschijnt elke halve seconde een nieuw getal. Leg een bal voor de sensor en haal hem weer weg. Wordt het getal lager met een bal ervoor? Schrijf de twee getallen op: zonder bal en met bal.

<Voorspel soort="Controlevraag" vraag="Waarom staat Lees anapin A0 in een herhaal voor altijd?">
  <Keuze goed uitleg="Herhaal voor altijd laat je robot steeds opnieuw lezen. Zo merkt hij ook een bal die je later neerlegt.">Zodat de robot steeds opnieuw kijkt of er een bal ligt</Keuze>
  <Keuze uitleg="Hoe snel er een nieuw getal komt, bepaalt het blok duurt, niet herhaal voor altijd.">Zodat het getal sneller op het scherm komt</Keuze>
  <Keuze uitleg="De sensor meet wel steeds, maar je robot leest het getal alleen als hij bij Lees anapin komt. Het Leaphy-blok doet dat één keer.">Dat hoeft niet, de sensor meet zelf steeds</Keuze>
  <Uitleg>

Zonder herhaal leest de robot de sensor één keer, bij het aanzetten. Je wilt steeds opnieuw weten of er een bal ligt.

  </Uitleg>
</Voorspel>

## Een grens kiezen

Zonder bal geeft je sensor een hoog getal, met een bal een laag getal. Je robot moet dus weten vanaf welk getal er een bal ligt. Dat getal kies je zelf: het heet je **grens**. Is het getal op A0 kleiner dan je grens, dan ligt er een bal.

Hieronder oefen je dat zonder robot. Schuif met de muis of met je vinger, of klik op een schuifje en gebruik de pijltjestoetsen.

<SensorSimulator />

De getallen hier zijn een voorbeeld. Jouw sensor geeft andere getallen: dat hangt af van de sensor, het licht in de klas en de bal. Daarom kies je in stap 2 een grens met de getallen die jij in stap 1 hebt opgeschreven.

{/* stijl-uitzondering: uitroepteken citaat van de tekst die het programma op het scherm zet */}

1. Schuif de bal naar de sensor. Wat doet het getal?
2. Laat de grens op 300 staan. Bij welke afstanden verschijnt "klaar om te golfen!"?
3. Kies een grens zodat de zin verschijnt als de bal op 3 cm of dichterbij ligt, en niet als hij verder weg ligt.
4. Zet een vinkje bij **Geen bal** en schuif de grens helemaal naar rechts. Wat zie je?

<details>
<summary>Antwoord</summary>

1. Het getal wordt lager als de bal dichterbij komt. Zonder bal is het het hoogst.
2. Op 2 cm en dichterbij. Op 3 cm is het getal 399, en dat is niet kleiner dan 300.
3. Een grens van 400 tot en met 550, bijvoorbeeld 500. Op 3 cm is het getal 399 en op 4 cm 555. Je grens moet daar tussenin liggen.
4. De zin verschijnt, terwijl er geen bal ligt. Je grens is dan hoger dan het getal zonder bal, en je robot denkt steeds dat er een bal ligt.

</details>

## Stap 2: reageren op de bal

Nu laat je de robot zelf beslissen. Met het blok **als … dan** uit **Denk stappen** kijk je of het getal kleiner is dan een grens. In **Denk stappen** staan twee blokken **als**: neem het eerste, zonder **anders**. In het voorbeeld is die grens **300**. Je bouwt verder op het programma van stap 1:

1. Sleep als … dan in herhaal voor altijd, helemaal bovenaan. Toon op scherm en duurt schuiven eronder.
2. Sleep Toon op scherm in het gat onder als … dan. Het blok duurt gaat mee, want een blok neemt alles eronder mee. Sleep duurt daarna terug, onder als … dan.
3. Het vergelijkblok vind je in **Getal blokken**. In Easybloqs staat er eerst `1 = 1` in. Sleep het in het gat achter het woord als.
4. Sleep Lees anapin A0 uit Toon op scherm naar het linkervakje van het vergelijkblok. In Toon op scherm komt het tekstvakje terug: typ daarin `klaar om te golfen!`.
5. Klik op het `=` en kies in het keuzelijstje **`<`**. Typ in het rechtervakje je grens.

<Blokken programma={balKlaar} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: als Lees anapin A0 kleiner is dan 300, dan Toon op scherm 'klaar om te golfen!'. Daarna duurt 500 ms." />

{/* stijl-uitzondering: uitroepteken citaat van de tekst die het programma op het scherm zet */}

Is het getal kleiner dan 300, dan ligt er een bal en verschijnt "klaar om te golfen!" op het scherm.

:::tip
300 is maar een voorbeeld. Gebruik de getallen die jij in stap 1 hebt opgeschreven, en kies een grens die er netjes tussenin ligt.
:::

## Er gaat iets mis

<Probleem titel="Het getal op het scherm verandert niet als je een bal voor de sensor legt.">

**Oorzaak:** de oranje draad zit niet op het signaal van A0, of de sensor krijgt geen stroom.

**Oplossing:** zet je robot uit en vergelijk je draden met de tabel bij Aansluiten: oranje op het signaal van A0, rood op 5V en zwart op GND.

</Probleem>

{/* stijl-uitzondering: uitroepteken citaat van de tekst die het programma op het scherm zet */}

<Probleem titel="Er verschijnt nooit 'klaar om te golfen!', ook niet met een bal.">

**Oorzaak:** in het vergelijkblok staat nog **`=`**, of de grens klopt niet. Met **`=`** moet het getal precies gelijk zijn aan je grens, en dat gebeurt bijna nooit.

**Oplossing:** klik op het teken in het vergelijkblok en kies **`<`**. Kies als grens een getal tussen je twee getallen uit stap 1.

**Zelf vinden:** kijk naar het getal dat je in stap 1 met een bal opschreef. Is dat kleiner dan je grens, dan ligt het aan het teken.

</Probleem>

<Voorspel soort="Controlevraag" vraag="De sensor heeft twee pinnen waar een signaal uit komt: A0 en D0. Welke van de twee sluit je aan?">
  <Keuze goed uitleg="A0 geeft een getal, en met een getal kies je zelf een grens.">A0, op het signaal van A0 op het shield</Keuze>
  <Keuze uitleg="D0 van de sensor geeft alleen ja of nee. Dan ligt de grens al vast, en kun je hem niet zelf kiezen.">D0, want die zegt meteen of er een bal ligt</Keuze>
  <Keuze uitleg="Je programma leest maar één pin van de sensor. Een tweede draad doet dus niets.">Allebei</Keuze>
  <Uitleg>

Sluit **A0** van de sensor aan op het signaal van **A0** op het shield. Het getal dat je daar leest, vergelijk je in je programma met je eigen grens.

  </Uitleg>
</Voorspel>

Ziet je robot de bal? Dan leer je nu [de servo](servo) bewegen.
