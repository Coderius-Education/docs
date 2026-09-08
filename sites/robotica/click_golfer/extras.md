---
sidebar_position: 8
---

# Extra's

Je Golfer werkt. Wil je meer? Hier zijn drie extra's voor de golfrobot. Ze zijn wat lastiger, dus pak ze een voor een aan.

## Een lampje dat meekleurt

In het doosje zit ook een **RGB-lampje**: een lampje dat verschillende kleuren kan maken. Zorg dat:

- het lampje **groen** wordt als er een balletje ligt en de robot aan het slaan is;
- het lampje **rood** wordt als er geen balletje ligt en de robot stilstaat.

Bekijk [deze video](https://www.youtube.com/watch?v=bqGnmGiuqyc) om uit te vinden hoe je het lampje moet aansluiten.

<details>
<summary>Klik hier voor een tip!</summary>

Gebruik een **als … dan … anders**-blok. Ziet de sensor een balletje: maak het lampje groen en laat de robot slaan. Ziet de sensor niets: maak het lampje rood.

</details>

<details>
<summary>Klik hier voor het antwoord!</summary>

Je bouwt hetzelfde **als**-blok als bij [Een bal detecteren](bal-detecteren), maar nu met een **anders**-tak erbij:

- **als** `Read anapin A0` groter is dan jouw grens → zet het lampje op groen en laat de arm slaan;
- **anders** → zet het lampje op rood.

Het slaan zat al in je programma van [Hole in one](hole-in-one); dat blok sleep je in de **dan**-tak. De kleur zet je met het RGB-blok uit de video: groen is rood 0, groen 255, blauw 0, en rood is rood 255, groen 0, blauw 0.

</details>

## Willekeurig mikken

Nu mikt je Golfer altijd met dezelfde waarde: 50 graden. Pas het subprogramma **Mikken** aan zodat het een willekeurig aantal graden tussen de 40 en de 70 gebruikt, in plaats van de vaste waarde 50.

<details>
<summary>Klik hier voor een tip!</summary>

Er bestaat een blok dat een **willekeurig getal** tussen twee waardes geeft. Zet dat blok op de plek waar nu 50 staat, en kies 40 als laagste en 70 als hoogste waarde.

</details>

<details>
<summary>Klik hier voor het antwoord!</summary>

Open het subprogramma **Mikken**. Daar staat het getal 50 ingevuld. Trek dat getal eruit en zet er het blok **willekeurig getal tussen … en …** voor in de plaats, met 40 in het eerste vakje en 70 in het tweede.

Laat je robot nu een paar keer slaan. Elke slag is net iets anders, want het blok kiest telkens een nieuw getal.

</details>

## Print het hoofd van je Golfer

Wil je je Golfer een echt hoofd geven? Dat ontwerp en print je zelf met een 3D-printer. Hier hoort geen antwoord bij: elk hoofd is goed, zolang het op je Golfer past.

1. Ontwerp het hoofd in **TinkerCAD**. Volg de uitleg op [MakerSpace – TinkerCAD](https://maken.wikiwijs.nl/220905/MakerSpace#!page-8481694).
2. Print je ontwerp met **FlashPrint**. Volg de uitleg op [MakerSpace – FlashPrint](https://maken.wikiwijs.nl/220905/MakerSpace#!page-8702784).
