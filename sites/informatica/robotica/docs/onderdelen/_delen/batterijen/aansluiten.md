### Stap 1: meet elke batterij na

Meet met je multimeter (op **DC voltage**) de spanning van iedere AA-batterij.

| Soort batterij | Vol | Vervangen of opladen onder |
|---|:---:|:---:|
| Gewone (alkaline) | ongeveer 1,5V | 1,2V |
| Oplaadbaar (NiMH) | ongeveer 1,3V | 1,1V |

Een oplaadbare batterij geeft vol al minder dan een gewone. Met zes oplaadbare
krijg je dus ongeveer 7,5V in plaats van 9V, en dat is genoeg voor het shield.

:::tip[Nog nooit een multimeter gebruikt?]

Kijk eerst even bij [Meten met een multimeter](site:robotica/docs/onderdelen/meten).

:::

<details>
<summary>Welke instellingen heb ik nodig?</summary>

Zet de multimeter op **DC voltage** (V met een streepje). Rode meetpen op de plus (+), zwarte meetpen op de min (-). Je leest een waarde rond de 1,5V af.

</details>

### Stap 2: meet de batterijhouder na

Plaats alle batterijen in de houder. Meet de spanning aan de **rode en zwarte draad** die eruit komen. Verwacht: ongeveer **9V** met gewone batterijen, ongeveer **7,5V** met oplaadbare.

<details>
<summary>Ik meet een veel lagere spanning</summary>

- Zit elke batterij goed om (let op + en -)?
- Meet elke batterij apart na — misschien is er eentje leeg.
- Zitten de draden van de houder niet los?

</details>

### Stap 3: batterijhouder op het shield

![Aansluitschema: de batterijhouder met de rode draad op de plus en de zwarte draad op de min van het shield](../../img/batterijen/shield_battery_pack_bb.png)

Sluit de **rode** draad aan op de plus en de **zwarte** draad aan op de min van het shield (zie afbeelding). Zet daarna de schakelaar op het shield op **ON**.

Als alles goed is, zie je een **groen lampje** op de microcontroller branden.

<details>
<summary>Het groene lampje brandt niet</summary>

- Staat de schakelaar op **ON**?
- Zitten de draden goed vast?
- Meet de batterijhouder opnieuw (Stap 2).

</details>
