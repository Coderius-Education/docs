---
sidebar_position: 11
---
import Blokken from '@site/src/components/Blokken';
import willekeurigSlaan from './blokken/willekeurig-slaan.json';
import lampje from './blokken/lampje.json';

# Extra's

Je Golfer werkt. Hieronder staan drie dingen die je er nog bij kunt maken. Ze zijn lastiger dan wat je tot nu toe deed, dus neem ze een voor een.

## Een lampje dat meekleurt

Voor deze extra heb je een **RGB-lampje** nodig: een lampje met vier pootjes dat verschillende kleuren kan maken. Niet elk RGB-lampje is goed. Het moet er een zijn met een gemeenschappelijke min, en met een weerstand voor elke kleur, want zonder weerstand gaat er te veel stroom door het lampje. Zo'n lampje zit bijvoorbeeld op een klein bordje waar de weerstanden al op zitten. Je docent geeft je het goede lampje en drie losse draadjes.

Zorg dat:

- het lampje **groen** wordt als er een balletje ligt en de robot aan het slaan is;
- het lampje **rood** wordt als er geen balletje ligt en de robot stilstaat.

In **Actuatoren** staat ook een blok **Led**, met Rood, Groen en Blauw. Dat blok kun je hier niet gebruiken.

Het stuurt de pinnen **D11** (rood), **D10** (groen), **D9** (blauw) en **D8** (min) aan, en op D9 zit je servo al. Blauw laat je daarom weg.

Je neemt het blok **Zet PWM**, ook uit Actuatoren: één keer voor rood en één keer voor groen. Een nieuw blok staat eerst op **Zet PWM 3 op 0**. Klik op de 3 en kies **11** of **10**.

1. Vraag je docent welk pootje van het lampje rood is, welk groen en welk de min.
2. Zet je robot uit met **ON/OFF**. Zit er van [Oefenen](oefenen) nog een tweede servo op D10? Haal die dan los, want daar komt nu groen.
3. Sluit rood aan op het signaal van **D11**, groen op het signaal van **D10**, en de min op GND. Het blauwe pootje sluit je niet aan. Zet je robot daarna weer aan met **ON/OFF**.
4. **Zet PWM 11 op 255** maakt het lampje rood. Met Zet PWM 11 op 0 gaat rood weer uit. Met pin 10 doe je hetzelfde voor groen.

<details>
<summary>Tip</summary>

Gebruik een **als … dan … anders**-blok: in **Denk stappen** staat onder **als … dan** een tweede **als**-blok, met **anders** erbij. Ziet de sensor een balletje, dan maak je het lampje groen en laat je de robot slaan. Ziet hij niets, dan wordt het lampje rood.

</details>

<details>
<summary>Antwoord</summary>

Je bouwt hetzelfde **als**-blok als bij [de IR-sensor](ir-sensor), maar nu met een **anders**-tak erbij:

- als **Lees anapin A0** kleiner is dan jouw grens: zet het lampje op groen en laat de arm slaan;
- anders: zet het lampje op rood.

Het slaan heb je al, in je programma uit [Een naam voor je blokken](subprogrammas). Pak het bovenste blok in de dan-tak van je oude **als … dan** en sleep het, met alles eronder, naar de dan-tak van het nieuwe blok. Zet bovenaan in de dan-tak de twee **Zet PWM**-blokken voor groen: Zet PWM 11 op 0 (rood uit) en Zet PWM 10 op 255 (groen aan). In de anders-tak komen Zet PWM 11 op 255 (rood aan) en Zet PWM 10 op 0 (groen uit).

<Blokken programma={lampje} beschrijving="Leaphy, met daarin herhaal voor altijd. Daarin: als Lees anapin A0 kleiner is dan 300, dan Zet PWM 11 op 0, Zet PWM 10 op 255, Servo 9 op 0, duurt 500 ms, mikken en slaan. Anders: Zet PWM 11 op 255 en Zet PWM 10 op 0. Daaronder de subprogramma's mikken en slaan, net als bij Een naam voor je blokken." />

</details>

## Willekeurig slaan

Nu slaat je Golfer altijd naar dezelfde stand: [de servo](servo) op **D9** gaat naar 90 graden. Pas het subprogramma `slaan` uit [Een naam voor je blokken](subprogrammas) aan, zodat de arm telkens naar een willekeurige stand tussen 70 en 110 graden gaat.

<details>
<summary>Tip</summary>

In de groep **Getal blokken** staat een blok dat een **willekeurig getal** tussen twee waardes geeft. Zet dat blok op de plek waar nu 90 staat.

</details>

<details>
<summary>Antwoord</summary>

<Blokken programma={willekeurigSlaan} beschrijving="Het subprogramma slaan: Servo 9 op willekeurig getal van 70 tot 110, duurt 2000 ms." />

Laat je robot nu een paar keer slaan. Elke slag is net iets anders, want het blok kiest telkens een nieuw getal. Druk je op **RST**, dan begint de robot wel weer met dezelfde rij getallen.

</details>

## Print het hoofd van je Golfer

Wil je je Golfer een echt hoofd geven? Dat ontwerp en print je zelf met een 3D-printer. Hier hoort geen antwoord bij: elk hoofd is goed, zolang het op je Golfer past.

1. Ontwerp het hoofd in **TinkerCAD**. Volg de uitleg op [MakerSpace – TinkerCAD](https://maken.wikiwijs.nl/220905/MakerSpace#!page-8481694).
2. Print je ontwerp met **FlashPrint**. Volg de uitleg op [MakerSpace – FlashPrint](https://maken.wikiwijs.nl/220905/MakerSpace#!page-8702784).
