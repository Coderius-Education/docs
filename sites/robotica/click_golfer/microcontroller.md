---
sidebar_position: 2
---

# De microcontroller

Het brein van je Click Golfer is een **microcontroller**: een heel klein computertje op één plaatje. Hij doet precies wat jouw programma zegt. Jouw microcontroller heet **Arduino Nano**.

## Pinnen

Langs de randen van de Arduino zitten pootjes: de **pinnen**. Op een pin sluit je een onderdeel aan, zoals een sensor of een motor. Elke pin heeft een naam:

- **A0** tot en met **A7**: hier lees je een getal uit. Daar komt straks de sensor op.
- **D2** tot en met **D13**: hiermee stuur je iets aan, zoals straks de motor.

## Het shield

De Arduino zit vast op een groene plaat: het **shield**. Daarmee sluit je makkelijk iets aan, zonder solderen.

![Het groene shield met in het midden de blauwe Arduino Nano. Links zit een sensor vast op de rij van A0, rechts een servomotor op de rij van D9. Onderaan zitten de aan-uitknop en de aansluiting voor de stroom.](@site/static/fritzing/click_golfer_bb.png)

Naast elke pin van de Arduino zitten op het shield drie pinnetjes op een rij:

| Pinnetje | Waarvoor |
|---|---|
| Signaal | het getal of het bericht van de pin, bijvoorbeeld **A0** |
| 5V | stroom voor het onderdeel |
| GND | de min, de weg terug voor de stroom |

Een onderdeel heeft daarom meestal drie draadjes: een voor het signaal, een voor 5V en een voor GND.

Boven de rijen staat bij twee pinnetjes `<5V` en `<GND`. Bij het signaal staat niets. Dat is het pinnetje het dichtst bij de naam van de pin, zoals **A0/D14** of **D9**. Bij A0 staat ook D14: die pin heeft twee namen. In deze lessen heet hij A0.

Onderaan het shield zit een schuifknop, **ON/OFF**, waarmee je je robot aan- en uitzet. Zet hem uit voordat je iets aansluit, en weer aan voordat je een programma test.

![Uitsnede van het shield: het schuifje met ON links en OFF rechts, naast de tekst VIN = 3-16Vdc.](@site/static/fritzing/click_golfer_aan-uit.png)

<Voorspel soort="Controlevraag" vraag="Waarom heeft elke pin op het shield drie pinnetjes, en niet één?">
  <Keuze uitleg="Op een rij komt maar één onderdeel. Zet je er meer op, dan weet je robot niet van welk onderdeel het signaal komt.">Zodat je drie onderdelen op één pin kunt aansluiten</Keuze>
  <Keuze goed uitleg="Zonder stroom werkt een sensor of motor niet, ook als het signaal goed aankomt.">Eén voor het signaal, en twee voor de stroom</Keuze>
  <Keuze uitleg="Elk pinnetje heeft zijn eigen taak: signaal, 5V of GND. Ze zijn niet hetzelfde, dus het ene kan het andere niet vervangen.">Als reserve, voor als er een kapotgaat</Keuze>
  <Uitleg>

Een onderdeel heeft behalve het signaal ook stroom nodig. Twee pinnetjes, **5V** en **GND**, geven die stroom. Over het derde gaat het signaal.

  </Uitleg>
</Voorspel>

Weet je hoe het shield werkt? Dan ga je nu [programmeren in Easybloqs](easybloqs).
